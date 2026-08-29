"""
Phase-Change Material (PCM) State Machine for Sodium Acetate Trihydrate (SAT).
Models: Supercooled Liquid -> Nucleation -> Latent Heat Plateau -> Solidified Sensible Cooling.
"""

from enum import Enum
from typing import Dict, Any

class PCMState(Enum):
    SUPERCOOLED_LIQUID = "supercooled_liquid"
    NUCLEATING = "nucleating"
    SOLIDIFYING_LATENT_HEAT = "solidifying_latent_heat"
    SOLIDIFIED_SENSIBLE_COOLING = "solidified_sensible_cooling"

class PCMCore:
    def __init__(
        self,
        mass_kg: float = 0.05,
        T_melt_C: float = 54.0,
        latent_heat_J_kg: float = 241000.0,
        c_liquid_J_kgK: float = 3000.0,
        c_solid_J_kgK: float = 2000.0,
        initial_temp_C: float = 20.0,
        activated: bool = True
    ):
        self.mass_kg = mass_kg
        self.T_melt_C = T_melt_C
        self.latent_heat_J_kg = latent_heat_J_kg
        self.total_latent_energy_J = mass_kg * latent_heat_J_kg
        self.c_liquid = c_liquid_J_kgK
        self.c_solid = c_solid_J_kgK
        
        self.temp_C = initial_temp_C
        self.latent_energy_remaining_J = self.total_latent_energy_J if activated else 0.0
        self.solid_fraction = 0.0
        self.state = PCMState.NUCLEATING if activated else PCMState.SUPERCOOLED_LIQUID
        
        if activated:
            # Immediate exothermic temperature jump to phase change temp upon nucleation
            self.temp_C = self.T_melt_C
            self.state = PCMState.SOLIDIFYING_LATENT_HEAT

    @property
    def effective_heat_capacity(self) -> float:
        """Specific heat capacity depending on solid fraction."""
        return (1.0 - self.solid_fraction) * self.c_liquid + self.solid_fraction * self.c_solid

    def step(self, net_heat_flow_W: float, dt_s: float) -> Dict[str, Any]:
        """
        Integrates one time step for the PCM core.
        net_heat_flow_W > 0 means heat leaving the PCM (cooling).
        """
        energy_loss_J = net_heat_flow_W * dt_s

        if self.state == PCMState.SOLIDIFYING_LATENT_HEAT:
            if self.latent_energy_remaining_J > energy_loss_J:
                self.latent_energy_remaining_J -= energy_loss_J
                self.solid_fraction = 1.0 - (self.latent_energy_remaining_J / self.total_latent_energy_J)
                # Temperature remains pinned at latent phase-change plateau
                self.temp_C = self.T_melt_C
            else:
                # Latent heat fully exhausted -> transition to sensible solid cooling
                excess_energy_J = energy_loss_J - self.latent_energy_remaining_J
                self.latent_energy_remaining_J = 0.0
                self.solid_fraction = 1.0
                self.state = PCMState.SOLIDIFIED_SENSIBLE_COOLING
                
                # Apply excess sensible cooling
                dT = -excess_energy_J / (self.mass_kg * self.c_solid)
                self.temp_C += dT
        elif self.state == PCMState.SOLIDIFIED_SENSIBLE_COOLING:
            dT = -energy_loss_J / (self.mass_kg * self.c_solid)
            self.temp_C += dT

        return {
            "temperature_C": self.temp_C,
            "state": self.state.value,
            "solid_fraction": round(self.solid_fraction, 4),
            "latent_energy_remaining_J": round(self.latent_energy_remaining_J, 1)
        }
