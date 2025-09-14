import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import joblib
import os
from datetime import datetime, timedelta
from supabase import create_client, Client

# Initialize Supabase client
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

class ModelEvaluator:
    def __init__(self):
        self.models = {}
        self.load_models()
        
    def load_models(self):
        """Load trained models"""
        model_files = {
            'linear_regression': 'models/linear_regression_model.pkl',
            'random_forest': 'models/random_forest_model.pkl',
            'xgboost': 'models/xgboost_model.pkl',
            'neural_network': 'models/neural_network_model.pkl'
        }
        
        for name, path in model_files.items():
            if os.path.exists(path):
                self.models[name] = joblib.load(path)
                print(f"Loaded {name} model")
            else:
                print(f"Model file not found: {path}")
                
    def evaluate_model_performance(self, X_test, y_test):
        """Evaluate all models on test data"""
        results = {}
        
        for model_name, model in self.models.items():
            y_pred = model.predict(X_test)
            
            results[model_name] = {
                'r2': r2_score(y_test, y_pred),
                'rmse': np.sqrt(mean_squared_error(y_test, y_pred)),
                'mae': mean_absolute_error(y_test, y_pred),
                'predictions': y_pred
            }
            
        return results
        
    def plot_model_comparison(self, results, y_test):
        """Create comparison plots for all models"""
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('Model Performance Comparison', fontsize=16)
        
        model_names = list(results.keys())
        
        for i, model_name in enumerate(model_names):
            row = i // 2
            col = i % 2
            
            y_pred = results[model_name]['predictions']
            r2 = results[model_name]['r2']
            rmse = results[model_name]['rmse']
            
            # Scatter plot of actual vs predicted
            axes[row, col].scatter(y_test, y_pred, alpha=0.6)
            axes[row, col].plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2)
            axes[row, col].set_xlabel('Actual Milk Yield')\n            axes[row, col].set_ylabel('Predicted Milk Yield')\n            axes[row, col].set_title(f'{model_name.replace(\"_\", \" \").title()}\\nR² = {r2:.3f}, RMSE = {rmse:.3f}')\n            \n        plt.tight_layout()\n        plt.savefig('model_comparison.png', dpi=300, bbox_inches='tight')\n        plt.show()\n        \n    def feature_importance_analysis(self):\n        \"\"\"Analyze feature importance for tree-based models\"\"\"\n        feature_names = [\n            'age_days', 'breed_encoded', 'weight', 'avg_daily_yield_7d',\n            'avg_daily_yield_30d', 'yield_trend_7d', 'fat_content_avg',\n            'protein_content_avg', 'days_since_last_record', 'seasonal_factor',\n            'health_status_encoded'\n        ]\n        \n        fig, axes = plt.subplots(1, 2, figsize=(15, 6))\n        \n        # Random Forest feature importance\n        if 'random_forest' in self.models:\n            rf_importance = self.models['random_forest'].feature_importances_\n            axes[0].barh(feature_names, rf_importance)\n            axes[0].set_title('Random Forest Feature Importance')\n            axes[0].set_xlabel('Importance')\n            \n        # XGBoost feature importance\n        if 'xgboost' in self.models:\n            xgb_importance = self.models['xgboost'].feature_importances_\n            axes[1].barh(feature_names, xgb_importance)\n            axes[1].set_title('XGBoost Feature Importance')\n            axes[1].set_xlabel('Importance')\n            \n        plt.tight_layout()\n        plt.savefig('feature_importance.png', dpi=300, bbox_inches='tight')\n        plt.show()\n        \n    def cross_validation_analysis(self, X, y, cv_folds=5):\n        \"\"\"Perform cross-validation analysis\"\"\"\n        from sklearn.model_selection import cross_val_score\n        \n        cv_results = {}\n        \n        for model_name, model in self.models.items():\n            # R² scores\n            r2_scores = cross_val_score(model, X, y, cv=cv_folds, scoring='r2')\n            \n            # RMSE scores (negative MSE, so we take sqrt of absolute)\n            mse_scores = -cross_val_score(model, X, y, cv=cv_folds, scoring='neg_mean_squared_error')\n            rmse_scores = np.sqrt(mse_scores)\n            \n            cv_results[model_name] = {\n                'r2_mean': r2_scores.mean(),\n                'r2_std': r2_scores.std(),\n                'rmse_mean': rmse_scores.mean(),\n                'rmse_std': rmse_scores.std()\n            }\n            \n        return cv_results\n        \n    def prediction_interval_analysis(self, X_test, y_test, confidence=0.95):\n        \"\"\"Analyze prediction intervals for uncertainty quantification\"\"\"\n        results = {}\n        \n        for model_name, model in self.models.items():\n            if model_name == 'random_forest':\n                # For Random Forest, we can use individual tree predictions\n                tree_predictions = np.array([tree.predict(X_test) for tree in model.estimators_])\n                \n                # Calculate prediction intervals\n                alpha = 1 - confidence\n                lower_percentile = (alpha / 2) * 100\n                upper_percentile = (1 - alpha / 2) * 100\n                \n                lower_bound = np.percentile(tree_predictions, lower_percentile, axis=0)\n                upper_bound = np.percentile(tree_predictions, upper_percentile, axis=0)\n                \n                # Calculate coverage (percentage of actual values within intervals)\n                coverage = np.mean((y_test >= lower_bound) & (y_test <= upper_bound))\n                \n                results[model_name] = {\n                    'lower_bound': lower_bound,\n                    'upper_bound': upper_bound,\n                    'coverage': coverage,\n                    'interval_width': np.mean(upper_bound - lower_bound)\n                }\n                \n        return results\n        \n    def temporal_performance_analysis(self):\n        \"\"\"Analyze model performance over time\"\"\"\n        # Fetch recent predictions from database\n        try:\n            response = supabase.table(\"predictions\").select(\"*\").order(\"created_at\", desc=False).execute()\n            \n            if not response.data:\n                print(\"No predictions found in database\")\n                return\n                \n            predictions_df = pd.DataFrame(response.data)\n            predictions_df['created_at'] = pd.to_datetime(predictions_df['created_at'])\n            \n            # Group by model and date\n            daily_performance = predictions_df.groupby([\n                predictions_df['created_at'].dt.date,\n                'model_version'\n            ]).agg({\n                'predicted_value': ['mean', 'std', 'count'],\n                'confidence_score': 'mean'\n            }).reset_index()\n            \n            # Plot temporal trends\n            plt.figure(figsize=(12, 8))\n            \n            for model_version in daily_performance['model_version'].unique():\n                model_data = daily_performance[daily_performance['model_version'] == model_version]\n                plt.plot(model_data['created_at'], model_data[('predicted_value', 'mean')], \n                        label=f'{model_version} - Mean Prediction', marker='o')\n                        \n            plt.xlabel('Date')\n            plt.ylabel('Mean Predicted Value')\n            plt.title('Model Predictions Over Time')\n            plt.legend()\n            plt.xticks(rotation=45)\n            plt.tight_layout()\n            plt.savefig('temporal_performance.png', dpi=300, bbox_inches='tight')\n            plt.show()\n            \n        except Exception as e:\n            print(f\"Error in temporal analysis: {e}\")\n            \n    def generate_evaluation_report(self, X_test, y_test):\n        \"\"\"Generate comprehensive evaluation report\"\"\"\n        print(\"=\" * 80)\n        print(\"CATTLE MILK PREDICTION MODEL EVALUATION REPORT\")\n        print(\"=\" * 80)\n        print(f\"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\")\n        print(f\"Test samples: {len(X_test)}\")\n        print()\n        \n        # Model performance\n        results = self.evaluate_model_performance(X_test, y_test)\n        \n        print(\"MODEL PERFORMANCE SUMMARY:\")\n        print(\"-\" * 50)\n        print(f\"{'Model':<20} {'R²':<10} {'RMSE':<10} {'MAE':<10}\")\n        print(\"-\" * 50)\n        \n        for model_name, metrics in results.items():\n            print(f\"{model_name:<20} {metrics['r2']:<10.4f} {metrics['rmse']:<10.4f} {metrics['mae']:<10.4f}\")\n            \n        # Best model\n        best_model = max(results.keys(), key=lambda x: results[x]['r2'])\n        print(f\"\\nBest performing model: {best_model} (R² = {results[best_model]['r2']:.4f})\")\n        \n        # Cross-validation results\n        print(\"\\nCROSS-VALIDATION RESULTS:\")\n        print(\"-\" * 50)\n        \n        # Load preprocessor to get full dataset\n        try:\n            from scripts.data_preprocessing import CattleDataPreprocessor\n            preprocessor = CattleDataPreprocessor()\n            df = preprocessor.fetch_training_data()\n            \n            if df is not None and len(df) > 0:\n                preprocessor.fit_encoders(df)\n                X_full, y_full = preprocessor.transform_features(df)\n                \n                cv_results = self.cross_validation_analysis(X_full, y_full)\n                \n                print(f\"{'Model':<20} {'R² (mean±std)':<20} {'RMSE (mean±std)':<20}\")\n                print(\"-\" * 60)\n                \n                for model_name, cv_metrics in cv_results.items():\n                    r2_str = f\"{cv_metrics['r2_mean']:.3f}±{cv_metrics['r2_std']:.3f}\"\n                    rmse_str = f\"{cv_metrics['rmse_mean']:.3f}±{cv_metrics['rmse_std']:.3f}\"\n                    print(f\"{model_name:<20} {r2_str:<20} {rmse_str:<20}\")\n                    \n        except Exception as e:\n            print(f\"Could not perform cross-validation: {e}\")\n            \n        print(\"\\n\" + \"=\" * 80)\n        \n        return results\n\ndef main():\n    \"\"\"Main evaluation pipeline\"\"\"\n    evaluator = ModelEvaluator()\n    \n    if not evaluator.models:\n        print(\"No trained models found. Please run model training first.\")\n        return\n        \n    # Load test data\n    try:\n        from scripts.data_preprocessing import CattleDataPreprocessor\n        preprocessor = CattleDataPreprocessor()\n        X_train, X_test, y_train, y_test = preprocessor.prepare_training_data()\n        \n        if X_test is None:\n            print(\"No test data available\")\n            return\n            \n        # Generate comprehensive evaluation\n        results = evaluator.generate_evaluation_report(X_test, y_test)\n        \n        # Create visualizations\n        evaluator.plot_model_comparison(results, y_test)\n        evaluator.feature_importance_analysis()\n        evaluator.temporal_performance_analysis()\n        \n        print(\"\\nEvaluation completed! Check generated plots for detailed analysis.\")\n        \n    except Exception as e:\n        print(f\"Error during evaluation: {e}\")\n\nif __name__ == \"__main__\":\n    main()\n```
