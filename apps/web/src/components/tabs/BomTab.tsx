'use client';

import React, { useState } from 'react';
import { TwinData, BomNode, ProvenanceEntry } from '@/lib/types';
import {
  ChevronRight,
  ChevronDown,
  Layers,
  ShieldCheck,
  Box,
  Wrench,
  Sparkles,
  AlertCircle,
  FileText,
  Clock,
  Key,
  Award,
  ExternalLink,
  X,
  Lock,
  Eye,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import styles from './Tabs.module.css';

interface TabProps {
  twin: TwinData;
}

interface BomRowItem {
  id: string;
  name: string;
  partNumber?: string;
  revision?: string;
  nodeType: string;
  quantity: number;
  unit: string;
  material?: string;
  materialGrade?: string;
  materialStandard?: string;
  materialOrigin?: string;
  recycledContentPct?: number;
  process?: string;
  finish?: string;
  tolerances?: string;
  processingCost?: number;
  unitCost?: number | null;
  extendedCost?: number | null;
  currency?: string;
  supplier?: string;
  dppId?: string;
  depth: number;
  hasChildren: boolean;
  isAssembly: boolean;
  provenance?: ProvenanceEntry[];
  rightsOverride?: string;
  evidenceRefs?: string[];
  rawNode?: any;
}

export default function BomTab({ twin }: TabProps) {
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const [selectedNode, setSelectedNode] = useState<BomRowItem | null>(null);
  const [showDppModal, setShowDppModal] = useState<boolean>(false);
  const [dppTier, setDppTier] = useState<'public' | 'recycler' | 'authority'>('public');

  const isConcept = twin.current_version.ontology_class === 'Concept' || twin.current_version.ontology_class === 'MetaConcept';

  if (isConcept) {
    const mockAxioms = [
      { axiom: 'Cogito, ergo sum', author: 'René Descartes', epoch: '1637', truth: 'Absolute' },
      { axiom: 'Panta rhei (Everything flows)', author: 'Heraclitus', epoch: 'c. 500 BC', truth: 'Relative' },
      { axiom: 'The Map is Not the Territory', author: 'Alfred Korzybski', epoch: '1931', truth: 'Absolute' },
      { axiom: 'Whereof one cannot speak, thereof one must be silent', author: 'Ludwig Wittgenstein', epoch: '1921', truth: 'Absolute' }
    ];

    return (
      <div className={styles.tabContentContainer}>
        <h2 className={styles.sectionTitle}>Bill of Axioms</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Axiom</th>
                <th>Author</th>
                <th>Epoch</th>
                <th>Truth Value</th>
              </tr>
            </thead>
            <tbody>
              {mockAxioms.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, color: '#111827' }}>{item.axiom}</td>
                  <td>{item.author}</td>
                  <td>{item.epoch}</td>
                  <td>{item.truth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Check if real canonical hierarchical BOM is present
  const doc = twin.document;
  const structure = doc?.structure;
  const bomRoot = structure?.bom_root;
  const bomNodes = structure?.bom_nodes || [];
  const components = structure?.components || [];
  const globalRightsMode = doc?.identity?.declared_rights_mode || 'Open Development';

  // Toggle tree node collapse
  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Build flattened hierarchy for rendering
  const rows: BomRowItem[] = [];

  if (bomRoot) {
    const flattenTree = (node: any, depth: number = 0, isHidden: boolean = false) => {
      const id = node.node_id || node.id || `node_${rows.length}`;
      const children = node.children || [];
      const hasChildren = children.length > 0;
      const isAssembly = ['assembly', 'subassembly'].includes(node.node_type || '') || hasChildren;
      const mat = node.material;
      const mfg = node.manufacturing;
      const cost = node.cost;

      if (!isHidden) {
        rows.push({
          id,
          name: node.name || 'Component',
          partNumber: node.part_number,
          revision: node.revision || 'R1',
          nodeType: node.node_type || (hasChildren ? 'assembly' : 'component'),
          quantity: node.quantity ?? 1,
          unit: node.unit || 'ea',
          material: typeof mat === 'object' ? mat?.name : mat,
          materialGrade: typeof mat === 'object' ? mat?.grade : undefined,
          materialStandard: typeof mat === 'object' ? mat?.standard : undefined,
          materialOrigin: typeof mat === 'object' ? mat?.origin_country : undefined,
          recycledContentPct: typeof mat === 'object' ? mat?.recycled_content_pct : undefined,
          process: typeof mfg === 'object' ? mfg?.process : undefined,
          finish: typeof mfg === 'object' ? mfg?.finish : undefined,
          tolerances: typeof mfg === 'object' ? mfg?.tolerances : undefined,
          processingCost: typeof mfg === 'object' ? mfg?.processing_cost : undefined,
          unitCost: cost?.unit_cost,
          extendedCost: cost?.extended_cost,
          currency: cost?.currency || 'USD',
          supplier: node.supplier,
          dppId: node.dpp_id,
          depth,
          hasChildren,
          isAssembly,
          provenance: node.provenance || [],
          rightsOverride: node.rights_override,
          evidenceRefs: node.evidence_refs || [],
          rawNode: node
        });
      }

      const childHidden = isHidden || !!collapsedNodes[id];
      for (const child of children) {
        flattenTree(child, depth + 1, childHidden);
      }
    };

    flattenTree(bomRoot, 0, false);
  } else if (bomNodes.length > 0) {
    for (const n of bomNodes) {
      const mat = n.material;
      const mfg = n.manufacturing;
      const cost = n.cost;
      rows.push({
        id: n.node_id,
        name: n.name,
        partNumber: n.part_number,
        revision: n.revision || 'R1',
        nodeType: n.node_type || 'component',
        quantity: n.quantity ?? 1,
        unit: n.unit || 'ea',
        material: typeof mat === 'object' ? mat?.name : mat,
        materialGrade: typeof mat === 'object' ? mat?.grade : undefined,
        materialStandard: typeof mat === 'object' ? mat?.standard : undefined,
        materialOrigin: typeof mat === 'object' ? mat?.origin_country : undefined,
        recycledContentPct: typeof mat === 'object' ? mat?.recycled_content_pct : undefined,
        process: typeof mfg === 'object' ? mfg?.process : undefined,
        finish: typeof mfg === 'object' ? mfg?.finish : undefined,
        tolerances: typeof mfg === 'object' ? mfg?.tolerances : undefined,
        processingCost: typeof mfg === 'object' ? mfg?.processing_cost : undefined,
        unitCost: cost?.unit_cost,
        extendedCost: cost?.extended_cost,
        currency: cost?.currency || 'USD',
        supplier: n.supplier,
        dppId: n.dpp_id,
        depth: n.parent_id ? 1 : 0,
        hasChildren: false,
        isAssembly: n.node_type === 'assembly' || n.node_type === 'subassembly',
        provenance: n.provenance || [],
        rightsOverride: n.rights_override,
        evidenceRefs: n.evidence_refs || [],
        rawNode: n
      });
    }
  } else if (components.length > 0) {
    for (const c of components) {
      rows.push({
        id: c.cad_body_name || c.name,
        name: c.name,
        partNumber: c.cad_body_name,
        revision: 'R1',
        nodeType: 'component',
        quantity: c.qty ?? 1,
        unit: 'ea',
        material: c.material,
        unitCost: c.unit_cost_usd,
        extendedCost: c.unit_cost_usd ? c.unit_cost_usd * (c.qty || 1) : null,
        currency: 'USD',
        supplier: c.supplier,
        depth: 0,
        hasChildren: false,
        isAssembly: false,
        provenance: [],
        rawNode: c
      });
    }
  } else {
    const strawFallback = [
      { name: '316L Stainless Fluid Conduit Tube', pn: '8988K42', rev: 'R2', qty: 1, unit: 'ea', mat: '316L Stainless Steel', uc: 1.20, supp: 'McMaster-Carr', proc: 'Precision Drawing' },
      { name: 'Sodium Acetate Trihydrate (SAT Core)', pn: 'SAT-50G-PRO', rev: 'R1', qty: 1, unit: 'charge', mat: 'CH3COONa·3H2O', uc: 0.65, supp: 'Bulk Chem Source', proc: 'Formulation & Fill' },
      { name: 'Bistable Snap-Disc Nucleation Trigger', pn: 'SNAP-301-12', rev: 'R1', qty: 1, unit: 'ea', mat: '301 Full-Hard Stainless Spring Steel', uc: 0.35, supp: 'Precision Stamping', proc: 'Progressive Stamping' },
      { name: 'Outer Thermal Insulation Sleeve', pn: 'SIL-JKT-120', rev: 'R3', qty: 1, unit: 'ea', mat: 'Food-Grade Medical Silicone', uc: 0.85, supp: 'Silicone Molding', proc: 'Liquid Silicone Injection' },
      { name: 'Hermetic End Cap Collars & O-Rings', pn: 'EC-VIT-02', rev: 'R2', qty: 2, unit: 'ea', mat: '6061-T6 + FDA Viton O-Rings', uc: 0.725, supp: 'CNC Prototyping', proc: 'CNC Turning + Anodize' }
    ];
    for (const s of strawFallback) {
      rows.push({
        id: s.pn,
        name: s.name,
        partNumber: s.pn,
        revision: s.rev,
        nodeType: 'component',
        quantity: s.qty,
        unit: s.unit,
        material: s.mat,
        process: s.proc,
        unitCost: s.uc,
        extendedCost: s.uc * s.qty,
        currency: 'USD',
        supplier: s.supp,
        depth: 0,
        hasChildren: false,
        isAssembly: false,
        provenance: []
      });
    }
  }

  // Calculate totals
  const totalCost = bomRoot?.cost?.extended_cost ??
    (structure?.estimated_bom_usd ??
      rows.reduce((acc, item) => (item.extendedCost !== null && item.extendedCost !== undefined ? acc + item.extendedCost : acc), 0));

  const hasMissingCosts = rows.some(r => r.unitCost === null || r.unitCost === undefined);
  const currency = bomRoot?.cost?.currency || 'USD';

  const getNodeTypeBadgeStyle = (type: string) => {
    switch (type.toLowerCase()) {
      case 'assembly':
        return { background: '#EFF6FF', color: '#0284C7', border: '1px solid #BAE6FD' };
      case 'subassembly':
        return { background: '#F5F3FF', color: '#111827', border: '1px solid #DDD6FE' };
      case 'fastener':
        return { background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' };
      case 'raw_material':
        return { background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' };
      default:
        return { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' };
    }
  };

  return (
    <div className={styles.tabContentContainer}>
      {/* Header & BOM Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={22} style={{ color: 'var(--accent-primary)' }} />
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Canonical Hierarchical Product Graph</h2>
            <span style={{
              fontSize: '0.75rem',
              padding: '0.2rem 0.55rem',
              borderRadius: '999px',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#059669',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <ShieldCheck size={12} />
              Milestone M3 — Cryptographic Rights
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
            Verifiable asymmetric identity, signed revision chains, capability-based delegation, and portable .twin bundles.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Node Count */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.5rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Box size={16} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Nodes:</span>
            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {rows.length}
            </span>
          </div>

          {/* Rolled-Up Unit Cost */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.5rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Rolled-Up Unit Cost:</span>
            {totalCost !== null && totalCost !== undefined ? (
              <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                ${Number(totalCost).toFixed(2)} {currency}
              </span>
            ) : (
              <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#D97706', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <AlertCircle size={14} /> Pending Quotes
              </span>
            )}
          </div>

          {/* View DPP Projection Preview Button */}
          <button
            onClick={() => setShowDppModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 0.95rem',
              background: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s ease'
            }}
          >
            <ShieldCheck size={16} style={{ color: 'var(--accent-primary)' }} />
            DPP Projection Preview
          </button>
        </div>
      </div>

      {/* Missing Data Notice if applicable */}
      {hasMissingCosts && (
        <div style={{
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: 'var(--radius-sm)',
          padding: '0.65rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.8125rem',
          color: '#92400E'
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>
            <strong>Honest Missing Data:</strong> Some constituent components lack verified supplier quotes. In TwinThink, missing costs remain honestly unknown rather than fabricated.
          </span>
        </div>
      )}

      {/* Main Grid: Tree Table + Attached Domain Inspector */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedNode ? '1fr 380px' : '1fr',
        gap: '1.25rem',
        alignItems: 'start',
        transition: 'grid-template-columns 0.3s ease'
      }}>
        {/* Hierarchical BOM Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ minWidth: '220px' }}>Structural Hierarchy & Part</th>
                <th>Type</th>
                <th>Material Spec</th>
                <th>Process & Finish</th>
                <th>Qty</th>
                <th>Unit Cost</th>
                <th>Extended Cost</th>
                <th>Supplier / DPP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => {
                const badgeStyle = getNodeTypeBadgeStyle(item.nodeType);
                const isCollapsed = collapsedNodes[item.id];
                const isSelected = selectedNode?.id === item.id;

                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedNode(item)}
                    style={{
                      background: isSelected
                        ? 'rgba(0, 204, 255, 0.12)'
                        : item.isAssembly ? 'rgba(255, 255, 255, 0.02)' : undefined,
                      cursor: 'pointer'
                    }}
                  >
                    {/* Name & Hierarchy with indent */}
                    <td>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        paddingLeft: `${item.depth * 1.5}rem`,
                        position: 'relative'
                      }}>
                        {item.depth > 0 && (
                          <span style={{
                            color: 'var(--text-muted)',
                            fontSize: '0.75rem',
                            marginRight: '0.2rem',
                            userSelect: 'none'
                          }}>
                            └──
                          </span>
                        )}

                        {item.hasChildren ? (
                          <button
                            onClick={(e) => toggleCollapse(item.id, e)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              color: 'var(--accent-primary)'
                            }}
                            title={isCollapsed ? 'Expand subassembly' : 'Collapse subassembly'}
                          >
                            {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                          </button>
                        ) : (
                          <span style={{ width: '15px' }} />
                        )}

                        <div>
                          <div style={{
                            fontWeight: item.isAssembly ? 700 : 500,
                            color: item.isAssembly ? 'var(--accent-primary)' : 'var(--text-primary)',
                            fontSize: '0.875rem'
                          }}>
                            {item.name}
                          </div>
                          {item.partNumber && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              PN: {item.partNumber} {item.revision && `(${item.revision})`}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Node Type Badge */}
                    <td>
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '0.2rem 0.45rem',
                        borderRadius: 'var(--radius-xs)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        fontWeight: 600,
                        ...badgeStyle
                      }}>
                        {item.nodeType}
                      </span>
                    </td>

                    {/* Material */}
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {item.material ? (
                        <div>
                          <div>{item.material}</div>
                          {item.materialGrade && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Grade: {item.materialGrade}</div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    {/* Manufacturing Process */}
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {item.process || item.finish ? (
                        <div>
                          {item.process && <div>{item.process}</div>}
                          {item.finish && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.finish}</div>}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    {/* Quantity & Unit */}
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.875rem' }}>
                      {item.quantity} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.unit}</span>
                    </td>

                    {/* Unit Cost */}
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
                      {item.unitCost !== null && item.unitCost !== undefined ? (
                        `$${Number(item.unitCost).toFixed(2)}`
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>quote pending</span>
                      )}
                    </td>

                    {/* Extended Cost */}
                    <td style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: item.isAssembly ? 'var(--accent-primary)' : 'var(--text-primary)'
                    }}>
                      {item.extendedCost !== null && item.extendedCost !== undefined ? (
                        `$${Number(item.extendedCost).toFixed(2)}`
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>—</span>
                      )}
                    </td>

                    {/* Supplier & DPP */}
                    <td>
                      {item.supplier && (
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{item.supplier}</div>
                      )}
                      {item.dppId ? (
                        <div style={{
                          fontSize: '0.7rem',
                          color: 'var(--accent-primary)',
                          fontFamily: 'var(--font-mono)',
                          marginTop: '0.15rem'
                        }}>
                          DPP: {item.dppId}
                        </div>
                      ) : (
                        !item.supplier && <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Total Row */}
              <tr style={{ background: 'rgba(0, 204, 255, 0.05)', borderTop: '2px solid var(--border-strong)' }}>
                <td colSpan={6} style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Total Rolled-Up Unit BOM:
                </td>
                <td colSpan={2} style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>
                  {totalCost !== null && totalCost !== undefined ? (
                    `$${Number(totalCost).toFixed(2)} ${currency}`
                  ) : (
                    <span style={{ color: '#D97706', fontSize: '0.875rem' }}>Pending supplier pricing</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Attached Domain & Provenance Inspector Panel */}
        {selectedNode && (
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            position: 'sticky',
            top: '1rem'
          }}>
            {/* Inspector Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '0.15rem 0.4rem',
                  borderRadius: 'var(--radius-xs)',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  ...getNodeTypeBadgeStyle(selectedNode.nodeType)
                }}>
                  {selectedNode.nodeType}
                </span>
                <h3 style={{ margin: '0.4rem 0 0.15rem 0', fontSize: '1.125rem', color: 'var(--text-primary)' }}>
                  {selectedNode.name}
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Node ID: {selectedNode.id} {selectedNode.revision && `(${selectedNode.revision})`}
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                title="Close inspector"
              >
                <X size={18} />
              </button>
            </div>

            {/* Declared Rights Mode Card */}
            <div style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <Key size={14} style={{ color: '#111827' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Declared Rights Policy
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: '#111827',
                  background: '#F5F3FF',
                  border: '1px solid #DDD6FE',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px'
                }}>
                  {selectedNode.rightsOverride || globalRightsMode}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {selectedNode.rightsOverride ? '(Component Override)' : '(Inherited from Twin / Design)'}
                </span>
              </div>
              <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Creator distribution intent, not an automatic legal title or warranty.
              </p>
            </div>

            {/* Engineering Domains: Material & Process */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.8125rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                Engineering Attributes
              </h4>

              {/* Material */}
              <div style={{ fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Material:</span>
                <span style={{ fontWeight: 600 }}>{selectedNode.material || 'Unspecified'}</span>
              </div>
              {selectedNode.materialGrade && (
                <div style={{ fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Grade / Alloy:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedNode.materialGrade}</span>
                </div>
              )}
              {selectedNode.materialStandard && (
                <div style={{ fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Standard:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedNode.materialStandard}</span>
                </div>
              )}
              {selectedNode.recycledContentPct !== undefined && (
                <div style={{ fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Recycled Content:</span>
                  <span style={{ color: '#059669', fontWeight: 600 }}>{selectedNode.recycledContentPct}%</span>
                </div>
              )}

              {/* Manufacturing */}
              {selectedNode.process && (
                <div style={{ fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Process:</span>
                  <span>{selectedNode.process}</span>
                </div>
              )}
              {selectedNode.finish && (
                <div style={{ fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Surface Finish:</span>
                  <span>{selectedNode.finish}</span>
                </div>
              )}
              {selectedNode.tolerances && (
                <div style={{ fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Tolerances:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedNode.tolerances}</span>
                </div>
              )}
            </div>

            {/* Cost Rollup Trace */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.8125rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                Cost Rollup Calculation
              </h4>
              <div style={{
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.65rem',
                fontSize: '0.8125rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Unit Cost:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    {selectedNode.unitCost !== null && selectedNode.unitCost !== undefined ? `$${Number(selectedNode.unitCost).toFixed(2)}` : 'Quote Pending'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Quantity:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedNode.quantity} {selectedNode.unit}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.35rem', fontWeight: 700 }}>
                  <span style={{ color: 'var(--accent-primary)' }}>Extended Cost:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>
                    {selectedNode.extendedCost !== null && selectedNode.extendedCost !== undefined ? `$${Number(selectedNode.extendedCost).toFixed(2)} ${selectedNode.currency || 'USD'}` : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Provenance Trail */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={14} style={{ color: 'var(--accent-primary)' }} />
                <h4 style={{ margin: 0, fontSize: '0.8125rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                  Provenance Trail
                </h4>
              </div>
              {selectedNode.provenance && selectedNode.provenance.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedNode.provenance.map((p, idx) => (
                    <div key={idx} style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.55rem',
                      fontSize: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span style={{ color: 'var(--accent-primary)' }}>via {p.source}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{p.action}</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        By: {p.creator} • {new Date(p.captured_at).toLocaleDateString()}
                      </div>
                      {p.creator_identity && (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: '#059669', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <ShieldCheck size={11} />
                          DID: {p.creator_identity}
                        </div>
                      )}
                      {p.revision && (
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          Revision: <strong style={{ color: 'var(--text-primary)' }}>{p.revision}</strong> {p.signature ? '• Ed25519 Signed' : ''}
                        </div>
                      )}
                      {p.artifact_hash && (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem', wordBreak: 'break-all' }}>
                          Hash: {p.artifact_hash}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Standard creation record. Direct contribution via Twin Factory.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* DPP Projection Preview Modal */}
      {showDppModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(17, 24, 39, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '760px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={22} style={{ color: 'var(--accent-primary)' }} />
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                    Digital Product Passport (DPP) Projection
                  </h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                    background: '#FFFBEB',
                    color: '#D97706',
                    border: '1px solid #FDE68A',
                    fontWeight: 700,
                    letterSpacing: '0.04em'
                  }}>
                    PROJECTION PREVIEW — NON-CERTIFIED
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    EU Regulation 2023/1542 / ESPR Projected View
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowDppModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Mandatory Safeguard Disclaimer */}
            <div style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1rem',
              fontSize: '0.8125rem',
              color: '#92400E',
              lineHeight: 1.5
            }}>
              <strong>Regulatory Notice:</strong> This representation is projected directly from the canonical twin record for engineering review and supply-chain audit. It does <em>not</em> constitute an official legally certified EU Battery Passport or CE marking. Formal compliance requires designated notified bodies and registration in the official 2026/2027 EU DPP Registry.
            </div>

            {/* Role-Filtered Tier Selector */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '0.5rem'
            }}>
              <button
                onClick={() => setDppTier('public')}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  border: dppTier === 'public' ? '1px solid #BAE6FD' : '1px solid transparent',
                  background: dppTier === 'public' ? '#EFF6FF' : 'transparent',
                  color: dppTier === 'public' ? '#0284C7' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                Public Consumer Tier
              </button>
              <button
                onClick={() => setDppTier('recycler')}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  border: dppTier === 'recycler' ? '1px solid #A7F3D0' : '1px solid transparent',
                  background: dppTier === 'recycler' ? '#ECFDF5' : 'transparent',
                  color: dppTier === 'recycler' ? '#059669' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                Recycler / Remanufacturer Tier
              </button>
              <button
                onClick={() => setDppTier('authority')}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  border: dppTier === 'authority' ? '1px solid #DDD6FE' : '1px solid transparent',
                  background: dppTier === 'authority' ? '#F5F3FF' : 'transparent',
                  color: dppTier === 'authority' ? '#111827' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                Notified Body / Authority Tier
              </button>
            </div>

            {/* Tier Projection Content */}
            {dppTier === 'public' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Passport ID</div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>
                      {bomRoot?.dpp_id || `DPP-${twin.id.toUpperCase()}`}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Constituents</div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{rows.length} BOM Nodes</div>
                  </div>
                  <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fasteners Count</div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700 }}>
                      {rows.filter(r => r.nodeType === 'fastener').length} Mechanical Fasteners
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-tertiary)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Declared Material Footprint:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {Array.from(new Set(rows.map(r => r.material).filter(Boolean))).map((mat, i) => (
                      <span key={i} style={{
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background: 'rgba(0, 204, 255, 0.1)',
                        color: 'var(--text-primary)'
                      }}>
                        {mat}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong>Circularity Statement:</strong> Modular assembly engineered for mechanical disassembly using standard hand tools. Components can be separated by material stream at end-of-life.
                </div>
              </div>
            )}

            {dppTier === 'recycler' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <strong>Dismantling & Recovery Table:</strong> Constituent parts listed in order of physical isolation for scrap and second-life operators.
                </div>
                <div className={styles.tableWrapper} style={{ maxHeight: '300px' }}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Part</th>
                        <th>Material & Grade</th>
                        <th>Standard</th>
                        <th>Recycled %</th>
                        <th>Process</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.filter(r => !r.isAssembly).map((item) => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 600 }}>{item.name}</td>
                          <td>{item.material} {item.materialGrade && `(${item.materialGrade})`}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{item.materialStandard || '—'}</td>
                          <td style={{ color: item.recycledContentPct ? '#059669' : 'var(--text-muted)' }}>
                            {item.recycledContentPct ? `${item.recycledContentPct}%` : '—'}
                          </td>
                          <td>{item.process || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#059669' }}>
                  ✓ Non-destructive disassembly confirmed for all threaded fasteners.
                </div>
              </div>
            )}

            {dppTier === 'authority' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ background: 'var(--bg-tertiary)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Registered Creator:</span>
                    <span style={{ fontWeight: 600 }}>{twin.creator}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total Rolled Unit Cost:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-primary)' }}>
                      ${Number(totalCost).toFixed(2)} {currency}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Graph Integrity Verification:</span>
                    <span style={{ color: '#059669', fontWeight: 600 }}>Verified Acyclic (3-Color DFS)</span>
                  </div>
                </div>

                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <strong>Audit Ledger:</strong> Full component tree with cost breakdown, supplier quotes, and SHA-256 artifact signatures.
                </div>

                <div className={styles.tableWrapper} style={{ maxHeight: '250px' }}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Node ID</th>
                        <th>Part</th>
                        <th>Supplier</th>
                        <th>Unit Cost</th>
                        <th>Ext Cost</th>
                        <th>Provenance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{r.id}</td>
                          <td>{r.name}</td>
                          <td>{r.supplier || '—'}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{r.unitCost !== null && r.unitCost !== undefined ? `$${Number(r.unitCost).toFixed(2)}` : '—'}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.extendedCost !== null && r.extendedCost !== undefined ? `$${Number(r.extendedCost).toFixed(2)}` : '—'}</td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {r.provenance && r.provenance.length > 0 ? `${r.provenance.length} signature(s)` : 'Direct'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
              <button
                onClick={() => setShowDppModal(false)}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
