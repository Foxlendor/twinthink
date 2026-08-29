"""
Lineage & Fork Optimization Delta Calculator.
Compares performance metrics between parent twin and mutated forked twin.
"""

from typing import Dict, Any

def calculate_fork_delta(
    parent_summary: Dict[str, Any],
    fork_summary: Dict[str, Any],
    parent_params: Dict[str, Any] = None,
    fork_params: Dict[str, Any] = None
) -> Dict[str, Any]:
    peak_diff = fork_summary["peak_beverage_temp_C"] - parent_summary["peak_beverage_temp_C"]
    energy_diff = fork_summary["total_thermal_yield_kJ"] - parent_summary["total_thermal_yield_kJ"]
    plateau_diff = fork_summary["crystallization_plateau_duration_s"] - parent_summary["crystallization_plateau_duration_s"]

    param_deltas = {}
    if parent_params and fork_params:
        for k in fork_params:
            if k in parent_params and fork_params[k] != parent_params[k]:
                param_deltas[k] = {
                    "parent": parent_params[k],
                    "fork": fork_params[k],
                    "delta": fork_params[k] - parent_params[k] if isinstance(fork_params[k], (int, float)) else "modified"
                }

    return {
        "peak_temperature_delta_C": round(peak_diff, 2),
        "thermal_yield_delta_kJ": round(energy_diff, 2),
        "plateau_duration_delta_s": plateau_diff,
        "parameter_mutations": param_deltas,
        "verdict": "OPTIMIZED" if peak_diff >= 0 and energy_diff >= 0 else "COMPROMISED"
    }
