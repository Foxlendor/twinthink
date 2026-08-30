"""
Database migration & seeding script for physical test telemetry.
Creates the twin_tests table in Neon Postgres and seeds initial test runs.
"""

import os
import json
import psycopg2
from dotenv import load_dotenv

load_dotenv('apps/api/.env')
DB_URL = os.getenv('DATABASE_URL')

def setup_tests_table():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS twin_tests (
        id VARCHAR(64) PRIMARY KEY,
        twin_id INT NOT NULL REFERENCES twins(id) ON DELETE CASCADE,
        test_number INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        operator VARCHAR(64) NOT NULL DEFAULT 'Anon',
        status VARCHAR(32) NOT NULL DEFAULT 'verified',
        notes TEXT,
        s3_csv_key TEXT NOT NULL,
        metrics JSONB NOT NULL,
        initial_conditions JSONB NOT NULL,
        raw_preview JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_twin_tests_twin_id ON twin_tests(twin_id);
    """)

    conn.commit()
    print("twin_tests table created successfully!")

    # Check if tests exist for twin 1
    cur.execute("SELECT COUNT(*) FROM twin_tests WHERE twin_id = 1")
    count = cur.fetchone()[0]

    if count == 0:
        test_1_metrics = {
            "rmse_C": 1.72,
            "mae_C": 1.28,
            "max_error_C": 2.85,
            "r_squared": 0.942,
            "sample_count": 300,
            "predicted_peak_C": 19.4,
            "measured_peak_C": 18.2,
            "peak_delta_C": 1.2
        }
        test_1_init = {
            "ambient_C": 21.0,
            "inlet_C": 5.0,
            "initial_pcm_C": 21.4
        }
        test_1_preview = [
            {"time_s": 0, "ambient_C": 21.0, "pcm_C": 21.4, "inlet_C": 5.0, "outlet_C": 5.2, "flow_ml_s": 0},
            {"time_s": 15, "ambient_C": 21.0, "pcm_C": 54.0, "inlet_C": 5.0, "outlet_C": 14.5, "flow_ml_s": 8},
            {"time_s": 30, "ambient_C": 21.0, "pcm_C": 54.0, "inlet_C": 5.0, "outlet_C": 18.2, "flow_ml_s": 8},
            {"time_s": 60, "ambient_C": 21.0, "pcm_C": 53.8, "inlet_C": 5.0, "outlet_C": 17.1, "flow_ml_s": 8},
            {"time_s": 120, "ambient_C": 21.0, "pcm_C": 52.4, "inlet_C": 5.0, "outlet_C": 15.3, "flow_ml_s": 8},
            {"time_s": 180, "ambient_C": 21.0, "pcm_C": 48.6, "inlet_C": 5.0, "outlet_C": 13.2, "flow_ml_s": 8},
            {"time_s": 240, "ambient_C": 21.0, "pcm_C": 42.1, "inlet_C": 5.0, "outlet_C": 10.4, "flow_ml_s": 8},
            {"time_s": 300, "ambient_C": 21.0, "pcm_C": 35.8, "inlet_C": 5.0, "outlet_C": 8.1, "flow_ml_s": 0}
        ]

        cur.execute("""
        INSERT INTO twin_tests (id, twin_id, test_number, title, operator, status, notes, s3_csv_key, metrics, initial_conditions, raw_preview)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            'test_0001_001',
            1,
            1,
            'Flow Bench Rig v0.1 — Baseline Water Calibration',
            '@Foxlendor',
            'verified',
            'First automated test run on instrumented bench with dual K-type thermocouples. Good agreement during nucleation peak.',
            '0001/tests/test_001_baseline.csv',
            json.dumps(test_1_metrics),
            json.dumps(test_1_init),
            json.dumps(test_1_preview)
        ))

        test_2_metrics = {
            "rmse_C": 1.48,
            "mae_C": 1.12,
            "max_error_C": 2.30,
            "r_squared": 0.961,
            "sample_count": 300,
            "predicted_peak_C": 22.1,
            "measured_peak_C": 21.3,
            "peak_delta_C": 0.8
        }
        test_2_init = {
            "ambient_C": 22.5,
            "inlet_C": 6.2,
            "initial_pcm_C": 22.1
        }
        cur.execute("""
        INSERT INTO twin_tests (id, twin_id, test_number, title, operator, status, notes, s3_csv_key, metrics, initial_conditions, raw_preview)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            'test_0001_002',
            1,
            2,
            'Ambient Thermal Loss & Insulation Verification',
            '@Foxlendor',
            'verified',
            'Verification of external silicone jacket thermal resistance under natural convection.',
            '0001/tests/test_002_insulation.csv',
            json.dumps(test_2_metrics),
            json.dumps(test_2_init),
            json.dumps(test_1_preview)
        ))

        conn.commit()
        print("Seeded initial physical test records!")

    cur.close()
    conn.close()

if __name__ == "__main__":
    setup_tests_table()
