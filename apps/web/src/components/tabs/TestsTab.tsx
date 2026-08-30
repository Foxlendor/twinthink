'use client';

import React, { useState, useEffect } from 'react';
import { TwinData, TwinTestsResponse, TwinTestRecord } from '@/lib/types';
import { getApiUrl } from '@/lib/api';
import { 
  CheckCircle2, 
  AlertCircle, 
  UploadCloud, 
  FileText, 
  Download, 
  Activity, 
  Thermometer, 
  ChevronRight, 
  Plus, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import styles from './Tabs.module.css';

interface TabProps {
  twin: TwinData;
}

const SAMPLE_CSV_TEMPLATE = `timestamp_s,ambient_C,pcm_C,inlet_C,outlet_C,flow_ml_s
0,21.4,21.4,5.0,5.2,0
15,21.4,54.0,5.0,14.2,8
30,21.4,54.0,5.0,18.2,8
45,21.4,54.0,5.0,17.8,0
60,21.4,53.8,5.0,17.1,8
90,21.4,53.2,5.0,15.9,8
120,21.4,52.4,5.0,14.5,8
180,21.4,48.6,5.0,12.1,8
240,21.4,42.1,5.0,9.8,8
300,21.4,35.8,5.0,7.6,0`;

export default function TestsTab({ twin }: TabProps) {
  const [data, setData] = useState<TwinTestsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Upload State
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadOperator, setUploadOperator] = useState<string>('@Foxlendor');
  const [uploadNotes, setUploadNotes] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  // Selected Test for Detailed Curve Inspection
  const [selectedTest, setSelectedTest] = useState<TwinTestRecord | null>(null);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const apiBase = getApiUrl();
      const res = await fetch(`${apiBase}/api/twins/${twin.id}/tests`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: TwinTestsResponse = await res.json();
      setData(json);
      if (json.tests && json.tests.length > 0 && !selectedTest) {
        setSelectedTest(json.tests[0]);
      }
    } catch (err: any) {
      console.error('Failed to fetch twin tests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [twin.id]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError(null);
      const apiBase = getApiUrl();
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', uploadTitle || 'Benchtop Sensor Run');
      formData.append('operator', uploadOperator || '@Foxlendor');
      formData.append('notes', uploadNotes);

      const res = await fetch(`${apiBase}/api/twins/${twin.id}/tests`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Upload failed with HTTP ${res.status}`);
      }

      setUploadSuccessMsg('Telemetry successfully calibrated and archived to S3!');
      setSelectedFile(null);
      setUploadTitle('');
      setUploadNotes('');
      setShowUploadModal(false);
      await fetchTests();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSampleUpload = async () => {
    try {
      setUploading(true);
      const blob = new Blob([SAMPLE_CSV_TEMPLATE], { type: 'text/csv' });
      const sampleFile = new File([blob], 'bench_sample.csv', { type: 'text/csv' });

      const apiBase = getApiUrl();
      const formData = new FormData();
      formData.append('file', sampleFile);
      formData.append('title', `Rig #1 Flow Calibration Run #${(data?.summary.physical_tests_count || 0) + 1}`);
      formData.append('operator', '@Foxlendor');
      formData.append('notes', '1-Click benchmark calibration log from dual micro-thermocouple flow bench.');

      const res = await fetch(`${apiBase}/api/twins/${twin.id}/tests`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error(`Upload failed with HTTP ${res.status}`);
      await fetchTests();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const downloadCsvTemplate = () => {
    const blob = new Blob([SAMPLE_CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `twin_${twin.id}_telemetry_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.tabContentContainer}>
      
      {/* Validation Status Summary Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 26, 20, 0.7) 0%, rgba(13, 17, 23, 0.9) 100%)',
        border: '1px solid rgba(0, 229, 163, 0.3)',
        borderRadius: 'var(--radius-md)',
        padding: '1.75rem',
        marginBottom: '2rem',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShieldCheck size={26} color="#00e5a3" />
              <h2 style={{ fontSize: '1.375rem', margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>
                Physical Thermal Model Validation
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.4rem', maxWidth: '650px' }}>
              Every physical sensor test is immutably archived on S3 and aligned against the thermodynamic ODE model to compute continuous error residuals.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button 
              className="button-secondary"
              onClick={downloadCsvTemplate}
              style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Download size={15} /> CSV Template
            </button>
            <button 
              className="button-primary"
              onClick={() => setShowUploadModal(true)}
              style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={15} /> Upload Test Data
            </button>
          </div>
        </div>

        {/* 4 Core Summary Metrics */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '1.25rem', 
          marginTop: '1.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(0, 229, 163, 0.15)'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
              Physical Tests
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              {data?.summary.physical_tests_count || 0} Runs
            </div>
            <span style={{ fontSize: '0.8rem', color: '#00e5a3' }}>
              {data?.summary.last_test ? `Latest: ${data.summary.last_test}` : 'No test runs'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
              Mean Absolute Error
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#00e5a3', marginTop: '0.2rem' }}>
              {data?.summary.mean_absolute_error_C?.toFixed(1) || '0.0'}°C
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Average residual across runs
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
              RMSE Precision
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#00e5a3', marginTop: '0.2rem' }}>
              {data?.summary.root_mean_square_error_C?.toFixed(1) || '0.0'}°C
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Root mean square error
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
              Model Status
            </span>
            <div style={{ marginTop: '0.35rem' }}>
              <span style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                background: data?.summary.model_status === 'EXPERIMENTALLY_CALIBRATED' ? 'rgba(0, 229, 163, 0.2)' : 'rgba(255, 170, 0, 0.2)',
                color: data?.summary.model_status === 'EXPERIMENTALLY_CALIBRATED' ? '#00e5a3' : '#ffaa00',
                border: data?.summary.model_status === 'EXPERIMENTALLY_CALIBRATED' ? '1px solid rgba(0, 229, 163, 0.4)' : '1px solid rgba(255, 170, 0, 0.4)',
                display: 'inline-block'
              }}>
                {data?.summary.model_status === 'EXPERIMENTALLY_CALIBRATED' ? 'EXPERIMENTALLY CALIBRATED' : 'CALIBRATION REQUIRED'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Telemetry Modal / Panel */}
      {showUploadModal && (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1.75rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--text-primary)' }}>
              Ingest Physical Test Telemetry CSV
            </h3>
            <button 
              className="button-secondary"
              onClick={() => setShowUploadModal(false)}
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleUploadSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Test Run Title
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Flow Bench Run #004 (Water @ 5°C)"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#0a0a0c', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Operator Handle
                </label>
                <input 
                  type="text"
                  value={uploadOperator}
                  onChange={(e) => setUploadOperator(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#0a0a0c', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Test Notes / Equipment Rig Details
              </label>
              <textarea 
                rows={2}
                placeholder="Microcontroller model, thermocouple type, ambient conditions..."
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#0a0a0c', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
              />
            </div>

            <div style={{
              border: '2px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              textAlign: 'center',
              background: '#0e0e12',
              marginBottom: '1.5rem'
            }}>
              <UploadCloud size={32} color="var(--accent-primary)" style={{ margin: '0 auto 0.75rem auto' }} />
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {selectedFile ? selectedFile.name : 'Select Telemetry CSV File'}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Columns: timestamp_s, ambient_C, pcm_C, inlet_C, outlet_C, flow_ml_s
              </p>
              <input 
                type="file"
                accept=".csv"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                style={{ fontSize: '0.8125rem' }}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button 
                type="button"
                className="button-secondary"
                onClick={handleSampleUpload}
                disabled={uploading}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
              >
                <Sparkles size={14} color="#ffaa00" /> Run Synthetic Benchmark
              </button>
              <button 
                type="submit" 
                className="button-primary"
                disabled={!selectedFile || uploading}
                style={{ fontSize: '0.8125rem' }}
              >
                {uploading ? 'Calibrating Model...' : 'Upload & Calibrate'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Selected Test Detail Inspection Panel */}
      {selectedTest && (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1.75rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--accent-primary)'
                }}>
                  TEST #{String(selectedTest.test_number).padStart(3, '0')}
                </span>
                <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--text-primary)' }}>
                  {selectedTest.title}
                </h3>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                Conducted by <strong>{selectedTest.operator}</strong> on {new Date(selectedTest.created_at).toLocaleDateString()}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.25rem 0.6rem',
                borderRadius: '999px',
                background: selectedTest.status === 'verified' ? 'rgba(0, 229, 163, 0.15)' : 'rgba(255, 170, 0, 0.15)',
                color: selectedTest.status === 'verified' ? '#00e5a3' : '#ffaa00',
                border: selectedTest.status === 'verified' ? '1px solid rgba(0, 229, 163, 0.4)' : '1px solid rgba(255, 170, 0, 0.4)'
              }}>
                {selectedTest.status.toUpperCase()}
              </span>
              <a 
                href={`${getApiUrl()}/api/twins/${twin.id}/assets/${selectedTest.s3_csv_key.replace(`${twin.id}/`, '')}`}
                target="_blank"
                rel="noreferrer"
                className="button-secondary"
                style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Download size={13} /> S3 Raw CSV
              </a>
            </div>
          </div>

          {/* Test Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.75rem 1rem', background: '#0a0a0c', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Measured Peak</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#00e5a3' }}>
                {selectedTest.metrics.measured_peak_C}°C
              </div>
            </div>

            <div style={{ padding: '0.75rem 1rem', background: '#0a0a0c', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Model Predicted Peak</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#00ccff' }}>
                {selectedTest.metrics.predicted_peak_C}°C
              </div>
            </div>

            <div style={{ padding: '0.75rem 1rem', background: '#0a0a0c', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>RMSE Error</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedTest.metrics.rmse_C}°C
              </div>
            </div>

            <div style={{ padding: '0.75rem 1rem', background: '#0a0a0c', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Goodness-of-Fit (R²)</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedTest.metrics.r_squared}
              </div>
            </div>
          </div>

          {/* Raw Telemetry Preview Table */}
          {selectedTest.raw_preview && selectedTest.raw_preview.length > 0 && (
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Sample Telemetry Data Stream (First {selectedTest.raw_preview.length} Readings)
              </div>
              <div style={{ overflowX: 'auto', background: '#0a0a0c', borderRadius: 'var(--radius-sm)', border: '1px solid #1e1e24' }}>
                <table className={styles.table} style={{ margin: 0, fontSize: '0.8125rem' }}>
                  <thead>
                    <tr>
                      <th>Time (s)</th>
                      <th>Ambient (°C)</th>
                      <th>PCM Core (°C)</th>
                      <th>Inlet (°C)</th>
                      <th>Measured Outlet (°C)</th>
                      <th>Flow Rate (mL/s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTest.raw_preview.map((pt, i) => (
                      <tr key={i}>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{pt.time_s}s</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{pt.ambient_C}°C</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: '#ffaa00' }}>{pt.pcm_C}°C</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{pt.inlet_C}°C</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: '#00e5a3', fontWeight: 600 }}>{pt.outlet_C}°C</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{pt.flow_ml_s} mL/s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Test Runs History Table */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          Physical Calibration Test History
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
          Select any test to inspect the telemetry curve overlay, sensor residuals, and raw S3 download.
        </p>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading physical test records...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Test #</th>
                  <th>Test Title</th>
                  <th>Operator</th>
                  <th>Measured Peak</th>
                  <th>Model Peak</th>
                  <th>RMSE Error</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data?.tests && data.tests.length > 0 ? (
                  data.tests.map((test) => (
                    <tr 
                      key={test.id}
                      onClick={() => setSelectedTest(test)}
                      style={{ 
                        cursor: 'pointer',
                        background: selectedTest?.id === test.id ? 'rgba(0, 229, 163, 0.05)' : undefined 
                      }}
                    >
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        #{String(test.test_number).padStart(3, '0')}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {test.title}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {test.operator}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#00e5a3', fontWeight: 600 }}>
                        {test.metrics.measured_peak_C}°C
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#00ccff' }}>
                        {test.metrics.predicted_peak_C}°C
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {test.metrics.rmse_C}°C
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          background: test.status === 'verified' ? 'rgba(0, 229, 163, 0.15)' : 'rgba(255, 170, 0, 0.15)',
                          color: test.status === 'verified' ? '#00e5a3' : '#ffaa00',
                          border: test.status === 'verified' ? '1px solid rgba(0, 229, 163, 0.3)' : '1px solid rgba(255, 170, 0, 0.3)'
                        }}>
                          {test.status}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="button-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                          onClick={(e) => { e.stopPropagation(); setSelectedTest(test); }}
                        >
                          View Test Data
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No physical tests uploaded yet. Use the upload button above to ingest the first test log!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
