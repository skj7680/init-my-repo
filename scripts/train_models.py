#!/usr/bin/env python3
"""
Script to train all ML models for cattle prediction
"""

import sys
import os

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.train_milk_model import train_milk_yield_models
from ml.train_disease_model import train_disease_models

def main():
    """Train all models"""
    print("=== Cattle Prediction Model Training ===")
    
    # Check if data exists
    data_path = "data/cattle_dataset_1000.csv"
    if not os.path.exists(data_path):
        print(f"Dataset not found at {data_path}")
        print("Please run 'python scripts/generate_sample_data.py' first")
        return
    
    print("\n1. Training Milk Yield Prediction Models...")
    print("=" * 50)
    milk_results = train_milk_yield_models(data_path)
    
    print("\n2. Training Disease Prediction Models...")
    print("=" * 50)
    disease_results = train_disease_models(data_path)
    
    print("\n=== Training Complete ===")
    print("Models saved to ml/models/")
    print("\nTo test the models, you can now start the API server:")
    print("uvicorn app.main:app --reload")

if __name__ == "__main__":
    main()
