'use client';

import React from 'react';
import { TwinData } from '@/lib/types';
import { FileCode, FileText, Box, Download, Eye } from 'lucide-react';
import styles from './Tabs.module.css';

interface TabProps {
  twin: TwinData;
}

const getFileIcon = (mediaType: string) => {
  if (mediaType.includes('gltf')) return <Box size={18} className="text-accent-primary" />;
  if (mediaType.includes('csv')) return <FileText size={18} />;
  return <FileCode size={18} />;
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function FilesTab({ twin }: TabProps) {
  const { assets } = twin.current_version;

  return (
    <div className={styles.tabContentContainer}>
      <h2 className={styles.sectionTitle}>Bundle Assets</h2>
      
      <div className={styles.fileTree}>
        {assets.map((asset, idx) => (
          <div key={idx} className={styles.fileItem}>
            <div className={styles.fileInfo}>
              {getFileIcon(asset.media_type)}
              <span className={styles.fileName}>{asset.relative_path}</span>
              {asset.is_entrypoint === 1 && (
                <span className="badge badge-outline">{asset.entrypoint_name}</span>
              )}
            </div>
            
            <div className={styles.fileActions}>
              <span className={styles.fileSize}>{formatBytes(asset.size_bytes)}</span>
              <button 
                className="button-secondary" 
                style={{ padding: '0.25rem 0.5rem' }} 
                title="Preview"
                onClick={() => alert(`Previewing ${asset.relative_path} functionality coming soon!`)}
              >
                <Eye size={14} />
              </button>
              <button 
                className="button-secondary" 
                style={{ padding: '0.25rem 0.5rem' }} 
                title="Download"
                onClick={() => alert(`Downloading ${asset.relative_path}...`)}
              >
                <Download size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
