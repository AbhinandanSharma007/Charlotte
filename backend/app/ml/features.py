import pandas as pd
import numpy as np

def engineer_features(readings: list[dict], twins: list[dict]) -> pd.DataFrame:
    """
    Given a list of meter reading dictionaries and digital twin dictionaries,
    compute ML features for each meter.
    """
    df_readings = pd.DataFrame(readings)
    df_twins = pd.DataFrame(twins)
    
    if df_readings.empty:
        return pd.DataFrame()
        
    df_readings['timestamp'] = pd.to_datetime(df_readings['timestamp'])
    
    features = []
    
    for meter_id, group in df_readings.groupby('meter_id'):
        twin = df_twins[df_twins['meter_id'] == meter_id].iloc[0] if not df_twins.empty and meter_id in df_twins['meter_id'].values else None
        
        # Total consumption
        total_kwh = group['energy_kwh'].sum()
        
        # Night consumption ratio (assuming 22:00 to 06:00 is night)
        night_mask = (group['timestamp'].dt.hour >= 22) | (group['timestamp'].dt.hour < 6)
        night_kwh = group.loc[night_mask, 'energy_kwh'].sum()
        night_consumption_ratio = night_kwh / total_kwh if total_kwh > 0 else 0
        
        # Deviation from twin
        avg_daily = twin['avg_daily_kwh'] if twin is not None else 10.0
        deviation_score = twin['deviation_score'] if twin is not None else 0.0
        actual_daily = total_kwh # Assuming readings are for 1 day for this feature
        deviation_from_twin = abs(actual_daily - avg_daily) / avg_daily if avg_daily > 0 else 0
        
        # PF anomaly
        avg_pf = group['power_factor'].mean()
        pf_anomaly = 1 if avg_pf < 0.85 else 0
        
        # THD z-score (we just use raw THD mean here for simplicity unless we do cross-meter)
        mean_thd = group['thd'].mean()
        
        # Voltage sag count
        voltage_sag_count = (group['voltage'] < 225).sum()
        
        # Consumption variance
        consumption_variance = group['power_kw'].std() / group['power_kw'].mean() if group['power_kw'].mean() > 0 else 0
        
        features.append({
            'meter_id': meter_id,
            'night_consumption_ratio': night_consumption_ratio,
            'deviation_score': deviation_score,
            'deviation_from_twin': deviation_from_twin,
            'pf_anomaly': pf_anomaly,
            'mean_thd': mean_thd,
            'voltage_sag_count': voltage_sag_count,
            'consumption_variance': consumption_variance,
            'transformer_load_delta': 0.1 # Placeholder until we join transformer data
        })
        
    return pd.DataFrame(features)
