from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import Farm, User
from app.schemas import Farm as FarmSchema, FarmCreate, FarmUpdate
from app.auth import get_current_active_user, get_farmer_user

router = APIRouter(prefix="/api/farms", tags=["farms"])

@router.get("/", response_model=List[FarmSchema])
async def get_farms(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get farms based on user role"""
    if current_user.role == "farmer":
        # Farmers can only see their own farms
        farms = db.query(Farm).filter(Farm.owner_id == current_user.id).all()
    else:
        # Vets and admins can see all farms
        farms = db.query(Farm).all()
    
    return farms

@router.get("/{farm_id}", response_model=FarmSchema)
async def get_farm(
    farm_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific farm"""
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    # Check permissions
    if current_user.role == "farmer" and farm.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this farm")
    
    return farm

@router.post("/", response_model=FarmSchema)
async def create_farm(
    farm_data: FarmCreate,
    current_user: User = Depends(get_farmer_user),
    db: Session = Depends(get_db)
):
    """Create a new farm"""
    db_farm = Farm(**farm_data.dict(), owner_id=current_user.id)
    db.add(db_farm)
    db.commit()
    db.refresh(db_farm)
    
    return db_farm

@router.put("/{farm_id}", response_model=FarmSchema)
async def update_farm(
    farm_id: int,
    farm_data: FarmUpdate,
    current_user: User = Depends(get_farmer_user),
    db: Session = Depends(get_db)
):
    """Update a farm"""
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    # Check ownership
    if farm.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this farm")
    
    # Update fields
    update_data = farm_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(farm, field, value)
    
    db.commit()
    db.refresh(farm)
    
    return farm
