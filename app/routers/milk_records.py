from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from app.database import get_db
from app.models import MilkRecord, Animal, Farm, User
from app.schemas import MilkRecord as MilkRecordSchema, MilkRecordCreate
from app.auth import get_current_active_user, get_farmer_or_vet_user

router = APIRouter(prefix="/api/milk-records", tags=["milk records"])

@router.get("/", response_model=List[MilkRecordSchema])
async def get_milk_records(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    animal_id: Optional[int] = Query(None),
    farm_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get milk records with filtering"""
    query = db.query(MilkRecord).join(Animal)
    
    # Role-based filtering
    if current_user.role == "farmer":
        query = query.join(Farm).filter(Farm.owner_id == current_user.id)
    
    # Apply filters
    if animal_id:
        query = query.filter(MilkRecord.animal_id == animal_id)
    if farm_id:
        query = query.filter(Animal.farm_id == farm_id)
    if date_from:
        query = query.filter(MilkRecord.date >= date_from)
    if date_to:
        query = query.filter(MilkRecord.date <= date_to)
    
    records = query.order_by(MilkRecord.date.desc()).offset(skip).limit(limit).all()
    return records

@router.post("/", response_model=MilkRecordSchema)
async def create_milk_record(
    record_data: MilkRecordCreate,
    current_user: User = Depends(get_farmer_or_vet_user),
    db: Session = Depends(get_db)
):
    """Create a new milk record"""
    # Check if animal exists and user has permission
    animal = db.query(Animal).join(Farm).filter(Animal.id == record_data.animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")
    
    if current_user.role == "farmer" and animal.farm.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to add records for this animal")
    
    # Check if record already exists for this date
    existing_record = db.query(MilkRecord).filter(
        and_(
            MilkRecord.animal_id == record_data.animal_id,
            MilkRecord.date == record_data.date
        )
    ).first()
    
    if existing_record:
        raise HTTPException(status_code=400, detail="Milk record already exists for this date")
    
    # Calculate total
    total_l = record_data.morning_l + record_data.evening_l
    
    db_record = MilkRecord(**record_data.dict(), total_l=total_l)
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    
    return db_record

@router.get("/summary")
async def get_milk_summary(
    farm_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get milk production summary"""
    query = db.query(
        func.sum(MilkRecord.total_l).label('total_production'),
        func.avg(MilkRecord.total_l).label('average_daily'),
        func.count(MilkRecord.id).label('record_count'),
        func.count(func.distinct(MilkRecord.animal_id)).label('animal_count')
    ).join(Animal)
    
    # Role-based filtering
    if current_user.role == "farmer":
        query = query.join(Farm).filter(Farm.owner_id == current_user.id)
    
    # Apply filters
    if farm_id:
        query = query.filter(Animal.farm_id == farm_id)
    if date_from:
        query = query.filter(MilkRecord.date >= date_from)
    if date_to:
        query = query.filter(MilkRecord.date <= date_to)
    
    result = query.first()
    
    return {
        "total_production_liters": float(result.total_production or 0),
        "average_daily_liters": float(result.average_daily or 0),
        "total_records": result.record_count,
        "animals_producing": result.animal_count,
        "date_range": {
            "from": date_from,
            "to": date_to
        }
    }
