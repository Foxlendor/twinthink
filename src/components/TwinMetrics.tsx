import React from 'react';
import { TwinData } from '@/lib/types';
import { DollarSign, Scale, Clock, AlertTriangle } from 'lucide-react';
import styles from './TwinMetrics.module.css';

interface TwinMetricsProps {
  metrics: TwinData['current_version']['metrics'];
}

export default function TwinMetrics({ metrics }: TwinMetricsProps) {
  return (
    <div className={styles.metricsContainer}>
      <h3 className={styles.title}>QUICK STATS</h3>
      
      <div className={styles.grid}>
        <div className={styles.metricCard}>
          <div className={styles.iconWrapper}>
            <DollarSign size={20} className={styles.icon} />
          </div>
          <div className={styles.metricData}>
            <span className={styles.value}>${metrics.estimated_bom_usd.toFixed(2)}</span>
            <span className={styles.label}>BOM</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.iconWrapper}>
            <Scale size={20} className={styles.icon} />
          </div>
          <div className={styles.metricData}>
            <span className={styles.value}>{metrics.weight_grams}g</span>
            <span className={styles.label}>Weight</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.iconWrapper}>
            <Clock size={20} className={styles.icon} />
          </div>
          <div className={styles.metricData}>
            <span className={styles.value}>{metrics.build_time_hours}h</span>
            <span className={styles.label}>Build</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.iconWrapper}>
            <AlertTriangle size={20} className={styles.icon} />
          </div>
          <div className={styles.metricData}>
            <span className={styles.value} style={{ textTransform: 'capitalize' }}>
              {metrics.difficulty}
            </span>
            <span className={styles.label}>Difficulty</span>
          </div>
        </div>
      </div>

      <div className={styles.checklist}>
        <div className={styles.checkItem}>
          <span className={styles.check}>✓</span> 3D Preview
        </div>
        <div className={styles.checkItem}>
          <span className={styles.check}>✓</span> BOM
        </div>
        <div className={styles.checkItem}>
          <span className={styles.check}>✓</span> Source CAD
        </div>
      </div>
    </div>
  );
}
