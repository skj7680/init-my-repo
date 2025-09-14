from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from app.database import get_db
from app.models import Animal, Farm, MilkRecord, DiseaseRecord
from app.schemas import (
    Animal as AnimalSchema, 
    AnimalCreate, 
    AnimalUpdate,
    MilkRecord as MilkRecordSchema
)
from app.auth import get_current_active_user, get_farmer_or_vet_user
from app.models import User

router = APIRouter(prefix="/api/animals", tags=["animals"])

@router.get("/", response_model=List[AnimalSchema])
async def get_animals(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    farm_id: Optional[int] = Query(None),
    breed: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get animals with filtering and pagination"""
    query = db.query(Animal)
    
    # Role-based filtering
    if current_user.role == "farmer":
        # Farmers can only see animals from their own farms
        user_farm_ids = db.query(Farm.id).filter(Farm.owner_id == current_user.id).subquery()
        query = query.filter(Animal.farm_id.in_(user_farm_ids))
    elif current_user.role == "vet":
        # Vets can see all animals (for now - could be restricted by region/assignment)
        pass
    # Admins can see all animals
    
    # Apply filters
    if farm_id:
        query = query.filter(Animal.farm_id == farm_id)
    if breed:
        query = query.filter(Animal.breed.ilike(f"%{breed}%"))
    if is_active is not None:
        query = query.filter(Animal.is_active == is_active)
    
    animals = query.offset(skip).limit(limit).all()
    return animals

@router.get("/{animal_id}", response_model=AnimalSchema)
async def get_animal(
    animal_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific animal with milk history"""
    animal = db.query(Animal).options(
        joinedload(Animal.milk_records),
        joinedload(Animal.disease_records)
    ).filter(Animal.id == animal_id).first()
    
    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")
    
    # Check permissions
    if current_user.role == "farmer":
        farm = db.query(Farm).filter(Farm.id == animal.farm_id).first()
        if not farm or farm.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this animal")
    
    return animal

@router.post("/", response_model=AnimalSchema)
async def create_animal(
    animal_data: AnimalCreate,
    current_user: User = Depends(get_farmer_or_vet_user),
    db: Session = Depends(get_db)
):
    """Create a new animal"""
    # Check if farm exists and user has permission
    farm = db.query(Farm).filter(Farm.id == animal_data.farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    if current_user.role == "farmer" and farm.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to add animals to this farm")
    
    # Check if tag number is unique
    existing_animal = db.query(Animal).filter(Animal.tag_number == animal_data.tag_number).first()
    if existing_animal:
        raise HTTPException(status_code=400, detail="Tag number already exists")
    
    db_animal = Animal(**animal_data.dict())
    db.add(db_animal)
    db.commit()
    db.refresh(db_animal)
    
    return db_animal

@router.put("/{animal_id}", response_model=AnimalSchema)
async def update_animal(
    animal_id: int,
    animal_data: AnimalUpdate,
    current_user: User = Depends(get_farmer_or_vet_user),
    db: Session = Depends(get_db)
):
    """Update an animal"""
    animal = db.query(Animal).filter(Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")
    
    # Check permissions
    if current_user.role == "farmer":
        farm = db.query(Farm).filter(Farm.id == animal.farm_id).first()
        if not farm or farm.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this animal")
    
    # Check tag number uniqueness if being updated
    if animal_data.tag_number and animal_data.tag_number != animal.tag_number:
        existing_animal = db.query(Animal).filter(Animal.tag_number == animal_data.tag_number).first()
        if existing_animal:
            raise HTTPException(status_code=400, detail="Tag number already exists")
    
    # Update fields
    update_data = animal_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(animal, field, value)
    
    db.commit()
    db.refresh(animal)
    
    return animal

@router.delete("/{animal_id}")
async def delete_animal(
    animal_id: int,
    current_user: User = Depends(get_farmer_or_vet_user),
    db: Session = Depends(get_db)
):
    """Delete (deactivate) an animal"""
    animal = db.query(Animal).filter(Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")
    
    # Check permissions
    if current_user.role == "farmer":
        farm = db.query(Farm).filter(Farm.id == animal.farm_id).first()
        if not farm or farm.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this animal")
    
    # Soft delete by setting is_active to False
    animal.is_active = False
    db.commit()
    
    return {"message": "Animal deactivated successfully"}

@router.get("/{animal_id}/milk-history", response_model=List[MilkRecordSchema])
async def get_animal_milk_history(
    animal_id: int,
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get milk production history for an animal"""
    animal = db.query(Animal).filter(Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")
    
    # Check permissions
    if current_user.role == "farmer":
        farm = db.query(Farm).filter(Farm.id == animal.farm_id).first()
        if not farm or farm.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this animal's data")
    
    # Get recent milk records
    from datetime import datetime, timedelta
    cutoff_date = datetime.now().date() - timedelta(days=days)
    
    milk_records = db.query(MilkRecord).filter(
        and_(
            MilkRecord.animal_id == animal_id,
            MilkRecord.date >= cutoff_date
        )
    ).order_by(MilkRecord.date.desc()).all()
    
    return milk_records
