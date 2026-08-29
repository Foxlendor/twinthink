import unittest
from packages.twinthink.simulation.pcm import PCMCore, PCMState
from packages.twinthink.simulation.flow import FlowTimeline, SipEvent
from packages.twinthink.simulation.thermal import ThermalStrawSimulator
from packages.twinthink.simulation.calibration import calculate_error_metrics, generate_validation_report
from packages.twinthink.simulation.metrics import calculate_fork_delta

class TestSimulationEngine(unittest.TestCase):
    def test_pcm_latent_heat_plateau(self):
        pcm = PCMCore(mass_kg=0.05, latent_heat_J_kg=241000.0, activated=True)
        self.assertEqual(pcm.temp_C, 54.0)
        self.assertEqual(pcm.state, PCMState.SOLIDIFYING_LATENT_HEAT)

        # Step with 100 W cooling for 10 seconds -> 1000 J lost
        step1 = pcm.step(net_heat_flow_W=100.0, dt_s=10.0)
        self.assertEqual(step1["temperature_C"], 54.0)
        self.assertGreater(step1["latent_energy_remaining_J"], 0)
        self.assertGreater(step1["solid_fraction"], 0.0)

    def test_flow_timeline(self):
        timeline = FlowTimeline.generate_periodic(total_duration_s=100, sip_interval_s=20, sip_duration_s=3, flow_rate_ml_s=8.0, initial_delay_s=10)
        # At t=11 (during sip 10-13)
        self.assertTrue(timeline.is_sipping_at_time(11))
        self.assertAlmostEqual(timeline.get_flow_at_time(11), 0.008, places=4)
        # At t=15 (resting)
        self.assertFalse(timeline.is_sipping_at_time(15))
        self.assertEqual(timeline.get_flow_at_time(15), 0.0)

    def test_thermal_simulation_run(self):
        sim = ThermalStrawSimulator()
        timeline = FlowTimeline.generate_periodic(total_duration_s=60, sip_interval_s=15, sip_duration_s=3)
        res = sim.simulate(timeline, duration_s=60)
        self.assertEqual(len(res["time_s"]), 61)
        self.assertGreater(res["summary"]["peak_beverage_temp_C"], 10.0)
        self.assertGreater(res["summary"]["total_thermal_yield_kJ"], 0.5)

    def test_calibration_metrics(self):
        pred = [10.0, 15.0, 20.0, 25.0]
        meas = [10.5, 14.5, 19.8, 24.2]
        metrics = calculate_error_metrics(pred, meas)
        self.assertLess(metrics["rmse_C"], 1.0)
        self.assertGreater(metrics["r_squared"], 0.95)

    def test_fork_delta(self):
        p_sum = {"peak_beverage_temp_C": 20.0, "total_thermal_yield_kJ": 5.0, "crystallization_plateau_duration_s": 150}
        f_sum = {"peak_beverage_temp_C": 23.5, "total_thermal_yield_kJ": 6.8, "crystallization_plateau_duration_s": 180}
        delta = calculate_fork_delta(p_sum, f_sum)
        self.assertEqual(delta["peak_temperature_delta_C"], 3.5)
        self.assertEqual(delta["thermal_yield_delta_kJ"], 1.8)
        self.assertEqual(delta["verdict"], "OPTIMIZED")

if __name__ == "__main__":
    unittest.main()
