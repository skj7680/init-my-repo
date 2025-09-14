#!/usr/bin/env python3
"""
Script to create an admin user for the cattle prediction system
"""

import sys
import os
from getpass import getpass

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import User, Base
from app.auth import get_password_hash

def create_admin_user():
    """Create an admin user interactively"""
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        print("=== Create Admin User ===")
        
        # Get user input
        username = input("Enter admin username: ").strip()
        if not username:
            print("Username cannot be empty")
            return
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.username == username).first()
        if existing_user:
            print(f"User '{username}' already exists")
            return
        
        email = input("Enter admin email: ").strip()
        if not email:
            print("Email cannot be empty")
            return
        
        # Check if email already exists
        existing_email = db.query(User).filter(User.email == email).first()
        if existing_email:
            print(f"Email '{email}' already exists")
            return
        
        password = getpass("Enter admin password: ")
        if len(password) < 8:
            print("Password must be at least 8 characters long")
            return
        
        confirm_password = getpass("Confirm admin password: ")
        if password != confirm_password:
            print("Passwords do not match")
            return
        
        # Create admin user
        hashed_password = get_password_hash(password)
        admin_user = User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            role="admin",
            is_active=True
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print(f"\nAdmin user '{username}' created successfully!")
        print(f"User ID: {admin_user.id}")
        print(f"Email: {admin_user.email}")
        print(f"Role: {admin_user.role}")
        
    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()
