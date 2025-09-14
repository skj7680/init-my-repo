import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import os

def generate_cattle_dataset(num_records=1000):
    """Generate synthetic cattle dataset for ML training"""
    
    # Set random seed for reproducibility
    np.random.seed(42)
    random.seed(42)
    
    # Generate base data
    data = []
    
    breeds = ['Holstein', 'Jersey', 'Angus', 'Hereford', 'Simmental', 'Charolais']
    feed_types = ['Grass', 'Hay', 'Silage', 'Grain', 'Mixed']
    diseases = ['Mastitis', 'Lameness', 'Ketosis', 'Milk Fever', 'Retained Placenta', 'None']
    
    for i in range(num_records):
        # Animal characteristics
        breed = random.choice(breeds)
        age_months = random.randint(24, 120)  # 2-10 years
        parity = random.randint(1, 8)
        weight = random.normalvariate(600, 80)  # kg
        
        # Environmental factors
        temperature = random.normalvariate(20, 8)  # Celsius
        humidity = random.normalvariate(65, 15)  # %
        
        # Feed data
        feed_type = random.choice(feed_types)
        feed_quantity = random.normalvariate(25, 5)  # kg/day
        protein_content = random.normalvariate(16, 3)  # %
        
        # Health data
        disease = random.choice(diseases)
        health_score = random.normalvariate(8, 1.5) if disease == 'None' else random.normalvariate(5, 2)
        health_score = max(1, min(10, health_score))
        
        # Activity data
        activity_level = random.normalvariate(7, 2)  # hours/day
        rumination_time = random.normalvariate(8, 1.5)  # hours/day
        
        # Calculate milk yield based on factors (simplified model)
        base_yield = 25  # liters/day
        
        # Breed factor
        breed_multiplier = {
            'Holstein': 1.2, 'Jersey': 0.8, 'Angus': 0.6,
            'Hereford': 0.7, 'Simmental': 1.0, 'Charolais': 0.9
        }
        
        # Age factor (peak at 4-6 years)
        age_factor = 1.0 if 48 <= age_months <= 72 else 0.8
        
        # Parity factor
        parity_factor = min(1.0, 0.6 + (parity * 0.1))
        
        # Health factor
        health_factor = health_score / 10
        
        # Feed factor
        feed_factor = min(1.2, feed_quantity / 25)
        
        # Environmental factor
        temp_factor = 1.0 if 15 <= temperature <= 25 else 0.9
        
        # Calculate final milk yield with some noise
        milk_yield = (base_yield * breed_multiplier[breed] * age_factor * 
                     parity_factor * health_factor * feed_factor * temp_factor)
        milk_yield += random.normalvariate(0, 2)  # Add noise
        milk_yield = max(5, milk_yield)  # Minimum 5L/day
        
        # Disease prediction features
        disease_risk = 0.1  # Base 10% risk
        if health_score < 6:
            disease_risk += 0.3
        if age_months > 84:
            disease_risk += 0.2
        if parity > 5:
            disease_risk += 0.15
        
        has_disease = 1 if disease != 'None' else 0
        
        data.append({
            'animal_id': f'COW_{i+1:04d}',
            'breed': breed,
            'age_months': age_months,
            'parity': parity,
            'weight_kg': round(weight, 1),
            'temperature_c': round(temperature, 1),
            'humidity_percent': round(humidity, 1),
            'feed_type': feed_type,
            'feed_quantity_kg': round(feed_quantity, 1),
            'protein_content_percent': round(protein_content, 1),
            'activity_hours': round(activity_level, 1),
            'rumination_hours': round(rumination_time, 1),
            'health_score': round(health_score, 1),
            'disease': disease,
            'has_disease': has_disease,
            'milk_yield_liters': round(milk_yield, 2),
            'date': (datetime.now() - timedelta(days=random.randint(0, 365))).strftime('%Y-%m-%d')
        })
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Ensure data directory exists
    os.makedirs('data', exist_ok=True)
    
    # Save to CSV
    output_file = 'data/cattle_dataset_1000.csv'
    df.to_csv(output_file, index=False)
    
    print(f"Generated {num_records} records and saved to {output_file}")
    print(f"Dataset shape: {df.shape}")
    print("\nDataset summary:")
    print(df.describe())
    
    return df

if __name__ == "__main__":
    generate_cattle_dataset(1000)
