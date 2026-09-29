import os
import joblib
from sklearn.ensemble import GradientBoostingClassifier
from datetime import datetime

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "ml_models")

class TheftDetectionModel:
    def __init__(self, version: str = "v1.0"):
        self.version = version
        self.model = None
        self.features = [
            'night_consumption_ratio',
            'deviation_score',
            'deviation_from_twin',
            'pf_anomaly',
            'mean_thd',
            'voltage_sag_count',
            'consumption_variance',
            'transformer_load_delta'
        ]

    def train(self, X, y):
        self.model = GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=4,
            random_state=42
        )
        self.model.fit(X[self.features], y)
        
    def predict_proba(self, X):
        if not self.model:
            raise ValueError("Model not trained or loaded.")
        return self.model.predict_proba(X[self.features])[:, 1]
        
    def save(self):
        if not os.path.exists(MODEL_DIR):
            os.makedirs(MODEL_DIR)
        path = os.path.join(MODEL_DIR, f"theft_model_{self.version}.joblib")
        joblib.dump(self.model, path)
        return path
        
    def load(self):
        path = os.path.join(MODEL_DIR, f"theft_model_{self.version}.joblib")
        if os.path.exists(path):
            self.model = joblib.load(path)
            return True
        return False
        
    def get_feature_importance(self):
        if not self.model:
            return {}
        importance = self.model.feature_importances_
        return {self.features[i]: float(importance[i]) for i in range(len(self.features))}
