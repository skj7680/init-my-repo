import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import os
from supabase import create_client, Client

# Initialize Supabase client
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def generate_sample_data():
    """Generate realistic sample data for cattle milk prediction"""
    
    # Sample farm data
    farms_data = [
        {"name": "Green Valley Farm", "location": "Wisconsin, USA"},
        {"name": "Sunny Meadows", "location": "California, USA"},
        {"name": "Highland Dairy", "location": "Vermont, USA"}
    ]
    
    # Sample breeds with typical characteristics
    breeds = {
        "Holstein": {"avg_yield": 25.0, "yield_variance": 5.0},
        "Jersey": {"avg_yield": 18.0, "yield_variance": 3.0},
        "Guernsey": {"avg_yield": 20.0, "yield_variance": 4.0},
        "Brown Swiss": {"avg_yield": 22.0, "yield_variance": 4.5}
    }
    
    print("Generating sample data...")
    
    # Generate animals data
    animals_data = []
    milk_records_data = []
    
    for i in range(50):  # 50 sample animals
        breed = np.random.choice(list(breeds.keys()))
        birth_date = datetime.now() - timedelta(days=np.random.randint(365*2, 365*8))  # 2-8 years old
        
        animal = {
            "tag_number": f"COW{i+1:03d}",
            "breed": breed,
            "birth_date": birth_date.strftime("%Y-%m-%d"),
            "weight": round(np.random.normal(600, 100), 2),  # Average cow weight
            "health_status": np.random.choice(["healthy", "sick", "recovering"], p=[0.8, 0.1, 0.1])
        }
        animals_data.append(animal)
        
        # Generate milk records for the past 90 days
        base_yield = breeds[breed]["avg_yield"]
        yield_variance = breeds[breed]["yield_variance"]
        
        for day in range(90):
            record_date = datetime.now() - timedelta(days=day)
            
            # Add seasonal and health variations
            seasonal_factor = 1 + 0.2 * np.sin(2 * np.pi * day / 365)
            health_factor = 0.7 if animal["health_status"] == "sick" else 0.9 if animal["health_status"] == "recovering" else 1.0
            
            morning_yield = max(0, np.random.normal(base_yield * 0.6 * seasonal_factor * health_factor, yield_variance * 0.6))
            evening_yield = max(0, np.random.normal(base_yield * 0.4 * seasonal_factor * health_factor, yield_variance * 0.4))
            
            milk_record = {
                "animal_tag": animal["tag_number"],
                "date": record_date.strftime("%Y-%m-%d"),
                "morning_yield": round(morning_yield, 2),
                "evening_yield": round(evening_yield, 2),
                "fat_content": round(np.random.normal(3.5, 0.5), 2),
                "protein_content": round(np.random.normal(3.2, 0.3), 2)
            }
            milk_records_data.append(milk_record)
    
    # Save to JSON files for easy import
    with open("sample_farms.json", "w") as f:
        json.dump(farms_data, f, indent=2)
    
    with open("sample_animals.json", "w") as f:
        json.dump(animals_data, f, indent=2)
    
    with open("sample_milk_records.json", "w") as f:
        json.dump(milk_records_data, f, indent=2)
    
    print(f"Generated {len(farms_data)} farms, {len(animals_data)} animals, and {len(milk_records_data)} milk records")
    return farms_data, animals_data, milk_records_data

if __name__ == "__main__":
    generate_sample_data()
