"""
Multi-Node Lumped Capacitance Thermal ODE Engine.
Integrates:
  Node 1: Sodium Acetate Phase-Change Core (T_pcm)
  Node 2: Straw Chamber Wall (T_wall)
  Node 3: Beverage Fluid Stream (T_bev)
  Node 4: Ambient Environment (T_ambient)
"""

from typing import Dict, List, Any
from .pcm import PCMCore
from .flow import FlowTimeline

class ThermalStrawSimulator:
    def __init__(self, geometry: Dict[str, Any] = None, thermal: Dict[str, Any] = None):
        g = geometry or {
            "straw_length_mm": 220.0,
            "inner_diameter_mm": 6.0,
            "wall_thickness_mm": 1.0,
            "pcm_volume_ml": 50.0,
            "heat_transfer_area_mm2": 12400.0
        }
        t = thermal or {
            "m_pcm_kg": 0.05,
            "m_wall_kg": 0.015,
            "c_wall_J_kgK": 500.0,  # 316 Stainless Steel
            "m_bev_kg": 0.02,
            "c_bev_J_kgK": 4184.0,  # Pure Water
            "R_pcm_to_wall": 0.15,  # K/W
            "R_wall_to_bev": 0.30,  # K/W
            "R_env": 2.20,          # K/W
            "T_ambient_C": 21.0,
            "T_inlet_C": 5.0,
            "T_pcm_init_C": 54.0
        }
        self.g = g
        self.t = t

    def simulate(self, timeline: FlowTimeline, duration_s: int = 300, dt_s: float = 1.0) -> Dict[str, Any]:
        pcm = PCMCore(
            mass_kg=self.t["m_pcm_kg"],
            T_melt_C=self.t["T_pcm_init_C"],
            initial_temp_C=self.t["T_pcm_init_C"],
            activated=True
        )

        T_wall = self.t["T_inlet_C"]
        T_bev = self.t["T_inlet_C"]
        T_amb = self.t["T_ambient_C"]
        T_inlet = self.t["T_inlet_C"]

        c_wall = self.t["c_wall_J_kgK"]
        m_wall = self.t["m_wall_kg"]
        c_bev = self.t["c_bev_J_kgK"]
        m_bev = self.t["m_bev_kg"]

        R_pw = self.t["R_pcm_to_wall"]
        R_wb = self.t["R_wall_to_bev"]
        R_env = self.t["R_env"]

        time_records: List[int] = []
        pcm_temp_records: List[float] = []
        wall_temp_records: List[float] = []
        bev_temp_records: List[float] = []
        flow_records: List[float] = []
        latent_frac_records: List[float] = []
        cumulative_energy_J = 0.0

        current_t = 0.0
        while current_t <= duration_s:
            # 1. Flow convection state
            flow_kg_s = timeline.get_flow_at_time(current_t)
            is_sipping = timeline.is_sipping_at_time(current_t)

            # 2. Conduction & Convection Heat Fluxes (Watts)
            q_pcm_to_wall = (pcm.temp_C - T_wall) / R_pw
            q_pcm_to_env = (pcm.temp_C - T_amb) / R_env
            q_wall_to_bev = (T_wall - T_bev) / R_wb
            
            # Open-system convective energy transport when drinking
            q_flow = flow_kg_s * c_bev * (T_bev - T_inlet) if is_sipping else 0.0

            # 3. Node Energy Balances
            # PCM Step
            pcm_step_info = pcm.step(net_heat_flow_W=(q_pcm_to_wall + q_pcm_to_env), dt_s=dt_s)

            # Wall Step: C_wall * dT_wall/dt = q_pcm_to_wall - q_wall_to_bev
            dT_wall = (q_pcm_to_wall - q_wall_to_bev) * dt_s / (m_wall * c_wall)
            T_wall += dT_wall

            # Beverage Step: C_bev * dT_bev/dt = q_wall_to_bev - q_flow
            dT_bev = (q_wall_to_bev - q_flow) * dt_s / (m_bev * c_bev)
            T_bev += dT_bev

            cumulative_energy_J += q_wall_to_bev * dt_s

            time_records.append(int(current_t))
            pcm_temp_records.append(round(pcm.temp_C, 2))
            wall_temp_records.append(round(T_wall, 2))
            bev_temp_records.append(round(T_bev, 2))
            flow_records.append(round(flow_kg_s * 1000.0, 2))
            latent_frac_records.append(pcm_step_info["solid_fraction"])

            current_t += dt_s

        return {
            "time_s": time_records,
            "pcm_temp_C": pcm_temp_records,
            "wall_temp_C": wall_temp_records,
            "beverage_temp_C": bev_temp_records,
            "flow_rate_ml_s": flow_records,
            "solid_fraction": latent_frac_records,
            "summary": {
                "peak_beverage_temp_C": round(max(bev_temp_records), 2),
                "final_pcm_temp_C": round(pcm_temp_records[-1], 2),
                "total_thermal_yield_kJ": round(cumulative_energy_J / 1000.0, 2),
                "crystallization_plateau_duration_s": sum(1 for f in latent_frac_records if f < 1.0)
            }
        }
