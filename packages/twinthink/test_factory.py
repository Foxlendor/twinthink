import unittest

from twinthink.factory import TwinFactoryEngine


class TwinFactoryTests(unittest.TestCase):
    def test_factory_does_not_invent_claims(self):
        twin = TwinFactoryEngine.process_bundle({
            "notes.md": b"# A Small Machine\nA prototype concept.",
            "design.step": b"not real CAD bytes",
        }, twin_id="draft", author="Tester")

        self.assertEqual(twin.identity.title, "A Small Machine")
        self.assertEqual(twin.identity.creator, "Tester")
        self.assertEqual(twin.claims, [])
        self.assertEqual(twin.object.cad_step_path, "design.step")
        self.assertIn("No physical telemetry/test CSV was identified.", twin.unknowns_and_assumptions)

    def test_factory_extracts_bom_without_fabricating_materials(self):
        twin = TwinFactoryEngine.process_bundle({
            "bom.csv": b"part,qty,material,unit_cost_usd\nTube,2,316L,1.25\nSeal,1,Silicone,0.50\n"
        })

        self.assertEqual(len(twin.structure.components), 2)
        self.assertAlmostEqual(twin.structure.estimated_bom_usd, 3.0)
        self.assertEqual(twin.structure.components[0].material, "316L")
        self.assertEqual(twin.claims, [])


if __name__ == "__main__":
    unittest.main()
