import pytest
import asyncio
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import get_db, Base
from app.models import User, Farm, Animal
from app.auth import get_password_hash

# Test database URL (SQLite for testing)
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def db_session():
    """Create a fresh database session for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(db_session):
    """Create a test client with database dependency override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def test_user(db_session):
    """Create a test user."""
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=get_password_hash("testpassword"),
        role="farmer"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_admin(db_session):
    """Create a test admin user."""
    admin = User(
        username="admin",
        email="admin@example.com",
        hashed_password=get_password_hash("adminpassword"),
        role="admin"
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin

@pytest.fixture
def test_farm(db_session, test_user):
    """Create a test farm."""
    farm = Farm(
        name="Test Farm",
        location="Test Location",
        owner_id=test_user.id
    )
    db_session.add(farm)
    db_session.commit()
    db_session.refresh(farm)
    return farm

@pytest.fixture
def test_animal(db_session, test_farm):
    """Create a test animal."""
    animal = Animal(
        farm_id=test_farm.id,
        tag_number="TEST001",
        breed="Holstein",
        sex="F",
        parity=2,
        current_weight=600.0
    )
    db_session.add(animal)
    db_session.commit()
    db_session.refresh(animal)
    return animal

@pytest.fixture
def auth_headers(client, test_user):
    """Get authentication headers for test user."""
    response = client.post("/api/auth/login", json={
        "username": test_user.username,
        "password": "testpassword"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def admin_headers(client, test_admin):
    """Get authentication headers for admin user."""
    response = client.post("/api/auth/login", json={
        "username": test_admin.username,
        "password": "adminpassword"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
