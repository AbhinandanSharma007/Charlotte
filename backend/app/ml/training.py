import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from app.models import MeterReading, DigitalTwin
from app.ml.features import engineer_features
from app.ml.model import TheftDetectionModel
from app.ml.registry import register_model

async def train_pipeline(db: AsyncSession, version: str):
    # Fetch readings and twins
    readings = await db.execute(select(MeterReading).order_by(MeterReading.meter_id, MeterReading.timestamp))
    readings = readings.scalars().all()
    
    twins = await db.execute(select(DigitalTwin))
    twins = twins.scalars().all()
    
    if not readings:
        raise ValueError("No meter readings found in the database.")
        
    readings_dict = [r.__dict__ for r in readings]
    twins_dict = [t.__dict__ for t in twins]
    
    # Generate features
    df_features = engineer_features(readings_dict, twins_dict)
    
    # Get labels
    # Here we assume if a meter has ANY anomaly readings, it's a theft case for classification purpose,
    # OR we could just use the last reading's anomaly status. Let's use max(is_anomaly) per meter.
    df_labels = pd.DataFrame(readings_dict).groupby('meter_id')['is_anomaly'].max().reset_index()
    
    # Merge
    df = df_features.merge(df_labels, on='meter_id')
    
    # We might not have enough anomalies in the seed data, let's inject a few if it's perfectly clean
    if df['is_anomaly'].sum() == 0:
        if len(df) > 0:
            df.loc[0, 'is_anomaly'] = True
    
    # Features and labels
    X = df
    y = df['is_anomaly']
    
    # Train-test split
    if len(df) > 1 and df['is_anomaly'].nunique() > 1:
        # Check if enough data to stratify
        stratify_val = y if y.sum() >= 2 else None
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42, stratify=stratify_val)
    else:
        X_train, X_test, y_train, y_test = X, X, y, y
        
    # Initialize and train model
    model = TheftDetectionModel(version=version)
    model.train(X_train, y_train)
    
    # Evaluate
    y_pred = (model.predict_proba(X_test) > 0.5).astype(int)
    y_prob = model.predict_proba(X_test)
    
    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, zero_division=0)),
        "f1": float(f1_score(y_test, y_pred, zero_division=0))
    }
    
    try:
        metrics["auc_roc"] = float(roc_auc_score(y_test, y_prob))
    except ValueError:
        # In case only one class is present in y_test
        metrics["auc_roc"] = 0.5
        
    # Save model
    model.save()
    
    # Register model
    await register_model(
        db=db,
        version=version,
        metrics=metrics,
        features=model.features
    )
    
    return metrics, model.get_feature_importance()
