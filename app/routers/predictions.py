from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Animal, Farm, User
from app.schemas import (
    MilkPredictionRequest, 
    MilkPredictionResponse,
    DiseasePredictionRequest,
    DiseasePredictionResponse
)
from app.auth import get_current_active_user, get_farmer_or_vet_user
from ml.predict_service import prediction_service
from app.config import settings

router = APIRouter(prefix="/api/predict", tags=["predictions"])

@router.post("/milk", response_model=MilkPredictionResponse)
async def predict_milk_yield(
    request: MilkPredictionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Predict milk yield for a specific animal"""
    
    # Verify animal exists and user has permission
    # animal = db.query(Animal).filter(Animal.id == request.animal_id).first()
    # if not animal:
    #     raise HTTPException(status_code=404, detail="Animal not found")
    
    # # Check permissions
    # if current_user.role == "farmer":
    #     farm = db.query(Farm).filter(Farm.id == animal.farm_id).first()
    #     if not farm or farm.owner_id != current_user.id:
    #         raise HTTPException(status_code=403, detail="Not authorized to predict for this animal")
    
    # Use mock data if enabled
    # if settings.USE_MOCKS:
    #     return MilkPredictionResponse(
    #         animal_id=request.animal_id,
    #         predicted_milk_yield=22.5,
    #         confidence_score=0.85,
    #         factors={
    #             "health": "Good health supporting production",
    #             "nutrition": "Adequate feed quality",
    #             "environment": "Favorable conditions"
    #         }
    #     )
    
    # Prepare features for prediction
    features = {
        "breed": request.breed,
        "age_months": request.age_months,
        "parity": request.parity,
        "weight_kg": request.weight_kg,
        "feed_quantity_kg": request.feed_quantity_kg,
        "protein_content_percent": request.protein_content_percent,
        "temperature_c": request.temperature_c,
        "humidity_percent": request.humidity_percent,
        "activity_hours": request.activity_hours,
        "rumination_hours": request.rumination_hours,
        "health_score": request.health_score,
        "feed_type": "Mixed"  # Default value
    }
    
    # Make prediction
    result = prediction_service.predict_milk_yield(features)
    print(result)
    return MilkPredictionResponse(
        animal_id=request.animal_id,
        predicted_milk_yield=result["predicted_milk_yield"],
        confidence_score=result["confidence_score"],
        factors=result["factors"]
    )

@router.post("/disease", response_model=DiseasePredictionResponse)
async def predict_disease_risk(
    request: DiseasePredictionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Predict disease risk for a specific animal"""
    
    # Verify animal exists and user has permission
    # animal = db.query(Animal).filter(Animal.id == request.animal_id).first()
    # if not animal:
    #     raise HTTPException(status_code=404, detail="Animal not found")
    
    # Check permissions
    # if current_user.role == "farmer":
        # farm = db.query(Farm).filter(Farm.id == animal.farm_id).first()
        # if not farm or farm.owner_id != current_user.id:
        #     raise HTTPException(status_code=403, detail="Not authorized to predict for this animal")
    
    # Use mock data if enabled
    if settings.USE_MOCKS:
        return DiseasePredictionResponse(
            animal_id=request.animal_id,
            disease_risk=0.15,
            risk_level="low",
            recommended_actions=[
                "Continue regular monitoring",
                "Maintain current health protocols"
            ],
            confidence_score=0.82
        )
    
    # Prepare features for prediction
    features = {
        "breed": request.breed or "Holstein",
        "age_months": request.age_months,
        "parity": request.parity,
        "health_score": request.health_score,
        "activity_hours": request.activity_hours,
        "rumination_hours": request.rumination_hours,
        "milk_yield_liters": request.milk_yield_trend,
        "temperature_c": request.temperature_c,
        "humidity_percent": request.humidity_percent
    }
    
    # Make prediction
    result = prediction_service.predict_disease_risk(features)
    
    return DiseasePredictionResponse(
        animal_id=request.animal_id,
        disease_risk=result["disease_risk"],
        risk_level=result["risk_level"],
        recommended_actions=result["recommended_actions"],
        confidence_score=result["confidence_score"]
    )

@router.get("/models/status")
async def get_model_status(current_user: User = Depends(get_current_active_user)):
    """Get status of loaded ML models"""
    
    status = {
        "milk_model_loaded": prediction_service.milk_model is not None,
        "disease_model_loaded": prediction_service.disease_model is not None,
        "preprocessor_loaded": prediction_service.preprocessor is not None,
        "mock_mode": settings.USE_MOCKS
    }
    
    if prediction_service.milk_metadata:
        status["milk_model_info"] = {
            "algorithm": prediction_service.milk_metadata.get("best_model"),
            "test_r2": prediction_service.milk_metadata.get("best_test_r2"),
            "training_samples": prediction_service.milk_metadata.get("training_samples")
        }
    
    if prediction_service.disease_metadata:
        status["disease_model_info"] = {
            "algorithm": prediction_service.disease_metadata.get("best_model"),
            "test_accuracy": prediction_service.disease_metadata.get("best_test_accuracy"),
            "test_auc": prediction_service.disease_metadata.get("best_test_auc"),
            "training_samples": prediction_service.disease_metadata.get("training_samples")
        }
    
    return status
