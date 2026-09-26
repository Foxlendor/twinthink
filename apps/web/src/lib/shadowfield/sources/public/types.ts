import type { IdeaKind } from '../../model';

export type PublicCategory =
  | 'TwinThink'
  | 'Physical inventions'
  | 'Energy & motion'
  | 'Interfaces & materials'
  | 'Games & interactive systems'
  | 'AI-native experiments'
  | 'Creative worlds'\n  | 'Music & performance';

export interface PublicIdeaRecord {
  id: string;
  title: string;
  kind: IdeaKind;
  category: PublicCategory;
  era: string;
  status: string;
  summary: string;
  problem: string;
  evolution?: string;
  highlights?: string[];
  evidence: 'journal archive' | 'conversation history' | 'repository history' | 'mixed';
}
