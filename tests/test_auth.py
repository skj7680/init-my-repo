import pytest
from fastapi.testclient import TestClient

def test_register_user(client: TestClient):
    """Test user registration."""
    response = client.post("/api/auth/register", json={
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "newpassword",
        "role": "farmer"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "newuser"
    assert data["email"] == "newuser@example.com"
    assert data["role"] == "farmer"
    assert "id" in data

def test_register_duplicate_user(client: TestClient, test_user):
    """Test registration with duplicate username."""
    response = client.post("/api/auth/register", json={
        "username": test_user.username,
        "email": "different@example.com",
        "password": "password",
        "role": "farmer"
    })
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]

def test_login_success(client: TestClient, test_user):
    """Test successful login."""
    response = client.post("/api/auth/login", json={
        "username": test_user.username,
        "password": "testpassword"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_credentials(client: TestClient, test_user):
    """Test login with invalid credentials."""
    response = client.post("/api/auth/login", json={
        "username": test_user.username,
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    assert "Incorrect username or password" in response.json()["detail"]

def test_get_current_user(client: TestClient, auth_headers):
    """Test getting current user info."""
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["role"] == "farmer"

def test_refresh_token(client: TestClient, auth_headers):
    """Test token refresh."""
    response = client.post("/api/auth/refresh", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
