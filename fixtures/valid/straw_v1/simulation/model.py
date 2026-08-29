"""
Thermodynamic Digital Twin Physics Engine for Phase-Change Thermal Straws.
Implements a multi-node lumped capacitance heat transfer model with intermittent flow convection.
"""

import json
import os
from typing import Dict, List, Any

def run_thermal_simulation(params: Dict[str, Any] = None) -> Dict[str, Any]:
    # Default parameters based on physical prototype
    p = {
        "mass_sa": 0.05,       # kg (50g Sodium Acetate Trihydrate)
        "c_sa": 3000.0,        # J/(kg*K) Specific heat of SAT
        "mass_bev": 0.02,      # kg (20g liquid inside chamber)
        "c_bev": 4184.0,       # J/(kg*K) Specific heat of water/beverage
        "R_wall": 0.45,        # K/W Thermal resistance of internal heat exchanger wall
        "R_env": 2.2,          # K/W Thermal resistance to ambient environment
        "T_sa_peak": 54.0,     # °C Exothermic crystallization temperature
        "T_inlet": 5.0,        # °C Cold drink cup temperature
        "T_env": 21.0,         # °C Room temperature
        "sip_duration": 3,     # seconds per sip
        "sip_interval": 15,    # seconds between sips
        "peak_flow": 0.006,    # kg/s (~6 mL/s flow rate while sipping)
        "time_steps": 300,     # seconds (5 minutes total)
        "dt": 1.0              # time step in seconds
    }
    
    if params:
        p.update(params)

    mass_sa = float(p["mass_sa"])
    c_sa = float(p["c_sa"])
    mass_bev = float(p["mass_bev"])
    c_bev = float(p["c_bev"])
    R_wall = float(p["R_wall"])
    R_env = float(p["R_env"])
    T_sa = float(p["T_sa_peak"])
    T_inlet = float(p["T_inlet"])
    T_bev = float(p["T_inlet"])
    T_env = float(p["T_env"])
    sip_duration = int(p["sip_duration"])
    sip_interval = int(p["sip_interval"])
    peak_flow = float(p["peak_flow"])
    time_steps = int(p["time_steps"])
    dt = float(p["dt"])

    history_time: List[int] = []
    history_T_sa: List[float] = []
    history_T_bev: List[float] = []
    history_flow_active: List[bool] = []
    history_heat_delivered: List[float] = []

    cumulative_joules_to_drink = 0.0

    for t in range(time_steps):
        # 1. Evaluate intermittent human sip cycle
        time_in_cycle = t % sip_interval
        is_sipping = time_in_cycle < sip_duration

        # 2. Conduction heat transfer rates (Watts = J/s)
        q_to_bev = (T_sa - T_bev) / R_wall
        q_to_env = (T_sa - T_env) / R_env

        # 3. Convection heat carried away by the flowing liquid
        if is_sipping:
            q_flow = peak_flow * c_bev * (T_bev - T_inlet)
        else:
            q_flow = 0.0

        # 4. Numerical integration (Euler forward step)
        dT_sa = (-q_to_bev - q_to_env) * dt / (mass_sa * c_sa)
        dT_bev = (q_to_bev - q_flow) * dt / (mass_bev * c_bev)

        T_sa += dT_sa
        T_bev += dT_bev
        cumulative_joules_to_drink += q_to_bev * dt

        history_time.append(t)
        history_T_sa.append(round(T_sa, 2))
        history_T_bev.append(round(T_bev, 2))
        history_flow_active.append(is_sipping)
        history_heat_delivered.append(round(cumulative_joules_to_drink, 1))

    return {
        "parameters": p,
        "results": {
            "time_seconds": history_time,
            "T_sodium_acetate_C": history_T_sa,
            "T_beverage_chamber_C": history_T_bev,
            "is_sipping": history_flow_active,
            "cumulative_joules": history_heat_delivered,
            "summary": {
                "peak_beverage_temp_C": round(max(history_T_bev), 2),
                "final_sa_temp_C": round(history_T_sa[-1], 2),
                "total_energy_delivered_joules": round(cumulative_joules_to_drink, 1),
                "total_sips": time_steps // sip_interval
            }
        }
    }

if __name__ == "__main__":
    out = run_thermal_simulation()
    print("Simulation Run Complete:")
    print("Peak Beverage Temp:", out["results"]["summary"]["peak_beverage_temp_C"], "°C")
    print("Total Energy Delivered:", out["results"]["summary"]["total_energy_delivered_joules"], "J")
