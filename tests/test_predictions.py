import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

def test_predict_milk_yield(client: TestClient, auth_headers, test_animal):
    """Test milk yield prediction."""
    prediction_data = {
        "animal_id": test_animal.id,
        "breed": "Holstein",
        "age_months": 48,
        "parity": 2,
        "weight_kg": 600.0,
        "feed_quantity_kg": 25.0,
        "protein_content_percent": 16.0,
        "temperature_c": 20.0,
        "humidity_percent": 65.0,
        "activity_hours": 8.0,
        "rumination_hours": 7.5,
        "health_score": 8.0
    }
    
    response = client.post("/api/predict/milk", json=prediction_data, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_milk_yield" in data
    assert "confidence_score" in data
    assert "factors" in data
    assert data["animal_id"] == test_animal.id

def test_predict_disease_risk(client: TestClient, auth_headers, test_animal):
    """Test disease risk prediction."""
    prediction_data = {
        "animal_id": test_animal.id,
        "age_months": 48,
        "parity": 2,
        "health_score": 8.0,
        "activity_hours": 8.0,
        "rumination_hours": 7.5,
        "milk_yield_trend": 0.05,
        "temperature_c": 20.0,
        "humidity_percent": 65.0
    }
    
    response = client.post("/api/predict/disease", json=prediction_data, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "disease_risk" in data
    assert "risk_level" in data
    assert "recommended_actions" in data
    assert "confidence_score" in data
    assert data["animal_id"] == test_animal.id

def test_model_status(client: TestClient, auth_headers):
    """Test getting model status."""
    response = client.get("/api/predict/models/status", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "milk_model_loaded" in data
    assert "disease_model_loaded" in data
    assert "preprocessor_loaded" in data
    assert "mock_mode" in data

def test_predict_nonexistent_animal(client: TestClient, auth_headers):
    """Test prediction for non-existent animal."""
    prediction_data = {
        "animal_id": 99999,
        "breed": "Holstein",
        "age_months": 48,
        "parity": 2,
        "weight_kg": 600.0,
        "feed_quantity_kg": 25.0,
        "protein_content_percent": 16.0,
        "temperature_c": 20.0,
        "humidity_percent": 65.0,
        "activity_hours": 8.0,
        "rumination_hours": 7.5,
        "health_score": 8.0
    }
    
    response = client.post("/api/predict/milk", json=prediction_data, headers=auth_headers)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]
