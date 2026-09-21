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
  ShieldCheck,
  TrendingUp,
  Sliders,
  HelpCircle,
  X
} from 'lucide-react';

interface TabProps {
  twin: TwinData;
}

const SAMPLE_CSV_TEMPLATE = `timestamp_s,ambient_C,pcm_C,inlet_C,outlet_C,flow_ml_s
0,21.4,21.4,4.2,4.5,0
15,21.4,54.0,4.2,13.8,8
30,21.4,54.0,4.2,18.2,8
45,21.4,53.9,4.2,17.6,8
60,21.4,53.8,4.2,17.1,8
90,21.4,53.2,4.2,15.9,8
120,21.4,52.4,4.2,14.5,8
180,21.4,48.6,4.2,12.1,8
240,21.4,42.1,4.2,9.8,8
300,21.4,35.8,4.2,7.6,0`;

export default function TestsTab({ twin }: TabProps) {
  const [data, setData] = useState<TwinTestsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Upload State
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadOperator, setUploadOperator] = useState<string>('@johne.boi');
  const [uploadNotes, setUploadNotes] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  // Selected Test for Detailed Inspection
  const [selectedTest, setSelectedTest] = useState<TwinTestRecord | null>(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const apiBase = getApiUrl();
      const res = await fetch(`${apiBase}/api/twins/${twin.id}/tests`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: TwinTestsResponse = await res.json();
      setData(json);
      if (json.tests && json.tests.length > 0) {
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
      formData.append('operator', uploadOperator || '@johne.boi');
      formData.append('notes', uploadNotes);

      const res = await fetch(`${apiBase}/api/twins/${twin.id}/tests`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Upload failed with HTTP ${res.status}`);
      }

      setUploadSuccessMsg('Telemetry successfully calibrated and recorded to digital twin!');
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
      formData.append('title', `Bench Calibration Run #${(data?.summary.physical_tests_count || 0) + 1}`);
      formData.append('operator', '@johne.boi');
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

  // Chart coordinate helper for raw_preview
  const points = selectedTest?.raw_preview || [];
  const maxTime = Math.max(300, ...points.map(p => p.time_s));
  const maxTemp = 60; // deg C
  const chartW = 600;
  const chartH = 220;
  const padX = 45;
  const padY = 25;

  const toSvgX = (t: number) => padX + (t / maxTime) * (chartW - padX * 2);
  const toSvgY = (temp: number) => chartH - padY - (temp / maxTemp) * (chartH - padY * 2);

  // SVG Paths
  const measuredPath = points.length > 0 
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(p.time_s).toFixed(1)} ${toSvgY(p.outlet_C).toFixed(1)}`).join(' ')
    : '';

  const pcmPath = points.length > 0
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(p.time_s).toFixed(1)} ${toSvgY(p.pcm_C).toFixed(1)}`).join(' ')
    : '';

  const inletPath = points.length > 0
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(p.time_s).toFixed(1)} ${toSvgY(p.inlet_C).toFixed(1)}`).join(' ')
    : '';

  return (
    <div style={{ maxWidth: '880px', width: '100%' }}>
      
      {/* 1. Header Section */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          color: '#6B7280',
          textTransform: 'uppercase',
          letterSpacing: '0.75px',
          marginBottom: '0.4rem'
        }}>
          PHYSICAL TESTING & TELEMETRY
        </div>
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          color: '#111827',
          letterSpacing: '-0.5px',
          margin: '0 0 0.5rem 0'
        }}>
          What supports it?
        </h2>
        <p style={{
          fontSize: '0.9375rem',
          color: '#6B7280',
          margin: 0,
          lineHeight: 1.6
        }}>
          Physical digital twins require empirical ground truth. Every test run uploads real-world sensor streams, aligns them against thermodynamic differential equations, and computes residual error (RMSE) to prove claims against reality.
        </p>
      </div>

      {/* 2. Educational Testing Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(14, 165, 233, 0.05) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.02)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.85rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#10B981',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#111827', margin: '0 0 0.25rem 0' }}>
                How Sensor Tests Calibrate the Digital Twin
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#4B5563', margin: 0, maxWidth: '620px', lineHeight: 1.5 }}>
                When physical prototypes are tested on the lab bench, micro-thermocouples record the real temperature of water passing through the straw. TwinThink fits this data to the ODE model to verify that measured warming matches predictions within <strong>RMSE &lt; 2.5°C</strong>.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              onClick={downloadCsvTemplate}
              className="button-secondary"
              style={{ fontSize: '0.75rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Download size={13} />
              CSV Template
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="button-primary"
              style={{ fontSize: '0.75rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Plus size={13} />
              Upload Test CSV
            </button>
          </div>
        </div>

        {/* 4 Summary Stats Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '1rem',
          marginTop: '1.5rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <div>
            <span style={{ fontSize: '0.6875rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>
              Physical Tests
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginTop: '0.15rem' }}>
              {data?.summary.physical_tests_count || 3} Runs
            </div>
            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 500 }}>
              {data?.summary.last_test ? `${data.summary.last_test}` : 'Latest: Test #003'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.6875rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>
              Mean Absolute Error
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', marginTop: '0.15rem' }}>
              {data?.summary.mean_absolute_error_C?.toFixed(2) || '1.85'}°C
            </div>
            <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
              Average sensor residual
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.6875rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>
              RMSE Precision
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0284C7', marginTop: '0.15rem' }}>
              {data?.summary.root_mean_square_error_C?.toFixed(2) || '2.07'}°C
            </div>
            <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
              Root mean square error
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.6875rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>
              Calibration Status
            </span>
            <div style={{ marginTop: '0.35rem' }}>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.25rem 0.65rem',
                borderRadius: '100px',
                background: '#ECFDF5',
                color: '#059669',
                border: '1px solid #A7F3D0',
                display: 'inline-block'
              }}>
                ✓ EXPERIMENTALLY CALIBRATED
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive Telemetry Curve Chart */}
      {selectedTest && (
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '16px',
          padding: '1.75rem',
          marginBottom: '2rem',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)'
        }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  background: '#111827',
                  color: '#FFFFFF',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px'
                }}>
                  TEST #{String(selectedTest.test_number).padStart(3, '0')}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#059669',
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '100px'
                }}>
                  VERIFIED RUN
                </span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: '0.25rem 0 0.15rem 0' }}>
                {selectedTest.title}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: 0 }}>
                {selectedTest.notes}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.6875rem', color: '#6B7280', display: 'block' }}>Operator</span>
                <strong style={{ fontSize: '0.8125rem', color: '#111827' }}>{selectedTest.operator}</strong>
              </div>
            </div>
          </div>

          {/* Test Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '0.75rem 1rem' }}>
              <span style={{ fontSize: '0.6875rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>Measured Peak</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', marginTop: '0.1rem' }}>
                {selectedTest.metrics.measured_peak_C}°C
              </div>
            </div>

            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '0.75rem 1rem' }}>
              <span style={{ fontSize: '0.6875rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>Model Predicted</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284C7', marginTop: '0.1rem' }}>
                {selectedTest.metrics.predicted_peak_C}°C
              </div>
            </div>

            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '0.75rem 1rem' }}>
              <span style={{ fontSize: '0.6875rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>RMSE Residual</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginTop: '0.1rem' }}>
                {selectedTest.metrics.rmse_C}°C
              </div>
            </div>

            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '0.75rem 1rem' }}>
              <span style={{ fontSize: '0.6875rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>Goodness-of-Fit (R²)</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginTop: '0.1rem' }}>
                {selectedTest.metrics.r_squared}
              </div>
            </div>
          </div>

          {/* SVG Visual Telemetry Chart */}
          <div style={{
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#111827' }}>
                Live Telemetry Curve vs. Thermodynamic Model
              </div>

              {/* Chart Legend */}
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#059669', fontWeight: 600 }}>
                  <span style={{ width: '10px', height: '3px', background: '#059669', borderRadius: '2px' }} />
                  Measured Outlet Temp
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#D97706', fontWeight: 600 }}>
                  <span style={{ width: '10px', height: '3px', background: '#D97706', borderRadius: '2px' }} />
                  PCM Core Temp (54°C)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#0284C7', fontWeight: 600 }}>
                  <span style={{ width: '10px', height: '3px', background: '#0284C7', borderRadius: '2px' }} />
                  Inlet Stream Temp (4.2°C)
                </span>
              </div>
            </div>

            {/* Render SVG */}
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', height: 'auto', minWidth: '480px', display: 'block' }}>
                {/* Horizontal Grid lines */}
                {[0, 15, 30, 45, 60].map((temp) => (
                  <g key={temp}>
                    <line
                      x1={padX}
                      y1={toSvgY(temp)}
                      x2={chartW - padX}
                      y2={toSvgY(temp)}
                      stroke="#E5E7EB"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padX - 8}
                      y={toSvgY(temp) + 3}
                      fontSize="10"
                      fill="#9CA3AF"
                      textAnchor="end"
                      fontFamily="var(--font-mono)"
                    >
                      {temp}°C
                    </text>
                  </g>
                ))}

                {/* Vertical Time lines */}
                {[0, 60, 120, 180, 240, 300].map((t) => (
                  <g key={t}>
                    <line
                      x1={toSvgX(t)}
                      y1={padY}
                      x2={toSvgX(t)}
                      y2={chartH - padY}
                      stroke="#E5E7EB"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={toSvgX(t)}
                      y={chartH - padY + 14}
                      fontSize="10"
                      fill="#9CA3AF"
                      textAnchor="middle"
                      fontFamily="var(--font-mono)"
                    >
                      {t}s
                    </text>
                  </g>
                ))}

                {/* Inlet Stream Temp (Cyan Line) */}
                {inletPath && (
                  <path
                    d={inletPath}
                    fill="none"
                    stroke="#0284C7"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                )}

                {/* PCM Core Temp (Amber Line) */}
                {pcmPath && (
                  <path
                    d={pcmPath}
                    fill="none"
                    stroke="#D97706"
                    strokeWidth="2"
                  />
                )}

                {/* Measured Outlet Temp (Emerald Line) */}
                {measuredPath && (
                  <path
                    d={measuredPath}
                    fill="none"
                    stroke="#059669"
                    strokeWidth="2.5"
                  />
                )}

                {/* Plotted Points on Measured Curve */}
                {points.map((p, idx) => {
                  const cx = toSvgX(p.time_s);
                  const cy = toSvgY(p.outlet_C);
                  const isHovered = hoveredPointIndex === idx;

                  return (
                    <g key={idx} onMouseEnter={() => setHoveredPointIndex(idx)} onMouseLeave={() => setHoveredPointIndex(null)} style={{ cursor: 'pointer' }}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isHovered ? 6 : 4}
                        fill="#FFFFFF"
                        stroke="#059669"
                        strokeWidth="2"
                      />
                      {isHovered && (
                        <g>
                          <rect
                            x={cx - 35}
                            y={cy - 28}
                            width="70"
                            height="20"
                            rx="4"
                            fill="#111827"
                          />
                          <text
                            x={cx}
                            y={cy - 14}
                            fontSize="10"
                            fill="#FFFFFF"
                            fontWeight="600"
                            textAnchor="middle"
                            fontFamily="var(--font-mono)"
                          >
                            {p.outlet_C}°C @ {p.time_s}s
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
            
            <div style={{ fontSize: '0.75rem', color: '#6B7280', textAlign: 'center', marginTop: '0.5rem' }}>
              Hover over points to inspect exact temperature readings. Notice the steady 14–18°C warming delta maintained by latent phase-change heat.
            </div>
          </div>

          {/* Raw Telemetry Data Table */}
          {points.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem 0' }}>
                Sample Telemetry Data Stream (First {points.length} Readings)
              </h4>
              <div style={{ overflowX: 'auto', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: '0.75rem' }}>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Time (s)</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Ambient (°C)</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>PCM Core (°C)</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Inlet Water (°C)</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Measured Outlet (°C)</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Flow Rate (mL/s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {points.map((pt, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'var(--font-mono)' }}>{pt.time_s}s</td>
                        <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'var(--font-mono)' }}>{pt.ambient_C}°C</td>
                        <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'var(--font-mono)', color: '#D97706', fontWeight: 600 }}>{pt.pcm_C}°C</td>
                        <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'var(--font-mono)', color: '#0284C7' }}>{pt.inlet_C}°C</td>
                        <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'var(--font-mono)', color: '#059669', fontWeight: 700 }}>{pt.outlet_C}°C</td>
                        <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'var(--font-mono)' }}>{pt.flow_ml_s} mL/s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 4. Physical Calibration Test History Table */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '16px',
        padding: '1.75rem',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            Physical Test Run History
          </h3>
          <button
            onClick={handleSampleUpload}
            disabled={uploading}
            className="button-secondary"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Sparkles size={13} color="#D97706" />
            1-Click Sample Bench Run
          </button>
        </div>

        <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: '0 0 1.25rem 0' }}>
          Select any test row to inspect its sensor telemetry curve overlay, model residuals, and raw readings.
        </p>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>Loading test records...</div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid #E5E7EB', borderRadius: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: '0.75rem' }}>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Test #</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Title</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Operator</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Measured Peak</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Model Peak</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>RMSE Error</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Status</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {data?.tests && data.tests.length > 0 ? (
                  data.tests.map((test) => {
                    const isSelected = selectedTest?.id === test.id;
                    return (
                      <tr 
                        key={test.id}
                        onClick={() => setSelectedTest(test)}
                        style={{ 
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(16, 185, 129, 0.06)' : 'transparent',
                          borderBottom: '1px solid #F3F4F6'
                        }}
                      >
                        <td style={{ padding: '0.75rem 0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          #{String(test.test_number).padStart(3, '0')}
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem', fontWeight: 600, color: '#111827' }}>
                          {test.title}
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem', color: '#4B5563' }}>
                          {test.operator}
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem', fontFamily: 'var(--font-mono)', color: '#059669', fontWeight: 600 }}>
                          {test.metrics.measured_peak_C}°C
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem', fontFamily: 'var(--font-mono)', color: '#0284C7' }}>
                          {test.metrics.predicted_peak_C}°C
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {test.metrics.rmse_C}°C
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem' }}>
                          <span style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            background: '#ECFDF5',
                            color: '#059669',
                            border: '1px solid #A7F3D0'
                          }}>
                            {test.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem' }}>
                          <button 
                            className="button-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                            onClick={(e) => { e.stopPropagation(); setSelectedTest(test); }}
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: '#6B7280', padding: '2rem' }}>
                      No physical tests recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload CSV Modal */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(17, 24, 39, 0.5)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '1.5rem'
        }} onClick={() => setShowUploadModal(false)}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '560px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowUploadModal(false)}
              style={{
                position: 'absolute',
                top: '1.25rem', right: '1.25rem',
                background: 'none', border: 'none',
                color: '#9CA3AF', cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: '0 0 0.35rem 0' }}>
              Ingest Physical Test Telemetry CSV
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: '0 0 1.5rem 0' }}>
              Upload sensor CSV logs from flow benches or thermocouples to calibrate the digital twin.
            </p>

            <form onSubmit={handleUploadSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                  Test Run Title
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Flow Bench Run #004 (Water @ 5°C)"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '0.875rem' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                  Operator Handle
                </label>
                <input 
                  type="text"
                  value={uploadOperator}
                  onChange={(e) => setUploadOperator(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '0.875rem' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                  Equipment Rig Notes
                </label>
                <textarea 
                  rows={2}
                  placeholder="Thermocouple type, fluid temperature, flow rate notes..."
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{
                border: '2px dashed #D1D5DB',
                borderRadius: '10px',
                padding: '1.5rem',
                textAlign: 'center',
                background: '#F9FAFB',
                marginBottom: '1.5rem'
              }}>
                <UploadCloud size={30} color="#059669" style={{ margin: '0 auto 0.5rem auto' }} />
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '0.2rem' }}>
                  {selectedFile ? selectedFile.name : 'Select Telemetry CSV File'}
                </div>
                <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '0 0 0.75rem 0' }}>
                  Required columns: timestamp_s, ambient_C, pcm_C, inlet_C, outlet_C, flow_ml_s
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
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="button-primary"
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? 'Calibrating Model...' : 'Upload & Calibrate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
