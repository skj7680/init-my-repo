import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import xgboost as xgb
import lightgbm as lgb
import joblib
import os
from ml.data_preprocessing import CattleDataPreprocessor, load_and_prepare_data

def train_milk_yield_models(data_path: str = "data/cattle_dataset_1000.csv"):
    """Train multiple models for milk yield prediction"""
    
    print("Loading and preprocessing data...")
    df = load_and_prepare_data(data_path)
    if df is None:
        return
    
    # Initialize preprocessor
    preprocessor = CattleDataPreprocessor()
    
    # Prepare data
    X, y = preprocessor.prepare_milk_yield_data(df)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print(f"Training set size: {X_train.shape}")
    print(f"Test set size: {X_test.shape}")
    
    # Define models to train
    models = {
        'linear_regression': LinearRegression(),
        'random_forest': RandomForestRegressor(n_estimators=100, random_state=42),
        'gradient_boosting': GradientBoostingRegressor(n_estimators=100, random_state=42),
        'xgboost': xgb.XGBRegressor(n_estimators=100, random_state=42),
        'lightgbm': lgb.LGBMRegressor(n_estimators=100, random_state=42, verbose=-1)
    }
    
    # Train and evaluate models
    results = {}
    best_model = None
    best_score = float('inf')
    
    for name, model in models.items():
        print(f"\nTraining {name}...")
        
        # Train model
        model.fit(X_train, y_train)
        
        # Make predictions
        y_pred_train = model.predict(X_train)
        y_pred_test = model.predict(X_test)
        
        # Calculate metrics
        train_mse = mean_squared_error(y_train, y_pred_train)
        test_mse = mean_squared_error(y_test, y_pred_test)
        train_r2 = r2_score(y_train, y_pred_train)
        test_r2 = r2_score(y_test, y_pred_test)
        test_mae = mean_absolute_error(y_test, y_pred_test)
        
        # Cross-validation
        cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='neg_mean_squared_error')
        cv_rmse = np.sqrt(-cv_scores.mean())
        
        results[name] = {
            'train_mse': train_mse,
            'test_mse': test_mse,
            'train_r2': train_r2,
            'test_r2': test_r2,
            'test_mae': test_mae,
            'cv_rmse': cv_rmse,
            'model': model
        }
        
        print(f"  Train R²: {train_r2:.4f}")
        print(f"  Test R²: {test_r2:.4f}")
        print(f"  Test RMSE: {np.sqrt(test_mse):.4f}")
        print(f"  Test MAE: {test_mae:.4f}")
        print(f"  CV RMSE: {cv_rmse:.4f}")
        
        # Track best model
        if test_mse < best_score:
            best_score = test_mse
            best_model = (name, model)
    
    # Hyperparameter tuning for best model
    print(f"\nPerforming hyperparameter tuning for {best_model[0]}...")
    
    if best_model[0] == 'random_forest':
        param_grid = {
            'n_estimators': [100, 200],
            'max_depth': [10, 20, None],
            'min_samples_split': [2, 5],
            'min_samples_leaf': [1, 2]
        }
        grid_search = GridSearchCV(
            RandomForestRegressor(random_state=42),
            param_grid, cv=3, scoring='neg_mean_squared_error', n_jobs=-1
        )
    elif best_model[0] == 'xgboost':
        param_grid = {
            'n_estimators': [100, 200],
            'max_depth': [3, 6, 10],
            'learning_rate': [0.01, 0.1, 0.2],
            'subsample': [0.8, 1.0]
        }
        grid_search = GridSearchCV(
            xgb.XGBRegressor(random_state=42),
            param_grid, cv=3, scoring='neg_mean_squared_error', n_jobs=-1
        )
    else:
        grid_search = None
    
    if grid_search:
        grid_search.fit(X_train, y_train)
        tuned_model = grid_search.best_estimator_
        
        # Evaluate tuned model
        y_pred_tuned = tuned_model.predict(X_test)
        tuned_r2 = r2_score(y_test, y_pred_tuned)
        tuned_rmse = np.sqrt(mean_squared_error(y_test, y_pred_tuned))
        
        print(f"  Best parameters: {grid_search.best_params_}")
        print(f"  Tuned Test R²: {tuned_r2:.4f}")
        print(f"  Tuned Test RMSE: {tuned_rmse:.4f}")
        
        # Use tuned model if better
        if tuned_r2 > results[best_model[0]]['test_r2']:
            best_model = (best_model[0], tuned_model)
            print("  Using tuned model as final model")
    
    # Save models and preprocessor
    model_dir = "ml/models"
    os.makedirs(model_dir, exist_ok=True)
    
    # Save best model
    joblib.dump(best_model[1], os.path.join(model_dir, "milk_yield_model.pkl"))
    
    # Save all models for comparison
    for name, result in results.items():
        joblib.dump(result['model'], os.path.join(model_dir, f"milk_yield_{name}.pkl"))
    
    # Save preprocessor
    preprocessor.save_preprocessors(model_dir)
    
    # Save model metadata
    metadata = {
        'best_model': best_model[0],
        'best_test_r2': results[best_model[0]]['test_r2'],
        'best_test_rmse': np.sqrt(results[best_model[0]]['test_mse']),
        'feature_columns': preprocessor.feature_columns,
        'training_samples': len(X_train),
        'test_samples': len(X_test)
    }
    
    joblib.dump(metadata, os.path.join(model_dir, "milk_yield_metadata.pkl"))
    
    print(f"\nBest model: {best_model[0]}")
    print(f"Final Test R²: {results[best_model[0]]['test_r2']:.4f}")
    print(f"Models saved to {model_dir}")
    
    return results

if __name__ == "__main__":
    results = train_milk_yield_models()
