from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from app.models.inventory_transaction import TransactionType

class InventoryTransactionCreate(BaseModel):
    sparePartId: int = Field(..., description="ID of the spare part")
    transactionType: str = Field(..., description="Type of transaction: IN, OUT, ADJUSTMENT, TRANSFER")
    quantity: int = Field(..., gt=0, description="Transaction quantity (must be positive)")
    unitPrice: Optional[float] = Field(None, ge=0, description="Unit price of the transaction")
    referenceType: Optional[str] = Field(None, description="Reference type: PURCHASE, MAINTENANCE, ADJUSTMENT, TRANSFER, RETURN")
    referenceNumber: Optional[str] = Field(None, max_length=100, description="Reference number")
    notes: Optional[str] = Field(None, description="Additional notes")
    transactionDate: Optional[datetime] = Field(None, description="Transaction date (defaults to now)")

    @validator('transactionType')
    def validate_transaction_type(cls, v):
        valid_types = [e.value for e in TransactionType]
        if v not in valid_types:
            raise ValueError(f'transactionType must be one of: {", ".join(valid_types)}')
        return v

    @validator('referenceType')
    def validate_reference_type(cls, v):
        if v is not None:
            valid_types = ["PURCHASE", "MAINTENANCE", "ADJUSTMENT", "TRANSFER", "RETURN"]
            if v not in valid_types:
                raise ValueError(f'referenceType must be one of: {", ".join(valid_types)}')
        return v

class InventoryTransactionUpdate(BaseModel):
    unitPrice: Optional[float] = Field(None, ge=0, description="Unit price (for corrections)")
    notes: Optional[str] = Field(None, description="Additional notes (for corrections)")

class InventoryTransactionResponse(BaseModel):
    id: int
    sparePartId: int
    sparePartNumber: Optional[str] = None
    sparePartName: Optional[str] = None
    transactionType: str
    quantity: int
    unitPrice: Optional[float]
    totalValue: Optional[float]
    referenceType: Optional[str]
    referenceNumber: Optional[str]
    notes: Optional[str]
    transactionDate: datetime
    performedById: Optional[int]
    performedByName: Optional[str] = None
    beforeQuantity: Optional[int] = None
    afterQuantity: Optional[int] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class InventoryTransactionListResponse(BaseModel):
    transactions: List[InventoryTransactionResponse]
    total: int
    page: int
    pageSize: int
    totalPages: int

