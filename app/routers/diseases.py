from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.database import get_db
from app.models import DiseaseRecord, Animal, Farm, Alert, User
from app.schemas import (
    DiseaseRecord as DiseaseRecordSchema, 
    DiseaseRecordCreate,
    Alert as AlertSchema
)
from app.auth import get_current_active_user, get_farmer_or_vet_user, get_vet_user

router = APIRouter(prefix="/api/diseases", tags=["diseases"])

@router.get("/records", response_model=List[DiseaseRecordSchema])
async def get_disease_records(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    animal_id: Optional[int] = Query(None),
    farm_id: Optional[int] = Query(None),
    is_resolved: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get disease records with filtering"""
    query = db.query(DiseaseRecord).join(Animal)
    
    # Role-based filtering
    if current_user.role == "farmer":
        query = query.join(Farm).filter(Farm.owner_id == current_user.id)
    
    # Apply filters
    if animal_id:
        query = query.filter(DiseaseRecord.animal_id == animal_id)
    if farm_id:
        query = query.filter(Animal.farm_id == farm_id)
    if is_resolved is not None:
        query = query.filter(DiseaseRecord.is_resolved == is_resolved)
    
    records = query.order_by(DiseaseRecord.diagnosis_date.desc()).offset(skip).limit(limit).all()
    return records

@router.post("/records", response_model=DiseaseRecordSchema)
async def create_disease_record(
    record_data: DiseaseRecordCreate,
    current_user: User = Depends(get_vet_user),  # Only vets can create disease records
    db: Session = Depends(get_db)
):
    """Create a new disease record"""
    # Check if animal exists
    animal = db.query(Animal).filter(Animal.id == record_data.animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")
    
    db_record = DiseaseRecord(**record_data.dict())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    
    # Create alert for the farm owner
    alert = Alert(
        animal_id=animal.id,
        farm_id=animal.farm_id,
        alert_type="health",
        severity="high" if record_data.severity == "severe" else "medium",
        message=f"New disease diagnosis: {record_data.disease_name} for animal {animal.tag_number}"
    )
    db.add(alert)
    db.commit()
    
    return db_record

@router.get("/alerts", response_model=List[AlertSchema])
async def get_disease_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_resolved: Optional[bool] = Query(False),
    severity: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get disease-related alerts"""
    query = db.query(Alert).filter(Alert.alert_type == "health")
    
    # Role-based filtering
    if current_user.role == "farmer":
        user_farm_ids = db.query(Farm.id).filter(Farm.owner_id == current_user.id).subquery()
        query = query.filter(Alert.farm_id.in_(user_farm_ids))
    
    # Apply filters
    if is_resolved is not None:
        query = query.filter(Alert.is_resolved == is_resolved)
    if severity:
        query = query.filter(Alert.severity == severity)
    
    alerts = query.order_by(Alert.created_at.desc()).offset(skip).limit(limit).all()
    return alerts

@router.put("/alerts/{alert_id}/resolve")
async def resolve_alert(
    alert_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark an alert as resolved"""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Check permissions
    if current_user.role == "farmer":
        farm = db.query(Farm).filter(Farm.id == alert.farm_id).first()
        if not farm or farm.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to resolve this alert")
    
    alert.is_resolved = True
    alert.resolved_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Alert resolved successfully"}
