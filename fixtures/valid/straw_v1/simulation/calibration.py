"""
Calibration Engine & Experimental Verification.
Calculates statistical error metrics (RMSE, MAE, Max Error, R^2) comparing simulated predictions against physical test logs.
"""

import math
from typing import List, Dict, Any

def calculate_error_metrics(predicted: List[float], measured: List[float]) -> Dict[str, float]:
    """Calculates RMSE, MAE, Max Error, and R^2 between prediction and sensor data."""
    n = min(len(predicted), len(measured))
    if n == 0:
        return {"rmse": 0.0, "mae": 0.0, "max_error": 0.0, "r_squared": 0.0}

    p = predicted[:n]
    m = measured[:n]

    errors = [p[i] - m[i] for i in range(n)]
    abs_errors = [abs(e) for e in errors]
    sq_errors = [e ** 2 for e in errors]

    mae = sum(abs_errors) / n
    rmse = math.sqrt(sum(sq_errors) / n)
    max_error = max(abs_errors)

    # R^2 calculation
    mean_m = sum(m) / n
    ss_tot = sum((m[i] - mean_m) ** 2 for i in range(n))
    ss_res = sum(sq_errors)
    r_squared = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 1.0

    return {
        "rmse_C": round(rmse, 3),
        "mae_C": round(mae, 3),
        "max_error_C": round(max_error, 3),
        "r_squared": round(max(0.0, r_squared), 4),
        "sample_count": n
    }

def generate_validation_report(
    test_id: str,
    sim_results: Dict[str, Any],
    measured_bev_temps: List[float]
) -> Dict[str, Any]:
    metrics = calculate_error_metrics(sim_results["beverage_temp_C"], measured_bev_temps)
    
    status = "CALIBRATED_PASS" if metrics["rmse_C"] < 2.5 else "CALIBRATION_REQUIRED"

    return {
        "test_id": test_id,
        "calibration_status": status,
        "metrics": metrics,
        "summary": {
            "predicted_peak_C": sim_results["summary"]["peak_beverage_temp_C"],
            "measured_peak_C": round(max(measured_bev_temps), 2),
            "peak_delta_C": round(sim_results["summary"]["peak_beverage_temp_C"] - max(measured_bev_temps), 2)
        }
    }
