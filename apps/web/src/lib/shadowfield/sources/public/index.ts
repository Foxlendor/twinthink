import { AI_IDEAS } from './ai';
import { CORE_IDEAS } from './core';
import { CREATIVE_IDEAS } from './creative';
import { ENERGY_IDEAS } from './energy';
import { GAME_IDEAS } from './games';
import { PHYSICAL_IDEAS } from './physical';
import type { PublicCategory, PublicIdeaRecord } from './types';

export type { PublicCategory, PublicIdeaRecord } from './types';

export const PUBLIC_IDEAS: PublicIdeaRecord[] = [
  ...CORE_IDEAS,
  ...PHYSICAL_IDEAS,
  ...ENERGY_IDEAS,
  ...GAME_IDEAS,
  ...AI_IDEAS,
  ...CREATIVE_IDEAS,
];

export const PUBLIC_CATEGORIES: PublicCategory[] = [
  'TwinThink',
  'Physical inventions',
  'Energy & motion',
  'Interfaces & materials',
  'Games & interactive systems',
  'AI-native experiments',
  'Creative worlds',
  'Music & performance',
];
