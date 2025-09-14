from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime

# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: str = "farmer"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

# Farm schemas
class FarmBase(BaseModel):
    name: str
    location: Optional[str] = None
    timezone: str = "UTC"

class FarmCreate(FarmBase):
    pass

class FarmUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    timezone: Optional[str] = None

class Farm(FarmBase):
    id: int
    owner_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Animal schemas
class AnimalBase(BaseModel):
    tag_number: str
    breed: Optional[str] = None
    dob: Optional[date] = None
    sex: Optional[str] = None
    parity: int = 0
    current_weight: Optional[float] = None
    lactation_start_date: Optional[date] = None

class AnimalCreate(AnimalBase):
    farm_id: int

class AnimalUpdate(BaseModel):
    tag_number: Optional[str] = None
    breed: Optional[str] = None
    dob: Optional[date] = None
    sex: Optional[str] = None
    parity: Optional[int] = None
    current_weight: Optional[float] = None
    lactation_start_date: Optional[date] = None
    is_active: Optional[bool] = None

class Animal(AnimalBase):
    id: int
    farm_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Milk record schemas
class MilkRecordBase(BaseModel):
    date: date
    morning_l: float = 0.0
    evening_l: float = 0.0
    fat_percentage: Optional[float] = None
    protein_percentage: Optional[float] = None
    somatic_cell_count: Optional[int] = None

class MilkRecordCreate(MilkRecordBase):
    animal_id: int

class MilkRecord(MilkRecordBase):
    id: int
    animal_id: int
    total_l: Optional[float] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Disease record schemas
class DiseaseRecordBase(BaseModel):
    disease_name: str
    diagnosis_date: date
    severity: Optional[str] = None
    treatment: Optional[str] = None
    recovery_date: Optional[date] = None
    vet_notes: Optional[str] = None

class DiseaseRecordCreate(DiseaseRecordBase):
    animal_id: int

class DiseaseRecord(DiseaseRecordBase):
    id: int
    animal_id: int
    is_resolved: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Prediction schemas
class MilkPredictionRequest(BaseModel):
    animal_id: str
    breed: str
    age_months: int
    parity: int
    weight_kg: float
    feed_quantity_kg: float
    protein_content_percent: float
    temperature_c: float
    humidity_percent: float
    activity_hours: float
    rumination_hours: float
    health_score: float

class MilkPredictionResponse(BaseModel):
    animal_id: str
    predicted_milk_yield: float
    confidence_score: float
    factors: dict

class DiseasePredictionRequest(BaseModel):
    animal_id: str
    breed:str
    age_months: int
    parity: int
    health_score: float
    activity_hours: float
    rumination_hours: float
    milk_yield_trend: float
    temperature_c: float
    humidity_percent: float

class DiseasePredictionResponse(BaseModel):
    animal_id: str
    disease_risk: float
    risk_level: str  # low, medium, high, critical
    recommended_actions: List[str]
    confidence_score: float

# Alert schemas
class AlertBase(BaseModel):
    alert_type: str
    severity: str = "medium"
    message: str

class AlertCreate(AlertBase):
    animal_id: Optional[int] = None
    farm_id: Optional[int] = None

class Alert(AlertBase):
    id: int
    animal_id: Optional[int] = None
    farm_id: Optional[int] = None
    is_resolved: bool
    created_at: datetime
    resolved_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
