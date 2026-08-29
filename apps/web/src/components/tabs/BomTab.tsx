import React from 'react';
import { TwinData } from '@/lib/types';
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

  // Standard Physical Object BOM
  const mockBomItems = [
    { component: 'MG90S Servo', qty: 5, unitCost: 8.50, supplier: 'Adafruit' },
    { component: 'ESP32-S3', qty: 1, unitCost: 7.00, supplier: 'Mouser' },
    { component: 'TPU Filament (1kg)', qty: 0.1, unitCost: 35.00, supplier: 'MatterHackers' },
    { component: 'Rotary Encoders', qty: 5, unitCost: 1.20, supplier: 'DigiKey' },
    { component: 'Misc Screws/Bearings', qty: 1, unitCost: 5.00, supplier: 'McMaster-Carr' },
  ];

  const total = mockBomItems.reduce((acc, item) => acc + (item.qty * item.unitCost), 0);

  return (
    <div className={styles.tabContentContainer}>
      <h2 className={styles.sectionTitle}>Bill of Materials</h2>
      
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Component</th>
              <th>Qty</th>
              <th>Unit Cost</th>
              <th>Total</th>
              <th>Supplier</th>
            </tr>
          </thead>
          <tbody>
            {mockBomItems.map((item, idx) => (
              <tr key={idx}>
                <td>{item.component}</td>
                <td>{item.qty}</td>
                <td>${item.unitCost.toFixed(2)}</td>
                <td>${(item.qty * item.unitCost).toFixed(2)}</td>
                <td>{item.supplier}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>Estimated Total:</td>
              <td colSpan={2} style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                ${total.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
