from sqlalchemy import Column, String, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Department(BaseModel):
    __tablename__ = "departments"
    
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    
    # Relationships
    machines = relationship("Machine", back_populates="department")
    
    def __repr__(self):
        return f"<Department(name='{self.name}')>"
