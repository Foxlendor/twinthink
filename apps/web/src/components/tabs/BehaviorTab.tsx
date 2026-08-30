'use client';

import React from 'react';
import SimulationTab from './SimulationTab';
import { TwinData } from '@/lib/types';

interface BehaviorTabProps {
  twin: TwinData;
}

export default function BehaviorTab({ twin }: BehaviorTabProps) {
  return <SimulationTab twin={twin} />;
}
