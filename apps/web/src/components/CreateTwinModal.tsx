'use client';

import React, { useState, useRef } from 'react';
import { getApiUrl } from '@/lib/api';
import { X, UploadCloud, FileText, CheckCircle2, Loader2, ArrowRight, Sparkles, Box, Layers, HelpCircle, GitFork, AlertCircle } from 'lucide-react';

interface CreateTwinModalProps {
  onClose: () => void;
}

interface DiscoveryReport {
  title: string;
  summary: string;
  objects_count: number;
  components_count: number;
  claims_count: number;
  relationships_count: number;
  files_ingested_count: number;
  reality_state: {
    overall_score_pct: number;
    structural: { status: string; score_pct: number };
    thermal: { status: string; score_pct: number };
    material: { status: string; score_pct: number };
    safety: { status: string; score_pct: number };
    manufacturing: { status: string; score_pct: number };
  };
}

export default function CreateTwinModal({ onClose }: CreateTwinModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [creator, setCreator] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [discoveryReport, setDiscoveryReport] = useState<DiscoveryReport | null>(null);

  const steps = [
    'Reading uploaded files',
    'Extracting physical components & materials',
    'Analyzing claims & epistemic provenance',
    'Deriving Reality State matrix',
    'Compiling living twin'
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
    
    // Progress line animation
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

      if (res.ok) {
        const data = await res.json();
        if (data.owner_token && typeof window !== 'undefined') {
          localStorage.setItem(`twin_token_${data.id}`, data.owner_token);
        }
        setDiscoveryReport(data.discovery);
      } else {
        const errData = await res.json().catch(() => ({ detail: 'Failed to process bundle' }));
        setErrorMsg(errData.detail || 'Upload failed. Please verify files and try again.');
        setIsProcessing(false);
      }
    } catch (err: any) {
      clearInterval(interval);
      setErrorMsg(err.message || 'Network error connecting to TwinThink API.');
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(17, 24, 39, 0.4)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1.5rem'
    }} onClick={onClose}>
      
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '16px',
        maxWidth: '540px',
        width: '100%',
        padding: '2.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        position: 'relative',
        textAlign: 'center'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            color: '#9CA3AF',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        {!isProcessing && !discoveryReport ? (
          <>
            {/* Screen 1: File Dropzone */}
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
              Twin Factory
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem 0', letterSpacing: '-0.5px' }}>
              Create a Twin
            </h2>
            <p style={{ fontSize: '0.9375rem', color: '#4B5563', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
              Bring together everything you have about an idea.<br />
              <span style={{ fontSize: '0.8125rem', color: '#6B7280' }}>New Twins are private by default and are not added to public feeds.</span>
            </p>

            {/* Error banner */}
            {errorMsg && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #F87171',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
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

            {/* Creator / Team input */}
            <div style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>
                Creator / Team Name (optional)
              </label>
              <input
                type="text"
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                placeholder="e.g. Alice or Machining Lab"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Dropzone Box */}
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
                borderRadius: '12px',
                padding: '2rem 1.5rem',
                background: isDragging ? '#F9FAFB' : '#FAFAFA',
                cursor: 'pointer',
                marginBottom: '1rem',
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

              <UploadCloud size={32} color="#6B7280" style={{ margin: '0 auto 0.75rem auto' }} />

              <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#111827', marginBottom: '0.4rem' }}>
                Drop files here
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 500 }}>
                PDFs · Images · CAD · Notes · Data
              </div>
            </div>

            {/* Added Files Pill Strip */}
            {files.length > 0 && (
              <div style={{ marginBottom: '1.5rem', textAlign: 'left', background: '#F3F4F6', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>
                  {files.length} file{files.length > 1 ? 's' : ''} added:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {files.map((f, i) => (
                    <span key={i} style={{ fontSize: '0.7rem', background: '#FFFFFF', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #E5E7EB', color: '#4B5563' }}>
                      {f.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={files.length > 0 ? handleStartBuilding : () => fileInputRef.current?.click()}
                style={{
                  background: '#111827',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.75rem 2rem',
                  borderRadius: '100px',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {files.length > 0 ? 'Build Twin' : 'Choose Files'}
                <ArrowRight size={16} />
              </button>
            </div>
          </>
        ) : isProcessing && !discoveryReport ? (
          /* Screen 2: Processing */
          <div style={{ padding: '2rem 1rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: '0 0 1.5rem 0' }}>
              Building your Twin...
            </h3>

            <div style={{ height: '3px', background: '#E5E7EB', borderRadius: '2px', overflow: 'hidden', marginBottom: '2rem' }}>
              <div style={{
                height: '100%',
                background: '#111827',
                width: `${((stepIndex + 1) / steps.length) * 100}%`,
                transition: 'width 0.4s ease'
              }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'left' }}>
              {steps.map((s, idx) => {
                const isCurrent = idx === stepIndex;
                const isDone = idx < stepIndex;
                return (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: isCurrent ? '#111827' : isDone ? '#059669' : '#9CA3AF',
                    fontWeight: isCurrent ? 600 : 400,
                    fontSize: '0.9rem'
                  }}>
                    {isDone ? (
                      <CheckCircle2 size={18} color="#059669" />
                    ) : isCurrent ? (
                      <Loader2 size={18} className="animate-spin" color="#111827" />
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
          /* Screen 3: Discovery Complete */
          discoveryReport && (
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                <Sparkles size={16} />
                Private Twin created
              </div>

              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#111827', margin: '0 0 0.5rem 0', letterSpacing: '-0.5px' }}>
                {discoveryReport.title}
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#6B7280', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
                {discoveryReport.summary}
              </p>

              {/* Quiet Discovery Summary (Directive Phase 2) */}
              <div style={{
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '0.65rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                color: '#111827'
              }}>
                <span style={{ color: '#4B5563', fontWeight: 600 }}>Found:</span>
                <span>{discoveryReport.objects_count || 1} Object</span>
                <span style={{ color: '#9CA3AF' }}>·</span>
                <span>{discoveryReport.components_count} Components</span>
                <span style={{ color: '#9CA3AF' }}>·</span>
                <span>{discoveryReport.claims_count} Claims</span>
                <span style={{ color: '#9CA3AF' }}>·</span>
                <span>{discoveryReport.relationships_count} Relationships</span>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onClose()}
                style={{
                  background: '#111827',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.95rem 1.75rem',
                  borderRadius: '100px',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                Done — Keep Private
              </button>
            </div>
          )
        )}

      </div>
    </div>
  );
}
