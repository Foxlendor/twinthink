'use client';

import React, { useRef, useState } from 'react';
import { ArrowRight, Check, FileText, Loader2, Upload, X } from 'lucide-react';
import { getApiUrl } from '@/lib/api';

interface CreateTwinModalProps { onClose: () => void; }
type RealityDimension = { status: string; score_pct: number; evidence_count?: number; rationale?: string };
interface TwinDocument {
  identity: { title: string; summary: string; creator: string; version: string };
  reality_state: { overall_score_pct: number; structural: RealityDimension; thermal: RealityDimension; material: RealityDimension; safety: RealityDimension; manufacturing: RealityDimension };
  claims: unknown[];
  structure: { components: unknown[] };
  history: unknown[];
  unknowns_and_assumptions: string[];
}
interface DiscoveryReport {
  title: string; summary: string; objects_count: number; components_count: number; claims_count: number; relationships_count: number; files_ingested_count: number;
  reality_state: TwinDocument['reality_state'];
}

const stages = ['Reading files', 'Organizing what you gave us', 'Checking evidence', 'Building the Twin'];

export default function CreateTwinModal({ onClose }: CreateTwinModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [name, setName] = useState('');
  const [creator, setCreator] = useState('');
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ discovery: DiscoveryReport; twin: TwinDocument } | null>(null);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    setFiles(prev => {
      const seen = new Set(prev.map(file => `${file.name}:${file.size}:${file.lastModified}`));
      return [...prev, ...Array.from(incoming).filter(file => {
        const key = `${file.name}:${file.size}:${file.lastModified}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })];
    });
  };

  const build = async () => {
    if (!files.length) { inputRef.current?.click(); return; }
    setBusy(true); setError(null); setStage(0);
    const timer = window.setInterval(() => setStage(current => Math.min(current + 1, stages.length - 1)), 850);
    try {
      const form = new FormData();
      files.forEach(file => form.append('files', file));
      if (name.trim()) form.append('title', name.trim());
      if (creator.trim()) form.append('author', creator.trim());
      const response = await fetch(`${getApiUrl()}/api/twins/create`, { method: 'POST', body: form });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.detail || 'TwinThink could not build this Twin.');
      if (!payload?.twin || !payload?.discovery) throw new Error('The factory returned an incomplete Twin.');
      setStage(stages.length - 1);
      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while building the Twin.');
    } finally {
      window.clearInterval(timer);
      setBusy(false);
    }
  };

  const downloadDraft = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result.twin, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${result.twin.identity.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'twin'}-twin.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="twin-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && !busy && onClose()}>
      <section className="twin-factory-modal" role="dialog" aria-modal="true" aria-labelledby="create-twin-title">
        <button className="twin-modal-close" onClick={onClose} disabled={busy} aria-label="Close"><X size={18} /></button>

        {!result && !busy && <>
          <div className="twin-modal-kicker">Twin Factory</div>
          <h2 id="create-twin-title">Create a Twin</h2>
          <p className="twin-modal-intro">Give TwinThink whatever you have. It will organize the material without pretending to know what the evidence does not establish.</p>

          <div className={`twin-dropzone${dragging ? ' is-dragging' : ''}`} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }} onClick={() => inputRef.current?.click()}>
            <input ref={inputRef} type="file" multiple hidden onChange={e => addFiles(e.target.files)} />
            <Upload size={22} strokeWidth={1.7} />
            <strong>{dragging ? 'Drop them here' : 'Drop your files here'}</strong>
            <span>or choose from your device</span>
            <small>PDF · CAD · images · notes · data · ZIP</small>
          </div>

          {files.length > 0 && <div className="twin-file-list">
            <div className="twin-file-list-head"><span>{files.length} file{files.length === 1 ? '' : 's'}</span><button onClick={() => setFiles([])}>Clear</button></div>
            {files.map((file, index) => <div className="twin-file-row" key={`${file.name}-${index}`}>
              <FileText size={15} /><span title={file.name}>{file.name}</span><button onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))} aria-label={`Remove ${file.name}`}><X size={14} /></button>
            </div>)}
          </div>}

          <div className="twin-optional-fields">
            <label><span>Name <em>optional</em></span><input value={name} onChange={e => setName(e.target.value)} placeholder="What should we call it?" /></label>
            <label><span>Your name <em>optional</em></span><input value={creator} onChange={e => setCreator(e.target.value)} placeholder="Who made it?" /></label>
          </div>

          {error && <div className="twin-error" role="alert">{error}</div>}
          <button className="twin-primary-action" onClick={build} disabled={!files.length}>{files.length ? 'Build Twin' : 'Choose files'}<ArrowRight size={16} /></button>
        </>}

        {busy && !result && <div className="twin-processing">
          <div className="twin-processing-mark"><Loader2 size={22} className="animate-spin" /></div>
          <div className="twin-modal-kicker">Twin Factory</div>
          <h2>Building your Twin</h2>
          <p>Quietly organizing what you gave us.</p>
          <div className="twin-progress"><span style={{ width: `${((stage + 1) / stages.length) * 100}%` }} /></div>
          <div className="twin-stage-list">{stages.map((label, index) => <div key={label} className={index <= stage ? 'done' : ''}>{index < stage ? <Check size={14} /> : index === stage ? <Loader2 size={14} className="animate-spin" /> : <i />}{label}</div>)}</div>
        </div>}

        {result && <div className="twin-result">
          <div className="twin-modal-kicker">First pass complete</div>
          <h2>{result.discovery.title}</h2>
          <p className="twin-result-summary">{result.discovery.summary}</p>
          <div className="twin-discovery-line"><span><b>{result.discovery.files_ingested_count}</b> files</span><span><b>{result.discovery.components_count}</b> components</span><span><b>{result.discovery.claims_count}</b> claims</span></div>
          <div className="twin-reality-summary">{(['structural', 'thermal', 'material', 'safety', 'manufacturing'] as const).map(key => { const item = result.discovery.reality_state[key]; return <div key={key}><span>{key}</span><strong>{item.status}</strong></div>; })}</div>
          {result.twin.unknowns_and_assumptions.length > 0 && <p className="twin-result-note">TwinThink left {result.twin.unknowns_and_assumptions.length} item{result.twin.unknowns_and_assumptions.length === 1 ? '' : 's'} unresolved rather than filling in the gaps.</p>}
          <div className="twin-result-actions"><button className="twin-primary-action" onClick={downloadDraft}>Save Twin JSON</button><button className="twin-secondary-action" onClick={onClose}>Done</button></div>
        </div>}
      </section>
    </div>
  );
}
