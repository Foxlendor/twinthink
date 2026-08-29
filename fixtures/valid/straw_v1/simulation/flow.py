"""
Discrete Sip Event and Flow Timeline Model.
Parses structured sip events or generates synthetic intermittent sip profiles.
"""

from typing import List, Dict, Any, Optional

class SipEvent:
    def __init__(self, start_time_s: float, duration_s: float, flow_rate_ml_s: float):
        self.start_time_s = float(start_time_s)
        self.duration_s = float(duration_s)
        self.flow_rate_ml_s = float(flow_rate_ml_s)
        self.end_time_s = self.start_time_s + self.duration_s

    def is_active(self, current_time_s: float) -> bool:
        return self.start_time_s <= current_time_s < self.end_time_s

    def flow_rate_kg_s(self, density_kg_m3: float = 1000.0) -> float:
        # 1 mL/s = 1e-6 m3/s = 0.001 kg/s for water
        return (self.flow_rate_ml_s * 1e-6) * density_kg_m3

    def to_dict(self) -> Dict[str, Any]:
        return {
            "start_time_s": self.start_time_s,
            "duration_s": self.duration_s,
            "flow_rate_ml_s": self.flow_rate_ml_s
        }

class FlowTimeline:
    def __init__(self, events: Optional[List[SipEvent]] = None):
        self.events: List[SipEvent] = events or []

    @classmethod
    def generate_periodic(
        cls,
        total_duration_s: int = 300,
        sip_interval_s: int = 30,
        sip_duration_s: int = 3,
        flow_rate_ml_s: float = 8.0,
        initial_delay_s: int = 20
    ) -> 'FlowTimeline':
        """Generates a reproducible periodic timeline of discrete sip events."""
        events = []
        t = initial_delay_s
        while t + sip_duration_s <= total_duration_s:
            events.append(SipEvent(start_time_s=t, duration_s=sip_duration_s, flow_rate_ml_s=flow_rate_ml_s))
            t += sip_interval_s
        return cls(events)

    def get_flow_at_time(self, t_s: float) -> float:
        """Returns the mass flow rate (kg/s) active at time t."""
        for ev in self.events:
            if ev.is_active(t_s):
                return ev.flow_rate_kg_s()
        return 0.0

    def is_sipping_at_time(self, t_s: float) -> bool:
        for ev in self.events:
            if ev.is_active(t_s):
                return True
        return False
