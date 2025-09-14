import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional, List
import os
from ml.data_preprocessing import CattleDataPreprocessor

class CattlePredictionService:
    """Service for making predictions using trained models"""
    
    def __init__(self, model_dir: str = "ml/models"):
        self.model_dir = model_dir
        self.milk_model = None
        self.disease_model = None
        self.preprocessor = None
        self.milk_metadata = None
        self.disease_metadata = None
        
        self.load_models()
    
    def load_models(self):
        """Load trained models and preprocessors"""
        try:
            # Load models
            milk_model_path = os.path.join(self.model_dir, "milk_yield_model.pkl")
            disease_model_path = os.path.join(self.model_dir, "disease_model.pkl")
            
            if os.path.exists(milk_model_path):
                self.milk_model = joblib.load(milk_model_path)
                print("Milk yield model loaded successfully")
            
            if os.path.exists(disease_model_path):
                self.disease_model = joblib.load(disease_model_path)
                print("Disease prediction model loaded successfully")
            
            # Load preprocessor
            self.preprocessor = CattleDataPreprocessor()
            if self.preprocessor.load_preprocessors(self.model_dir):
                print("Preprocessors loaded successfully")
            
            # Load metadata
            try:
                self.milk_metadata = joblib.load(os.path.join(self.model_dir, "milk_yield_metadata.pkl"))
                self.disease_metadata = joblib.load(os.path.join(self.model_dir, "disease_metadata.pkl"))
            except FileNotFoundError:
                print("Model metadata not found")
                
        except Exception as e:
            print(f"Error loading models: {e}")
    
    def predict_milk_yield(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Predict milk yield for a cow"""
        # if self.milk_model is None or self.preprocessor is None:
        #     return self._mock_milk_prediction(features)
        
        try:
            # Convert features to DataFrame
            df = pd.DataFrame([features])
            
            # Preprocess features
            X, _ = self.preprocessor.prepare_milk_yield_data(df)
            
            # Make prediction
            prediction = self.milk_model.predict(X)[0]
            
            # Calculate confidence (simplified)
            if hasattr(self.milk_model, 'predict_proba'):
                # For models that support probability prediction
                confidence = 0.85  # Placeholder
            else:
                # For regression models, use a heuristic
                confidence = min(0.95, max(0.6, 1.0 - abs(prediction - 25) / 25))
            
            # Analyze factors (feature importance if available)
            factors = self._analyze_milk_factors(features, prediction)
            
            return {
                "predicted_milk_yield": round(prediction, 2),
                "confidence_score": round(confidence, 3),
                "factors": factors,
                "model_used": self.milk_metadata.get('best_model', 'unknown') if self.milk_metadata else 'unknown'
            }
            
        except Exception as e:
            print(f"Error in milk yield prediction: {e}")
            return self._mock_milk_prediction(features)
    
    def predict_disease_risk(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Predict disease risk for a cow"""
        if self.disease_model is None or self.preprocessor is None:
            return self._mock_disease_prediction(features)
        
        try:
            # Convert features to DataFrame
            df = pd.DataFrame([features])
            
            # Preprocess features
            X, _ = self.preprocessor.prepare_disease_data(df)
            
            # Make prediction
            risk_probability = self.disease_model.predict_proba(X)[0][1]
            
            # Determine risk level
            if risk_probability < 0.2:
                risk_level = "low"
            elif risk_probability < 0.5:
                risk_level = "medium"
            elif risk_probability < 0.8:
                risk_level = "high"
            else:
                risk_level = "critical"
            
            # Generate recommendations
            recommendations = self._generate_recommendations(features, risk_probability, risk_level)
            
            # Calculate confidence
            confidence = max(abs(risk_probability - 0.5) * 2, 0.6)
            
            return {
                "disease_risk": round(risk_probability, 3),
                "risk_level": risk_level,
                "recommended_actions": recommendations,
                "confidence_score": round(confidence, 3),
                "model_used": self.disease_metadata.get('best_model', 'unknown') if self.disease_metadata else 'unknown'
            }
            
        except Exception as e:
            print(f"Error in disease prediction: {e}")
            return self._mock_disease_prediction(features)
    
    def _analyze_milk_factors(self, features: Dict[str, Any], prediction: float) -> Dict[str, str]:
        """Analyze factors affecting milk yield prediction"""
        factors = {}
        
        # Health score impact
        health_score = features.get('health_score', 7)
        if health_score >= 8:
            factors['health'] = "Excellent health supporting high yield"
        elif health_score >= 6:
            factors['health'] = "Good health, minor impact on yield"
        else:
            factors['health'] = "Poor health significantly reducing yield"
        
        # Feed quality impact
        protein_content = features.get('protein_content_percent', 16)
        if protein_content >= 18:
            factors['nutrition'] = "High protein feed boosting production"
        elif protein_content >= 14:
            factors['nutrition'] = "Adequate nutrition for normal production"
        else:
            factors['nutrition'] = "Low protein feed limiting yield potential"
        
        # Age and parity impact
        age_months = features.get('age_months', 60)
        parity = features.get('parity', 2)
        if 48 <= age_months <= 84 and 2 <= parity <= 4:
            factors['maturity'] = "Optimal age and parity for peak production"
        else:
            factors['maturity'] = "Age/parity affecting production efficiency"
        
        return factors
    
    def _generate_recommendations(self, features: Dict[str, Any], risk: float, level: str) -> List[str]:
        """Generate health recommendations based on risk factors"""
        recommendations = []
        
        if level in ["high", "critical"]:
            recommendations.append("Schedule immediate veterinary examination")
            recommendations.append("Increase monitoring frequency")
        
        health_score = features.get('health_score', 7)
        if health_score < 6:
            recommendations.append("Investigate causes of poor health score")
            recommendations.append("Review feeding and housing conditions")
        
        activity_hours = features.get('activity_hours', 7)
        if activity_hours < 5:
            recommendations.append("Monitor for signs of lameness or illness")
            recommendations.append("Ensure adequate space and comfortable environment")
        
        age_months = features.get('age_months', 60)
        if age_months > 96:  # Over 8 years
            recommendations.append("Consider increased health monitoring for older animal")
        
        if level == "medium" and not recommendations:
            recommendations.append("Continue regular monitoring")
            recommendations.append("Maintain current health protocols")
        
        if level == "low":
            recommendations = ["Continue current management practices", "Regular health checks sufficient"]
        
        return recommendations
    
    def _mock_milk_prediction(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Mock milk yield prediction when models are not available"""
        # Simple heuristic based on features
        base_yield = 20
        
        # Adjust based on health score
        health_score = features.get('health_score', 7)
        health_factor = health_score / 10
        
        # Adjust based on feed quality
        protein_content = features.get('protein_content_percent', 16)
        feed_factor = min(1.2, protein_content / 16)
        
        # Adjust based on age
        age_months = features.get('age_months', 60)
        age_factor = 1.0 if 48 <= age_months <= 84 else 0.9
        
        prediction = base_yield * health_factor * feed_factor * age_factor
        
        return {
            "predicted_milk_yield": round(prediction, 2),
            "confidence_score": 0.75,
            "factors": {
                "health": f"Health score {health_score}/10",
                "nutrition": f"Protein content {protein_content}%",
                "age": f"Age {age_months} months"
            },
            "model_used": "mock"
        }
    
    def _mock_disease_prediction(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Mock disease prediction when models are not available"""
        # Simple heuristic based on health score
        health_score = features.get('health_score', 7)
        age_months = features.get('age_months', 60)
        
        # Base risk calculation
        risk = 0.1  # 10% base risk
        
        if health_score < 5:
            risk += 0.4
        elif health_score < 7:
            risk += 0.2
        
        if age_months > 96:
            risk += 0.15
        
        risk = min(risk, 0.95)
        
        # Determine risk level
        if risk < 0.2:
            risk_level = "low"
        elif risk < 0.5:
            risk_level = "medium"
        elif risk < 0.8:
            risk_level = "high"
        else:
            risk_level = "critical"
        
        recommendations = self._generate_recommendations(features, risk, risk_level)
        
        return {
            "disease_risk": round(risk, 3),
            "risk_level": risk_level,
            "recommended_actions": recommendations,
            "confidence_score": 0.70,
            "model_used": "mock"
        }

# Global service instance
prediction_service = CattlePredictionService()
