from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import uuid4
import os
import shutil

from app.core.database import get_db
from app.core.config import settings
from app.core.deps import get_current_user
from app.models.attachment import Attachment
from app.models.user import User
from app.schemas.attachment import AttachmentResponse
from datetime import datetime, timezone


router = APIRouter()


def ensure_upload_dir_exists(upload_dir: str) -> None:
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir, exist_ok=True)


def sanitize_filename(filename: str) -> str:
    # Very basic sanitization: remove path separators
    return filename.replace("/", "_").replace("\\", "_")


@router.post("/", response_model=AttachmentResponse, status_code=status.HTTP_201_CREATED)
async def upload_attachment(
    request: Request,
    entityType: str = Form(...),
    entityId: int = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate file size if provided by client (optional); enforce hard limit during write
    ensure_upload_dir_exists(settings.UPLOAD_DIR)

    original_name = sanitize_filename(file.filename or "upload")
    extension = os.path.splitext(original_name)[1]
    generated_name = f"{uuid4().hex}{extension}"
    dest_path = os.path.join(settings.UPLOAD_DIR, generated_name)

    # Validate mime type against allowed set
    allowed_prefixes = ("image/", "video/")
    allowed_exact = {
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
    }
    content_type = file.content_type or "application/octet-stream"
    if not (content_type.startswith(allowed_prefixes) or content_type in allowed_exact):
        raise HTTPException(status_code=415, detail="Unsupported media type")

    # Stream file to disk in binary mode to preserve original quality (no compression)
    # Files are saved exactly as uploaded, maintaining original image quality
    bytes_written = 0
    max_bytes = settings.MAX_FILE_SIZE
    with open(dest_path, "wb") as buffer:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            bytes_written += len(chunk)
            if bytes_written > max_bytes:
                buffer.close()
                # Remove partially written file
                try:
                    os.remove(dest_path)
                except OSError:
                    pass
                raise HTTPException(status_code=413, detail="File too large")
            # Write chunk directly without any processing - preserves original quality
            buffer.write(chunk)

    mime_type = content_type

    attachment = Attachment(
        fileName=generated_name,
        originalFileName=original_name,
        filePath=dest_path,
        fileSize=bytes_written,
        mimeType=mime_type,
        description=description,
        entityType=entityType,
        entityId=entityId,
        uploadedById=current_user.id,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    # Activity log: attachment created
    try:
        from app.services.audit_service import log_activity
        log_activity(
            db=db,
            userId=current_user.id,
            action="CREATE",
            entityType="ATTACHMENT",
            entityId=attachment.id,
            description=f"Attachment '{original_name}' uploaded",
            request=request
        )
        db.commit()
    except Exception:
        # Do not block the main flow if logging fails
        db.rollback()

    return attachment


@router.get("/{attachment_id}", response_model=AttachmentResponse)
def get_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    # Authorization for metadata: any authenticated user; actual file download served separately if needed
    return attachment


@router.get("/", response_model=List[AttachmentResponse])
def list_attachments(
    entityType: Optional[str] = Query(None),
    entityId: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Attachment)
    if entityType is not None:
        query = query.filter(Attachment.entityType == entityType)
    if entityId is not None:
        query = query.filter(Attachment.entityId == entityId)
    return query.order_by(Attachment.createdAt.desc()).all()


@router.delete("/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(
    attachment_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    # Only owners or admins can delete
    if attachment.uploadedById != current_user.id and current_user.role.name != "ADMIN":
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # Delete file from disk
    try:
        if os.path.exists(attachment.filePath):
            os.remove(attachment.filePath)
    except Exception:
        # Continue even if file removal fails; we still delete db record
        pass

    db.delete(attachment)
    db.commit()
    # Activity log: attachment deleted
    try:
        from app.services.audit_service import log_activity
        log_activity(
            db=db,
            userId=current_user.id,
            action="DELETE",
            entityType="ATTACHMENT",
            entityId=attachment_id,
            description=f"Attachment '{attachment.originalFileName}' deleted",
            request=request
        )
        db.commit()
    except Exception:
        db.rollback()
    return


@router.get("/{attachment_id}/file")
async def download_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download a file attachment"""
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    file_path = attachment.filePath
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
    
    return FileResponse(
        path=file_path,
        filename=attachment.originalFileName,
        media_type=attachment.mimeType
    )


@router.get("/{attachment_id}/view")
async def view_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """View a file attachment in browser"""
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    file_path = attachment.filePath
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
    
    return FileResponse(
        path=file_path,
        media_type=attachment.mimeType,
        headers={
            "Content-Disposition": f"inline; filename={attachment.originalFileName}",
            "Cache-Control": "private, max-age=3600"
        }
    )


