import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, accuracy_score
import xgboost as xgb
import lightgbm as lgb
import joblib
import os
from ml.data_preprocessing import CattleDataPreprocessor, load_and_prepare_data

def train_disease_models(data_path: str = "data/cattle_dataset_1000.csv"):
    """Train multiple models for disease prediction"""
    
    print("Loading and preprocessing data...")
    df = load_and_prepare_data(data_path)
    if df is None:
        return
    
    # Initialize preprocessor
    preprocessor = CattleDataPreprocessor()
    
    # Prepare data
    X, y = preprocessor.prepare_disease_data(df)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Training set size: {X_train.shape}")
    print(f"Test set size: {X_test.shape}")
    print(f"Disease prevalence in training: {y_train.mean():.3f}")
    print(f"Disease prevalence in test: {y_test.mean():.3f}")
    
    # Define models to train
    models = {
        'logistic_regression': LogisticRegression(random_state=42, max_iter=1000),
        'random_forest': RandomForestClassifier(n_estimators=100, random_state=42),
        'gradient_boosting': GradientBoostingClassifier(n_estimators=100, random_state=42),
        'xgboost': xgb.XGBClassifier(n_estimators=100, random_state=42, eval_metric='logloss'),
        'lightgbm': lgb.LGBMClassifier(n_estimators=100, random_state=42, verbose=-1)
    }
    
    # Train and evaluate models
    results = {}
    best_model = None
    best_score = 0
    
    for name, model in models.items():
        print(f"\nTraining {name}...")
        
        # Train model
        model.fit(X_train, y_train)
        
        # Make predictions
        y_pred_train = model.predict(X_train)
        y_pred_test = model.predict(X_test)
        y_pred_proba_test = model.predict_proba(X_test)[:, 1]
        
        # Calculate metrics
        train_accuracy = accuracy_score(y_train, y_pred_train)
        test_accuracy = accuracy_score(y_test, y_pred_test)
        test_auc = roc_auc_score(y_test, y_pred_proba_test)
        
        # Cross-validation
        cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='roc_auc')
        cv_auc = cv_scores.mean()
        
        results[name] = {
            'train_accuracy': train_accuracy,
            'test_accuracy': test_accuracy,
            'test_auc': test_auc,
            'cv_auc': cv_auc,
            'model': model,
            'predictions': y_pred_test,
            'probabilities': y_pred_proba_test
        }
        
        print(f"  Train Accuracy: {train_accuracy:.4f}")
        print(f"  Test Accuracy: {test_accuracy:.4f}")
        print(f"  Test AUC: {test_auc:.4f}")
        print(f"  CV AUC: {cv_auc:.4f}")
        
        # Print classification report
        print(f"  Classification Report:")
        print(classification_report(y_test, y_pred_test, target_names=['Healthy', 'Disease']))
        
        # Track best model based on AUC
        if test_auc > best_score:
            best_score = test_auc
            best_model = (name, model)
    
    # Hyperparameter tuning for best model
    print(f"\nPerforming hyperparameter tuning for {best_model[0]}...")
    
    if best_model[0] == 'random_forest':
        param_grid = {
            'n_estimators': [100, 200],
            'max_depth': [10, 20, None],
            'min_samples_split': [2, 5],
            'min_samples_leaf': [1, 2],
            'class_weight': [None, 'balanced']
        }
        grid_search = GridSearchCV(
            RandomForestClassifier(random_state=42),
            param_grid, cv=3, scoring='roc_auc', n_jobs=-1
        )
    elif best_model[0] == 'xgboost':
        param_grid = {
            'n_estimators': [100, 200],
            'max_depth': [3, 6, 10],
            'learning_rate': [0.01, 0.1, 0.2],
            'subsample': [0.8, 1.0],
            'scale_pos_weight': [1, 2, 3]
        }
        grid_search = GridSearchCV(
            xgb.XGBClassifier(random_state=42, eval_metric='logloss'),
            param_grid, cv=3, scoring='roc_auc', n_jobs=-1
        )
    else:
        grid_search = None
    
    if grid_search:
        grid_search.fit(X_train, y_train)
        tuned_model = grid_search.best_estimator_
        
        # Evaluate tuned model
        y_pred_tuned = tuned_model.predict(X_test)
        y_pred_proba_tuned = tuned_model.predict_proba(X_test)[:, 1]
        tuned_accuracy = accuracy_score(y_test, y_pred_tuned)
        tuned_auc = roc_auc_score(y_test, y_pred_proba_tuned)
        
        print(f"  Best parameters: {grid_search.best_params_}")
        print(f"  Tuned Test Accuracy: {tuned_accuracy:.4f}")
        print(f"  Tuned Test AUC: {tuned_auc:.4f}")
        
        # Use tuned model if better
        if tuned_auc > results[best_model[0]]['test_auc']:
            best_model = (best_model[0], tuned_model)
            print("  Using tuned model as final model")
    
    # Save models and preprocessor
    model_dir = "ml/models"
    os.makedirs(model_dir, exist_ok=True)
    
    # Save best model
    joblib.dump(best_model[1], os.path.join(model_dir, "disease_model.pkl"))
    
    # Save all models for comparison
    for name, result in results.items():
        joblib.dump(result['model'], os.path.join(model_dir, f"disease_{name}.pkl"))
    
    # Save preprocessor (if not already saved)
    if not os.path.exists(os.path.join(model_dir, "scalers.pkl")):
        preprocessor.save_preprocessors(model_dir)
    
    # Save model metadata
    metadata = {
        'best_model': best_model[0],
        'best_test_accuracy': results[best_model[0]]['test_accuracy'],
        'best_test_auc': results[best_model[0]]['test_auc'],
        'disease_prevalence': y_train.mean(),
        'training_samples': len(X_train),
        'test_samples': len(X_test)
    }
    
    joblib.dump(metadata, os.path.join(model_dir, "disease_metadata.pkl"))
    
    print(f"\nBest model: {best_model[0]}")
    print(f"Final Test Accuracy: {results[best_model[0]]['test_accuracy']:.4f}")
    print(f"Final Test AUC: {results[best_model[0]]['test_auc']:.4f}")
    print(f"Models saved to {model_dir}")
    
    return results

if __name__ == "__main__":
    results = train_disease_models()
