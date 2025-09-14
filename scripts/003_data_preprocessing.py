import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import joblib
import os
from supabase import create_client, Client

# Initialize Supabase client
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

class CattleDataPreprocessor:
    def __init__(self):
        self.scaler = StandardScaler()
        self.breed_encoder = LabelEncoder()
        self.health_encoder = LabelEncoder()
        self.feature_columns = [
            'age_days', 'breed_encoded', 'weight', 'avg_daily_yield_7d',
            'avg_daily_yield_30d', 'yield_trend_7d', 'fat_content_avg',
            'protein_content_avg', 'days_since_last_record', 'seasonal_factor',
            'health_status_encoded'
        ]
        
    def fetch_training_data(self):
        """Fetch data from Supabase for training"""
        print("Fetching training data from database...")
        
        # Fetch animals with their farms
        animals_response = supabase.table("animals").select("""
            id, tag_number, breed, birth_date, weight, health_status,
            farms!inner(owner_id)
        """).execute()
        
        if not animals_response.data:
            print("No animal data found")
            return None
            
        animals_df = pd.DataFrame(animals_response.data)
        
        # Fetch milk records
        milk_response = supabase.table("milk_records").select("*").execute()
        
        if not milk_response.data:
            print("No milk records found")
            return None
            
        milk_df = pd.DataFrame(milk_response.data)
        
        return self.process_raw_data(animals_df, milk_df)
    
    def process_raw_data(self, animals_df, milk_df):
        """Process raw data into features suitable for ML"""
        processed_data = []
        
        for _, animal in animals_df.iterrows():
            # Get milk records for this animal
            animal_milk = milk_df[milk_df['animal_id'] == animal['id']].copy()
            
            if len(animal_milk) < 7:  # Need at least 7 days of data
                continue
                
            # Sort by date
            animal_milk['date'] = pd.to_datetime(animal_milk['date'])
            animal_milk = animal_milk.sort_values('date', ascending=False)
            
            # Calculate features
            features = self.calculate_features(animal, animal_milk)
            processed_data.append(features)
        
        return pd.DataFrame(processed_data)
    
    def calculate_features(self, animal, milk_records):
        """Calculate features for a single animal"""
        # Age calculation
        birth_date = pd.to_datetime(animal['birth_date'])
        age_days = (pd.Timestamp.now() - birth_date).days
        
        # Milk yield statistics
        yields = milk_records['total_yield'].values
        last_7_days = yields[:7]
        last_30_days = yields[:30] if len(yields) >= 30 else yields
        
        avg_yield_7d = np.mean(last_7_days)
        avg_yield_30d = np.mean(last_30_days)
        
        # Yield trend (linear regression slope)
        if len(last_7_days) >= 2:
            x = np.arange(len(last_7_days))
            yield_trend = np.polyfit(x, last_7_days, 1)[0]
        else:
            yield_trend = 0
        
        # Quality metrics
        fat_content_avg = milk_records['fat_content'].mean() if 'fat_content' in milk_records.columns else 3.5
        protein_content_avg = milk_records['protein_content'].mean() if 'protein_content' in milk_records.columns else 3.2
        
        # Days since last record
        last_record_date = milk_records['date'].max()
        days_since_last = (pd.Timestamp.now() - last_record_date).days
        
        # Seasonal factor
        day_of_year = pd.Timestamp.now().dayofyear
        seasonal_factor = 1 + 0.2 * np.sin(2 * np.pi * day_of_year / 365)
        
        return {
            'animal_id': animal['id'],
            'age_days': age_days,
            'breed': animal['breed'],
            'weight': animal.get('weight', 600),
            'health_status': animal['health_status'],
            'avg_daily_yield_7d': avg_yield_7d,
            'avg_daily_yield_30d': avg_yield_30d,
            'yield_trend_7d': yield_trend,
            'fat_content_avg': fat_content_avg,
            'protein_content_avg': protein_content_avg,
            'days_since_last_record': days_since_last,
            'seasonal_factor': seasonal_factor,
            'target_yield': avg_yield_7d  # This will be our prediction target
        }
    
    def fit_encoders(self, df):
        """Fit label encoders on the data"""
        self.breed_encoder.fit(df['breed'])
        self.health_encoder.fit(df['health_status'])
        
        # Save encoders
        joblib.dump(self.breed_encoder, 'models/breed_encoder.pkl')
        joblib.dump(self.health_encoder, 'models/health_encoder.pkl')
    
    def transform_features(self, df):
        """Transform features for ML models"""
        df_processed = df.copy()
        
        # Encode categorical variables
        df_processed['breed_encoded'] = self.breed_encoder.transform(df['breed'])
        df_processed['health_status_encoded'] = self.health_encoder.transform(df['health_status'])
        
        # Select and scale features
        X = df_processed[self.feature_columns]
        X_scaled = self.scaler.fit_transform(X)
        
        # Save scaler
        joblib.dump(self.scaler, 'models/feature_scaler.pkl')
        
        return X_scaled, df_processed['target_yield'].values
    
    def prepare_training_data(self):
        """Complete preprocessing pipeline"""
        # Create models directory
        os.makedirs('models', exist_ok=True)
        
        # Fetch and process data
        df = self.fetch_training_data()
        if df is None or len(df) == 0:
            print("No data available for training")
            return None, None, None, None
        
        print(f"Processing {len(df)} animal records...")
        
        # Fit encoders
        self.fit_encoders(df)
        
        # Transform features
        X, y = self.transform_features(df)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        print(f"Training set: {X_train.shape[0]} samples")
        print(f"Test set: {X_test.shape[0]} samples")
        
        return X_train, X_test, y_train, y_test

if __name__ == "__main__":
    preprocessor = CattleDataPreprocessor()
    X_train, X_test, y_train, y_test = preprocessor.prepare_training_data()
    
    if X_train is not None:
        print("Data preprocessing completed successfully!")
        print(f"Feature shape: {X_train.shape}")
        print(f"Target statistics - Mean: {np.mean(y_train):.2f}, Std: {np.std(y_train):.2f}")
    else:
        print("Data preprocessing failed - no data available")
