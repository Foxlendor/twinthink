import React from 'react';
import { TwinProperty } from '@/lib/types';
import { DollarSign, Scale, Clock, AlertTriangle, Code, Info, Activity } from 'lucide-react';
import styles from './TwinMetrics.module.css';

interface TwinMetricsProps {
  properties: TwinProperty[];
}

function getIconForProperty(key: string) {
  const lowerKey = key.toLowerCase();
  if (lowerKey.includes('usd') || lowerKey.includes('cost')) return DollarSign;
  if (lowerKey.includes('weight') || lowerKey.includes('mass') || lowerKey.includes('grams')) return Scale;
  if (lowerKey.includes('time') || lowerKey.includes('duration') || lowerKey.includes('hours')) return Clock;
  if (lowerKey.includes('difficulty')) return AlertTriangle;
  if (lowerKey.includes('code') || lowerKey.includes('language') || lowerKey.includes('coverage')) return Code;
  if (lowerKey.includes('dependencies')) return Activity;
  return Info;
}

export default function TwinMetrics({ properties }: TwinMetricsProps) {
  if (!properties || properties.length === 0) return null;

  return (
    <div className={styles.metricsContainer}>
      <h3 className={styles.title}>PROPERTIES</h3>
      
      <div className={styles.grid}>
        {properties.map((prop) => {
          const Icon = getIconForProperty(prop.key);
          const displayValue = prop.type === 'boolean' 
            ? (prop.value ? 'Yes' : 'No') 
            : prop.value;
            
          return (
            <div key={prop.key} className={styles.metricCard}>
              <div className={styles.iconWrapper}>
                <Icon size={20} className={styles.icon} />
              </div>
              <div className={styles.metricData}>
                <span className={styles.value}>
                  {prop.key.includes('usd') ? '$' : ''}{displayValue}{prop.unit ? prop.unit : ''}
                </span>
                <span className={styles.label} style={{ textTransform: 'capitalize' }}>
                  {prop.label || prop.key.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
