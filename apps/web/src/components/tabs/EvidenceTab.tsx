'use client';

import React from 'react';
import TestsTab from './TestsTab';
import { TwinData } from '@/lib/types';

interface EvidenceTabProps {
  twin: TwinData;
  onInspectClaim?: (claimKey: string) => void;
}

export default function EvidenceTab({ twin, onInspectClaim }: EvidenceTabProps) {
  return <TestsTab twin={twin} />;
}
