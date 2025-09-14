import pytest
import pandas as pd
import numpy as np
from ml.data_preprocessing import CattleDataPreprocessor, load_and_prepare_data
from ml.predict_service import CattlePredictionService

def test_data_preprocessing():
    """Test data preprocessing pipeline."""
    # Create sample data
    data = {
        'animal_id': ['COW_001', 'COW_002'],
        'breed': ['Holstein', 'Jersey'],
        'age_months': [48, 60],
        'parity': [2, 3],
        'weight_kg': [600.0, 450.0],
        'temperature_c': [20.0, 22.0],
        'humidity_percent': [65.0, 70.0],
        'feed_type': ['Mixed', 'Grass'],
        'feed_quantity_kg': [25.0, 20.0],
        'protein_content_percent': [16.0, 14.0],
        'activity_hours': [8.0, 7.0],
        'rumination_hours': [7.5, 8.0],
        'health_score': [8.0, 7.0],
        'milk_yield_liters': [25.0, 18.0],
        'has_disease': [0, 1],
        'date': ['2024-01-01', '2024-01-02']
    }
    
    df = pd.DataFrame(data)
    preprocessor = CattleDataPreprocessor()
    
    # Test milk yield preprocessing
    X_milk, y_milk = preprocessor.prepare_milk_yield_data(df)
    assert X_milk.shape[0] == 2
    assert len(y_milk) == 2
    assert y_milk[0] == 25.0
    
    # Test disease preprocessing
    X_disease, y_disease = preprocessor.prepare_disease_data(df)
    assert X_disease.shape[0] == 2
    assert len(y_disease) == 2
    assert y_disease[0] == 0

def test_prediction_service():
    """Test prediction service with mock data."""
    service = CattlePredictionService()
    
    # Test milk yield prediction
    milk_features = {
        'breed': 'Holstein',
        'age_months': 48,
        'parity': 2,
        'weight_kg': 600.0,
        'feed_quantity_kg': 25.0,
        'protein_content_percent': 16.0,
        'temperature_c': 20.0,
        'humidity_percent': 65.0,
        'activity_hours': 8.0,
        'rumination_hours': 7.5,
        'health_score': 8.0
    }
    
    milk_result = service.predict_milk_yield(milk_features)
    assert 'predicted_milk_yield' in milk_result
    assert 'confidence_score' in milk_result
    assert 'factors' in milk_result
    assert isinstance(milk_result['predicted_milk_yield'], (int, float))
    
    # Test disease prediction
    disease_features = {
        'breed': 'Holstein',
        'age_months': 48,
        'parity': 2,
        'health_score': 8.0,
        'activity_hours': 8.0,
        'rumination_hours': 7.5,
        'milk_yield_liters': 25.0,
        'temperature_c': 20.0,
        'humidity_percent': 65.0
    }
    
    disease_result = service.predict_disease_risk(disease_features)
    assert 'disease_risk' in disease_result
    assert 'risk_level' in disease_result
    assert 'recommended_actions' in disease_result
    assert 'confidence_score' in disease_result
    assert disease_result['risk_level'] in ['low', 'medium', 'high', 'critical']
