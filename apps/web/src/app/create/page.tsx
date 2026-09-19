'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { getApiUrl } from '@/lib/api';
import { 
  UploadCloud, 
  ArrowRight, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

interface DiscoveryReport {
  title: string;
  summary: string;
  objects_count: number;
  components_count: number;
  claims_count: number;
  relationships_count: number;
  files_ingested_count: number;
}

export default function CreateTwinPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [creator, setCreator] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [discoveryReport, setDiscoveryReport] = useState<DiscoveryReport | null>(null);
  const [createdTwinId, setCreatedTwinId] = useState<string | null>(null);

  const steps = [
    'Parsing file headers & media types',
    'Extracting physical CAD geometry & 3D body tree',
    'Analyzing BOM part hierarchy and unit COGS',
    'Solving differential equations & telemetry residual calibration',
    'Establishing cognitive lineage and epistemic claims matrix'
  ];

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const fileArray = Array.from(newFiles);
    setFiles(prev => [...prev, ...fileArray]);
    setErrorMsg(null);
  };

  const handleStartBuilding = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setErrorMsg(null);

    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      if (current < steps.length) {
        setStepIndex(current);
      }
    }, 600);

    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      formData.append('creator', creator.trim() || 'Anonymous');

      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/twins/create`, {
        method: 'POST',
        body: formData
      });

      clearInterval(interval);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      setCreatedTwinId(data.id);
      setDiscoveryReport(data.discovery);

      if (data.id && data.owner_token) {
        try {
          const stored = JSON.parse(localStorage.getItem('tt_owned_twins') || '{}');
          stored[data.id] = data.owner_token;
          localStorage.setItem('tt_owned_twins', JSON.stringify(stored));
        } catch (e) {
          console.error("Failed to cache owner token", e);
        }
      }
    } catch (err: any) {
      clearInterval(interval);
      console.error("Twin factory creation error:", err);
      setErrorMsg(err.message || 'Failed to process files. Please verify bundle format.');
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', color: '#111827' }}>
      <Navbar />

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '3.5rem 1.5rem 6rem' }}>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              color: '#6B7280',
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            <ArrowLeft size={16} /> Return to Engine
          </Link>
        </div>

        {/* Minimal Dropzone Screen (Directive Phase 2) */}
        {!isProcessing && !discoveryReport ? (
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '24px',
            padding: '3rem 2.5rem',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
          }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              letterSpacing: '-1px',
              color: '#111827',
              margin: '0 0 0.65rem 0'
            }}>
              Create a Twin
            </h1>

            <p style={{
              fontSize: '1.125rem',
              color: '#4B5563',
              lineHeight: 1.5,
              maxWidth: '480px',
              margin: '0 auto 2.5rem auto'
            }}>
              Bring together everything you have about an idea.
            </p>

            {errorMsg && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #F87171',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                textAlign: 'left',
                color: '#991B1B',
                fontSize: '0.875rem'
              }}>
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Optional Creator Handle */}
            <div style={{ maxWidth: '380px', margin: '0 auto 1.5rem auto', textAlign: 'left' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>
                Creator Handle (Direct Link Trajectory)
              </label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ padding: '0.6rem 0.75rem', background: '#F3F4F6', border: '1px solid #D1D5DB', borderRight: 'none', borderRadius: '8px 0 0 8px', color: '#6B7280', fontSize: '0.875rem' }}>
                  @
                </span>
                <input
                  type="text"
                  value={creator}
                  onChange={(e) => setCreator(e.target.value)}
                  placeholder="inventor"
                  style={{
                    flex: 1,
                    padding: '0.6rem 0.85rem',
                    borderRadius: '0 8px 8px 0',
                    border: '1px solid #D1D5DB',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* The Quiet Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? '#111827' : '#D1D5DB'}`,
                borderRadius: '16px',
                padding: '3rem 2rem',
                background: isDragging ? '#F9FAFB' : '#FAFAFA',
                cursor: 'pointer',
                marginBottom: '1.5rem',
                transition: 'all 0.15s ease'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => handleFiles(e.target.files)}
              />

              <UploadCloud size={40} color="#6B7280" style={{ margin: '0 auto 1rem auto' }} />

              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
                Drop files here
              </div>
              <div style={{ fontSize: '0.9375rem', color: '#6B7280', fontWeight: 500 }}>
                PDFs · Images · CAD · Notes · Data
              </div>
            </div>

            {/* List of queued files */}
            {files.length > 0 && (
              <div style={{ marginBottom: '2rem', textAlign: 'left', background: '#F3F4F6', padding: '1rem 1.25rem', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>
                  {files.length} file{files.length > 1 ? 's' : ''} ready to ingest:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {files.map((f, i) => (
                    <span key={i} style={{ fontSize: '0.75rem', background: '#FFFFFF', padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid #E5E7EB', color: '#374151' }}>
                      {f.name} ({(f.size / 1024).toFixed(1)} KB)
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={files.length > 0 ? handleStartBuilding : () => fileInputRef.current?.click()}
              style={{
                background: '#111827',
                color: '#FFFFFF',
                border: 'none',
                padding: '1rem 2.5rem',
                borderRadius: '100px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.15s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              {files.length > 0 ? 'Compile Digital Twin' : 'Select Files'}
            </button>
          </div>
        ) : isProcessing ? (
          /* Processing Progress Screen */
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '24px',
            padding: '4rem 2.5rem',
            textAlign: 'center'
          }}>
            <Loader2 size={36} color="#111827" className="animate-spin" style={{ margin: '0 auto 1.5rem auto' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>
              Synthesizing Living Twin...
            </h2>
            <p style={{ fontSize: '0.9375rem', color: '#6B7280', margin: '0 0 2rem 0' }}>
              Binding CAD geometry, BOM costs, telemetry, and epistemic claims.
            </p>

            <div style={{ maxWidth: '440px', margin: '0 auto', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {steps.map((s, idx) => {
                const isDone = idx < stepIndex;
                const isCurrent = idx === stepIndex;
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: isDone ? '#059669' : isCurrent ? '#111827' : '#9CA3AF', fontWeight: isCurrent ? 600 : 400 }}>
                    {isDone ? (
                      <CheckCircle2 size={18} color="#059669" />
                    ) : isCurrent ? (
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #111827', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px solid #E5E7EB' }} />
                    )}
                    {s}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* The Assembly Confirmation Screen (Directive Phase 2) */
          discoveryReport && (
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '24px',
              padding: '3.5rem 2.5rem',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#059669', fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>
                <Sparkles size={16} />
                Your Twin is taking shape
              </div>

              <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#111827', margin: '0 0 0.5rem 0', letterSpacing: '-0.75px' }}>
                {discoveryReport.title}
              </h2>
              <p style={{ fontSize: '1rem', color: '#6B7280', margin: '0 0 2.5rem 0', lineHeight: 1.5, maxWidth: '540px', marginLeft: 'auto', marginRight: 'auto' }}>
                {discoveryReport.summary}
              </p>

              {/* Quiet Summary Card */}
              <div style={{
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                padding: '1.5rem 2rem',
                marginBottom: '2.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: '#111827'
              }}>
                <span style={{ color: '#6B7280', fontWeight: 600 }}>Found:</span>
                <span>{discoveryReport.objects_count || 1} Object</span>
                <span style={{ color: '#9CA3AF' }}>·</span>
                <span>{discoveryReport.components_count} Components</span>
                <span style={{ color: '#9CA3AF' }}>·</span>
                <span>{discoveryReport.claims_count} Claims</span>
                <span style={{ color: '#9CA3AF' }}>·</span>
                <span>{discoveryReport.relationships_count} Relationships</span>
              </div>

              <button
                onClick={() => {
                  if (createdTwinId) {
                    router.push(`/twins/${createdTwinId}`);
                  }
                }}
                style={{
                  background: '#111827',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '1rem 3rem',
                  borderRadius: '100px',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)'
                }}
              >
                Review Twin →
              </button>
            </div>
          )
        )}

      </main>
    </div>
  );
}
