from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from app.database import Base
import datetime

class Farm(Base):
    __tablename__ = "farms"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String)
    timezone = Column(String, default="UTC")
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="farms")
    animals = relationship("Animal", back_populates="farm")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="farmer")  # farmer, vet, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    farms = relationship("Farm", back_populates="owner")

class Animal(Base):
    __tablename__ = "animals"
    
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    tag_number = Column(String, unique=True, index=True)
    breed = Column(String)
    dob = Column(Date)
    sex = Column(String)  # M, F
    parity = Column(Integer, default=0)  # Number of calvings
    current_weight = Column(Float)
    lactation_start_date = Column(Date)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    farm = relationship("Farm", back_populates="animals")
    milk_records = relationship("MilkRecord", back_populates="animal")
    feed_profiles = relationship("FeedProfile", back_populates="animal")
    disease_records = relationship("DiseaseRecord", back_populates="animal")
    sensor_readings = relationship("SensorReading", back_populates="animal")

class MilkRecord(Base):
    __tablename__ = "milk_records"
    
    id = Column(Integer, primary_key=True, index=True)
    animal_id = Column(Integer, ForeignKey("animals.id"), nullable=False)
    date = Column(Date, nullable=False)
    morning_l = Column(Float, default=0.0)
    evening_l = Column(Float, default=0.0)
    total_l = Column(Float)
    fat_percentage = Column(Float)
    protein_percentage = Column(Float)
    somatic_cell_count = Column(Integer)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    animal = relationship("Animal", back_populates="milk_records")

class FeedProfile(Base):
    __tablename__ = "feed_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    animal_id = Column(Integer, ForeignKey("animals.id"), nullable=False)
    date = Column(Date, nullable=False)
    feed_type = Column(String)
    quantity_kg = Column(Float)
    protein_content = Column(Float)
    energy_content = Column(Float)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    animal = relationship("Animal", back_populates="feed_profiles")

class DiseaseRecord(Base):
    __tablename__ = "disease_records"
    
    id = Column(Integer, primary_key=True, index=True)
    animal_id = Column(Integer, ForeignKey("animals.id"), nullable=False)
    disease_name = Column(String, nullable=False)
    diagnosis_date = Column(Date, nullable=False)
    severity = Column(String)  # mild, moderate, severe
    treatment = Column(Text)
    recovery_date = Column(Date)
    vet_notes = Column(Text)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    animal = relationship("Animal", back_populates="disease_records")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    animal_id = Column(Integer, ForeignKey("animals.id"))
    farm_id = Column(Integer, ForeignKey("farms.id"))
    alert_type = Column(String, nullable=False)  # health, milk_drop, feed
    severity = Column(String, default="medium")  # low, medium, high, critical
    message = Column(Text, nullable=False)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime)
    
    # Relationships
    animal = relationship("Animal")
    farm = relationship("Farm")

class SensorReading(Base):
    __tablename__ = "sensor_readings"
    
    id = Column(Integer, primary_key=True, index=True)
    animal_id = Column(Integer, ForeignKey("animals.id"), nullable=False)
    sensor_type = Column(String, nullable=False)  # temperature, activity, rumination
    value = Column(Float, nullable=False)
    unit = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    animal = relationship("Animal", back_populates="sensor_readings")
