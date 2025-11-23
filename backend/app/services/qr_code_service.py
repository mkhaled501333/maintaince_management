import qrcode
import qrcode.image.svg
import uuid
import base64
import io
from typing import Optional
from sqlalchemy.orm import Session
from app.models.machine import Machine

class QRCodeService:
    """Service for generating and managing QR codes for machines"""
    
    @staticmethod
    def generate_unique_qr_code() -> str:
        """Generate a unique QR code identifier"""
        return str(uuid.uuid4())
    
    @staticmethod
    def generate_qr_code_image(qr_data: str, size: int = 200) -> str:
        """Generate QR code image as base64 string"""
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Resize image
        img = img.resize((size, size))
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{img_str}"
    
    @staticmethod
    def generate_machine_qr_data(machine_id: int, qr_code: str) -> str:
        """Generate QR code data for machine lookup"""
        # QR code only contains the UUID, no database ID
        return qr_code
    
    @staticmethod
    def validate_qr_code_uniqueness(db: Session, qr_code: str, exclude_id: Optional[int] = None) -> bool:
        """Check if QR code is unique in the database"""
        query = db.query(Machine).filter(Machine.qrCode == qr_code)
        if exclude_id:
            query = query.filter(Machine.id != exclude_id)
        
        return query.first() is None
    
    @staticmethod
    def generate_qr_code_for_machine(db: Session, machine_id: int, exclude_id: Optional[int] = None) -> str:
        """Generate a unique QR code for a machine"""
        max_attempts = 10
        for _ in range(max_attempts):
            qr_code = QRCodeService.generate_unique_qr_code()
            if QRCodeService.validate_qr_code_uniqueness(db, qr_code, exclude_id):
                return qr_code
        
        raise ValueError("Unable to generate unique QR code after multiple attempts")
