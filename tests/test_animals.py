import pytest
from fastapi.testclient import TestClient

def test_get_animals(client: TestClient, auth_headers, test_animal):
    """Test getting animals list."""
    response = client.get("/api/animals/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["tag_number"] == "TEST001"

def test_get_animal_by_id(client: TestClient, auth_headers, test_animal):
    """Test getting specific animal."""
    response = client.get(f"/api/animals/{test_animal.id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["tag_number"] == "TEST001"
    assert data["breed"] == "Holstein"

def test_create_animal(client: TestClient, auth_headers, test_farm):
    """Test creating new animal."""
    animal_data = {
        "farm_id": test_farm.id,
        "tag_number": "TEST002",
        "breed": "Jersey",
        "sex": "F",
        "parity": 1,
        "current_weight": 450.0
    }
    response = client.post("/api/animals/", json=animal_data, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["tag_number"] == "TEST002"
    assert data["breed"] == "Jersey"

def test_create_animal_duplicate_tag(client: TestClient, auth_headers, test_animal, test_farm):
    """Test creating animal with duplicate tag number."""
    animal_data = {
        "farm_id": test_farm.id,
        "tag_number": test_animal.tag_number,
        "breed": "Jersey",
        "sex": "F"
    }
    response = client.post("/api/animals/", json=animal_data, headers=auth_headers)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_update_animal(client: TestClient, auth_headers, test_animal):
    """Test updating animal."""
    update_data = {
        "breed": "Angus",
        "current_weight": 650.0
    }
    response = client.put(f"/api/animals/{test_animal.id}", json=update_data, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["breed"] == "Angus"
    assert data["current_weight"] == 650.0

def test_delete_animal(client: TestClient, auth_headers, test_animal):
    """Test deleting (deactivating) animal."""
    response = client.delete(f"/api/animals/{test_animal.id}", headers=auth_headers)
    assert response.status_code == 200
    
    # Verify animal is deactivated
    response = client.get(f"/api/animals/{test_animal.id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["is_active"] == False

def test_unauthorized_access(client: TestClient, test_animal):
    """Test accessing animals without authentication."""
    response = client.get("/api/animals/")
    assert response.status_code == 401
