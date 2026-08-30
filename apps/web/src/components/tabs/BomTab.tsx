'use client';

import React from 'react';
import { TwinData } from '@/lib/types';
import { Layers, ShieldCheck, DollarSign, ExternalLink } from 'lucide-react';
import styles from './Tabs.module.css';

interface TabProps {
  twin: TwinData;
}

export default function BomTab({ twin }: TabProps) {
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
                  <td style={{ fontWeight: 600, color: '#a64dff' }}>{item.axiom}</td>
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

  // Physical Object BOM for Sodium Acetate Thermal Straw
  const strawBomItems = [
    { 
      component: '316L Stainless Fluid Conduit Tube', 
      spec: '6.0mm ID x 7.0mm OD x 220mm (Food-Contact)', 
      qty: 1, 
      material: '316L Stainless Steel', 
      unitCost: 1.20, 
      supplier: 'McMaster-Carr',
      partNumber: '8988K42'
    },
    { 
      component: 'Sodium Acetate Trihydrate (SAT Core)', 
      spec: '50g sealed supersaturated aqueous solution', 
      qty: 1, 
      material: 'CH3COONa·3H2O (Analytical Grade)', 
      unitCost: 0.65, 
      supplier: 'Bulk Chem Source',
      partNumber: 'SAT-50G-PRO'
    },
    { 
      component: 'Bistable Snap-Disc Nucleation Trigger', 
      spec: '0.15mm thickness x 12mm dia. spring disc', 
      qty: 1, 
      material: '301 Full-Hard Stainless Spring Steel', 
      unitCost: 0.35, 
      supplier: 'Precision Stamping',
      partNumber: 'SNAP-301-12'
    },
    { 
      component: 'Outer Thermal Insulation Sleeve', 
      spec: '1.5mm wall silicone jacket with grip ribbing', 
      qty: 1, 
      material: 'Food-Grade Medical Silicone', 
      unitCost: 0.85, 
      supplier: 'Silicone Molding',
      partNumber: 'SIL-JKT-120'
    },
    { 
      component: 'Hermetic End Cap Collars & O-Rings', 
      spec: 'Dual radial O-ring chamber seals & nozzle ring', 
      qty: 2, 
      material: 'Anodized 6061-T6 + FDA Viton O-Rings', 
      unitCost: 0.725, 
      supplier: 'CNC Prototyping',
      partNumber: 'EC-VIT-02'
    }
  ];

  const totalCost = strawBomItems.reduce((acc, item) => acc + (item.qty * item.unitCost), 0);

  return (
    <div className={styles.tabContentContainer}>
      
      {/* Header & BOM Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Bill of Materials (BOM)</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
            Production-grade parts list with food-contact grade specifications, materials, and prototyping sourcing.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.5rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Estimated Unit BOM:</span>
            <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
              ${totalCost.toFixed(2)} USD
            </span>
          </div>
        </div>
      </div>

      {/* BOM Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Component & Specification</th>
              <th>Material</th>
              <th>Qty</th>
              <th>Unit Cost</th>
              <th>Extended</th>
              <th>Supplier / Part #</th>
            </tr>
          </thead>
          <tbody>
            {strawBomItems.map((item, idx) => (
              <tr key={idx}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.component}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{item.spec}</div>
                </td>
                <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {item.material}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {item.qty}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>
                  ${item.unitCost.toFixed(2)}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  ${(item.qty * item.unitCost).toFixed(2)}
                </td>
                <td>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{item.supplier}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{item.partNumber}</div>
                </td>
              </tr>
            ))}
            <tr style={{ background: 'rgba(0, 204, 255, 0.05)', borderTop: '2px solid var(--border-subtle)' }}>
              <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                Total Estimated Unit Cost (Quantity: 1 Proto):
              </td>
              <td colSpan={2} style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>
                ${totalCost.toFixed(2)} USD
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}
