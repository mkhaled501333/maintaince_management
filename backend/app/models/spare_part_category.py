from sqlalchemy import Column, String, Text, Boolean
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class SparePartCategory(BaseModel):
    __tablename__ = "sparepart_categories"

    name = Column(String(200), nullable=False)
    code = Column(String(50), nullable=True, unique=True)
    description = Column(Text, nullable=True)
    isActive = Column(Boolean, default=True, nullable=False)

    spareParts = relationship("SparePart", back_populates="category")

    def __repr__(self) -> str:
        return f"<SparePartCategory(name='{self.name}', code='{self.code}')>"

