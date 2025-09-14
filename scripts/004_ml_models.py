import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.neural_network import MLPRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import xgboost as xgb
import joblib
import os
import json
from datetime import datetime
from supabase import create_client, Client

# Initialize Supabase client
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

class CattleMilkPredictor:
    def __init__(self):
        self.models = {}
        self.model_metrics = {}
        self.feature_columns = [
            'age_days', 'breed_encoded', 'weight', 'avg_daily_yield_7d',
            'avg_daily_yield_30d', 'yield_trend_7d', 'fat_content_avg',
            'protein_content_avg', 'days_since_last_record', 'seasonal_factor',
            'health_status_encoded'
        ]
        
    def initialize_models(self):
        """Initialize all ML models"""
        self.models = {
            'linear_regression': LinearRegression(),
            'random_forest': RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42
            ),
            'xgboost': xgb.XGBRegressor(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42
            ),
            'neural_network': MLPRegressor(
                hidden_layer_sizes=(100, 50),
                activation='relu',
                solver='adam',
                alpha=0.001,
                batch_size='auto',
                learning_rate='constant',
                learning_rate_init=0.001,
                max_iter=500,
                random_state=42
            )
        }
        
    def train_models(self, X_train, y_train, X_test, y_test):
        """Train all models and evaluate performance"""
        print("Training ML models...")
        
        for model_name, model in self.models.items():
            print(f"\nTraining {model_name}...")
            
            # Train model
            model.fit(X_train, y_train)
            
            # Make predictions
            y_train_pred = model.predict(X_train)
            y_test_pred = model.predict(X_test)
            
            # Calculate metrics
            train_metrics = self.calculate_metrics(y_train, y_train_pred, "train")
            test_metrics = self.calculate_metrics(y_test, y_test_pred, "test")
            
            # Store metrics
            self.model_metrics[model_name] = {
                **train_metrics,
                **test_metrics,
                'model_version': f"v1.0_{datetime.now().strftime('%Y%m%d')}",
                'training_samples': len(X_train),
                'test_samples': len(X_test)
            }
            
            # Save model
            model_path = f"models/{model_name}_model.pkl"
            joblib.dump(model, model_path)
            print(f"Model saved to {model_path}")
            
            # Print performance
            print(f"Test R²: {test_metrics['test_r2']:.4f}")
            print(f"Test RMSE: {test_metrics['test_rmse']:.4f}")
            print(f"Test MAE: {test_metrics['test_mae']:.4f}")
            
        # Save metrics to database
        self.save_metrics_to_db()
        
    def calculate_metrics(self, y_true, y_pred, prefix):
        """Calculate regression metrics"""
        mse = mean_squared_error(y_true, y_pred)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(y_true, y_pred)
        r2 = r2_score(y_true, y_pred)
        
        return {
            f'{prefix}_mse': mse,
            f'{prefix}_rmse': rmse,
            f'{prefix}_mae': mae,
            f'{prefix}_r2': r2
        }
        
    def save_metrics_to_db(self):
        """Save model metrics to Supabase"""
        print("Saving metrics to database...")
        
        for model_name, metrics in self.model_metrics.items():
            for metric_name, metric_value in metrics.items():
                if isinstance(metric_value, (int, float)):
                    try:
                        supabase.table("model_metrics").insert({
                            "model_name": model_name,
                            "model_version": metrics['model_version'],
                            "metric_name": metric_name,
                            "metric_value": float(metric_value)
                        }).execute()
                    except Exception as e:
                        print(f"Error saving metric {metric_name} for {model_name}: {e}")
                        
    def get_best_model(self):
        """Get the best performing model based on test R²"""
        if not self.model_metrics:
            return None
            
        best_model_name = max(
            self.model_metrics.keys(),
            key=lambda x: self.model_metrics[x].get('test_r2', 0)
        )
        
        return best_model_name, self.models[best_model_name]
        
    def predict_milk_yield(self, features, model_name=None):
        """Make milk yield predictions"""
        if model_name is None:
            model_name, model = self.get_best_model()
        else:
            model = self.models.get(model_name)
            
        if model is None:
            raise ValueError(f"Model {model_name} not found or not trained")
            
        # Ensure features are in correct format
        if isinstance(features, dict):
            feature_array = np.array([[features[col] for col in self.feature_columns]])
        else:
            feature_array = np.array(features).reshape(1, -1)
            
        prediction = model.predict(feature_array)[0]
        
        # Calculate confidence based on model performance
        test_r2 = self.model_metrics.get(model_name, {}).get('test_r2', 0.5)
        confidence = min(max(test_r2, 0.1), 0.95)  # Clamp between 0.1 and 0.95
        
        return {
            'predicted_yield': float(prediction),
            'confidence_score': float(confidence),
            'model_used': model_name,
            'model_version': self.model_metrics.get(model_name, {}).get('model_version', 'v1.0')
        }
        
    def predict_health_risk(self, features):
        """Predict health risk based on milk yield patterns"""
        # Use the best model to predict expected yield
        prediction_result = self.predict_milk_yield(features)
        expected_yield = prediction_result['predicted_yield']
        
        # Get actual recent yield
        actual_yield = features.get('avg_daily_yield_7d', 0)
        
        # Calculate risk based on deviation from expected
        if expected_yield > 0:
            yield_ratio = actual_yield / expected_yield
            
            # Risk scoring: lower yield relative to expected = higher risk
            if yield_ratio < 0.7:
                risk_score = 0.8  # High risk
            elif yield_ratio < 0.85:
                risk_score = 0.5  # Medium risk
            else:
                risk_score = 0.2  # Low risk
        else:
            risk_score = 0.5  # Default medium risk
            
        return {
            'predicted_value': float(risk_score),
            'confidence_score': float(prediction_result['confidence_score'] * 0.8),  # Slightly lower confidence for health
            'model_used': f"health_risk_based_on_{prediction_result['model_used']}",
            'model_version': prediction_result['model_version']
        }
        
    def compare_models(self):
        """Compare all models and return performance summary"""
        if not self.model_metrics:
            return "No models trained yet"
            
        comparison = []
        for model_name, metrics in self.model_metrics.items():
            comparison.append({
                'model': model_name,
                'test_r2': metrics.get('test_r2', 0),
                'test_rmse': metrics.get('test_rmse', float('inf')),
                'test_mae': metrics.get('test_mae', float('inf')),
                'training_samples': metrics.get('training_samples', 0)
            })
            
        # Sort by R² score (descending)
        comparison.sort(key=lambda x: x['test_r2'], reverse=True)
        
        print("\nModel Performance Comparison:")
        print("-" * 80)
        print(f"{'Model':<20} {'R²':<10} {'RMSE':<10} {'MAE':<10} {'Samples':<10}")
        print("-" * 80)
        
        for model in comparison:
            print(f"{model['model']:<20} {model['test_r2']:<10.4f} {model['test_rmse']:<10.4f} {model['test_mae']:<10.4f} {model['training_samples']:<10}")
            
        return comparison

def main():
    """Main training pipeline"""
    # Import preprocessing
    from scripts.data_preprocessing import CattleDataPreprocessor
    
    # Initialize preprocessor and get training data
    preprocessor = CattleDataPreprocessor()
    X_train, X_test, y_train, y_test = preprocessor.prepare_training_data()
    
    if X_train is None:
        print("No training data available. Please run sample data generation first.")
        return
        
    # Initialize and train models
    predictor = CattleMilkPredictor()
    predictor.initialize_models()
    predictor.train_models(X_train, y_train, X_test, y_test)
    
    # Compare models
    predictor.compare_models()
    
    # Save the predictor instance
    joblib.dump(predictor, 'models/cattle_predictor.pkl')
    print("\nPredictor saved to models/cattle_predictor.pkl")
    
    print("\nModel training completed successfully!")

if __name__ == "__main__":
    main()
