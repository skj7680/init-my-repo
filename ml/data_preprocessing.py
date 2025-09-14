import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder, OneHotEncoder
from sklearn.model_selection import train_test_split
from typing import Tuple, Dict, Any
import joblib
import os

class CattleDataPreprocessor:
    """Data preprocessing pipeline for cattle prediction models"""
    
    def __init__(self):
        self.scalers = {}
        self.encoders = {}
        self.feature_columns = []
        self.target_column = None
        
    def prepare_milk_yield_data(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare data for milk yield prediction (regression)"""
        
        # Define features for milk yield prediction
        feature_cols = [
            'age_months', 'parity', 'weight_kg', 'temperature_c', 'humidity_percent',
            'feed_quantity_kg', 'protein_content_percent', 'activity_hours', 
            'rumination_hours', 'health_score'
        ]
        
        categorical_cols = ['breed', 'feed_type']
        target_col = 'milk_yield_liters'
        
        # Handle missing values
        df = df.copy()
        for col in feature_cols:
            if col in df.columns:
                df[col] = df[col].fillna(df[col].median())
        
        for col in categorical_cols:
            if col in df.columns:
                df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else 'Unknown')
        
        # Encode categorical variables
        encoded_features = []
        
        for col in categorical_cols:
            if col in df.columns:
                if col not in self.encoders:
                    self.encoders[col] = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
                    encoded = self.encoders[col].fit_transform(df[[col]])
                else:
                    encoded = self.encoders[col].transform(df[[col]])
                
                # Create column names for encoded features
                feature_names = [f"{col}_{cat}" for cat in self.encoders[col].categories_[0]]
                encoded_df = pd.DataFrame(encoded, columns=feature_names, index=df.index)
                encoded_features.append(encoded_df)
        
        # Combine numerical and encoded categorical features
        X = df[feature_cols].copy()
        for encoded_df in encoded_features:
            X = pd.concat([X, encoded_df], axis=1)
        
        # Scale numerical features
        if 'milk_scaler' not in self.scalers:
            self.scalers['milk_scaler'] = StandardScaler()
            X_scaled = self.scalers['milk_scaler'].fit_transform(X)
        else:
            X_scaled = self.scalers['milk_scaler'].transform(X)
        
        y = df[target_col].values
        
        self.feature_columns = X.columns.tolist()
        self.target_column = target_col
        
        return X_scaled, y
    
    def prepare_disease_data(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare data for disease prediction (classification)"""
        
        # Define features for disease prediction
        feature_cols = [
            'age_months', 'parity', 'health_score', 'activity_hours', 
            'rumination_hours', 'milk_yield_liters', 'temperature_c', 'humidity_percent'
        ]
        
        categorical_cols = ['breed']
        target_col = 'has_disease'
        
        # Handle missing values
        df = df.copy()
        for col in feature_cols:
            if col in df.columns:
                df[col] = df[col].fillna(df[col].median())
        
        for col in categorical_cols:
            if col in df.columns:
                df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else 'Unknown')
        
        # Encode categorical variables
        encoded_features = []
        
        for col in categorical_cols:
            if col in df.columns:
                if f"{col}_disease" not in self.encoders:
                    self.encoders[f"{col}_disease"] = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
                    encoded = self.encoders[f"{col}_disease"].fit_transform(df[[col]])
                else:
                    encoded = self.encoders[f"{col}_disease"].transform(df[[col]])
                
                feature_names = [f"{col}_{cat}" for cat in self.encoders[f"{col}_disease"].categories_[0]]
                encoded_df = pd.DataFrame(encoded, columns=feature_names, index=df.index)
                encoded_features.append(encoded_df)
        
        # Combine features
        X = df[feature_cols].copy()
        for encoded_df in encoded_features:
            X = pd.concat([X, encoded_df], axis=1)
        
        # Scale features
        if 'disease_scaler' not in self.scalers:
            self.scalers['disease_scaler'] = StandardScaler()
            X_scaled = self.scalers['disease_scaler'].fit_transform(X)
        else:
            X_scaled = self.scalers['disease_scaler'].transform(X)
        
        y = df[target_col].values
        
        return X_scaled, y
    
    def save_preprocessors(self, model_dir: str = "ml/models"):
        """Save preprocessing objects"""
        os.makedirs(model_dir, exist_ok=True)
        
        joblib.dump(self.scalers, os.path.join(model_dir, "scalers.pkl"))
        joblib.dump(self.encoders, os.path.join(model_dir, "encoders.pkl"))
        joblib.dump(self.feature_columns, os.path.join(model_dir, "feature_columns.pkl"))
    
    def load_preprocessors(self, model_dir: str = "ml/models"):
        """Load preprocessing objects"""
        try:
            self.scalers = joblib.load(os.path.join(model_dir, "scalers.pkl"))
            self.encoders = joblib.load(os.path.join(model_dir, "encoders.pkl"))
            self.feature_columns = joblib.load(os.path.join(model_dir, "feature_columns.pkl"))
            return True
        except FileNotFoundError:
            return False

def load_and_prepare_data(csv_path: str = "data/cattle_dataset_1000.csv") -> pd.DataFrame:
    """Load and basic preparation of cattle dataset"""
    try:
        df = pd.read_csv(csv_path)
        
        # Convert date column
        df['date'] = pd.to_datetime(df['date'])
        
        # Create additional features
        df['days_since_record'] = (pd.Timestamp.now() - df['date']).dt.days
        
        # Calculate milk yield trend (simplified)
        df = df.sort_values(['animal_id', 'date'])
        df['milk_yield_trend'] = df.groupby('animal_id')['milk_yield_liters'].pct_change().fillna(0)
        
        return df
        
    except FileNotFoundError:
        print(f"Dataset not found at {csv_path}. Please run the data generation script first.")
        return None
