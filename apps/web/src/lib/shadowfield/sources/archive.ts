// Public-safe creator archive cleared for the Canvas.
//
// The creator profile is intentionally one Shadow. Zooming inward reveals
// categories, projects, and then the public description/evolution of each
// project. This keeps a body of work spatial instead of scattering it into
// unrelated top-level dots.
//
// Privacy rule: this source contains project context only. Do not add personal
// biography, health/legal/relationship history, credentials, or private notes.
//
// Provenance rule: dates are not invented. Historical era labels live in each
// project artifact; the Canvas continuity event only records publication here.

import { IdeaNode } from '../model';
import { hashString } from '../rng';
import { PUBLIC_CATEGORIES, PUBLIC_IDEAS, PublicIdeaRecord } from './public';

const ADDED = Date.parse('2026-09-25T15:00:00Z');

const CATEGORY_POSITIONS: Record<string, [number, number]> = {
  'TwinThink': [-0.06, -0.50],
  'Physical inventions': [0.43, -0.34],
  'Energy & motion': [0.60, 0.10],
  'Interfaces & materials': [0.35, 0.50],
  'Games & interactive systems': [-0.12, 0.60],
  'AI-native experiments': [-0.55, 0.35],
  'Creative worlds': [-0.62, -0.08],
  'Music & performance': [-0.38, -0.47],
};

function detailNode(project: PublicIdeaRecord, suffix: string, title: string, body: string, index: number): IdeaNode {
  return {
    id: `creator/foxlendor/${project.id}/${suffix}`,
    title,
    note: body,
    kind: project.kind,
    origin: 'real',
    began: ADDED,
    events: [{ t: ADDED + index, kind: 'evidence', note: 'public archive note' }],
    state: 'alive',
    disclosure: 0,
    children: [],
    artifact: { type: 'text', body },
    x: 0,
    y: 0,
    r: 0.05,
    seed: hashString(`${project.id}:${suffix}`),
  };
}

function projectNode(project: PublicIdeaRecord): IdeaNode {
  const details: IdeaNode[] = [
    detailNode(project, 'what', 'what it is', project.summary, 1),
    detailNode(project, 'problem', 'what it was trying to solve', project.problem, 2),
  ];

  if (project.evolution) details.push(detailNode(project, 'evolution', 'how it changed', project.evolution, 3));

  if (project.highlights?.length) {
    details.push(
      detailNode(
        project,
        'notes',
        'public notes',
        project.highlights.map((line) => `• ${line}`).join('\n'),
        4
      )
    );
  }

  details.push(
    detailNode(
      project,
      'record',
      'record',
      `Era: ${project.era}\nStatus: ${project.status}\nSource: ${project.evidence}\n\nThis is a public-safe summary. Missing dates or mechanics are left missing rather than guessed.`,
      5
    )
  );

  return {
    id: `creator/foxlendor/${project.id}`,
    title: project.title,
    note: project.summary,
    kind: project.kind,
    origin: 'real',
    began: ADDED,
    events: [{ t: ADDED, kind: 'begin', note: 'added to the public inventor archive' }],
    state: project.status.includes('failed') ? 'abandoned' : 'alive',
    disclosure: 0,
    children: details,
    x: 0,
    y: 0,
    r: 0.055,
    seed: hashString(project.id),
  };
}

function categoryNode(category: string, projects: PublicIdeaRecord[], index: number): IdeaNode {
  const [x, y] = CATEGORY_POSITIONS[category] ?? [0, 0];
  return {
    id: `creator/foxlendor/category/${hashString(category)}`,
    title: category,
    note: `${projects.length} public project${projects.length === 1 ? '' : 's'}`,
    kind: 'unknown',
    origin: 'real',
    began: ADDED,
    events: [{ t: ADDED + index, kind: 'begin', note: 'public archive branch' }],
    state: 'alive',
    disclosure: 0,
    children: projects.map(projectNode),
    x,
    y,
    r: 0.07,
    fixed: true,
    seed: hashString(category),
  };
}

export function buildArchiveShadows(): IdeaNode[] {
  const categories = PUBLIC_CATEGORIES
    .map((category, index) => {
      const projects = PUBLIC_IDEAS.filter((idea) => idea.category === category);
      return projects.length ? categoryNode(category, projects, index) : null;
    })
    .filter(Boolean) as IdeaNode[];

  const creator: IdeaNode = {
    id: 'creator/foxlendor',
    title: 'Foxlendor / Johne.boi',
    note: 'Inventor, systems thinker, game designer, musician, and maker. Zoom in to follow the ideas instead of reading a résumé.',
    kind: 'unknown',
    origin: 'real',
    began: ADDED,
    events: [{ t: ADDED, kind: 'begin', note: 'public body of work added to the Canvas' }],
    state: 'alive',
    disclosure: 0,
    children: categories,
    artifact: {
      type: 'text',
      body:
        'This public creator Shadow collects projects that were cleared for the Canvas. It intentionally excludes private personal history and projects whose meaning could not be reconstructed reliably.',
    },
    x: -0.42,
    y: 0.12,
    r: 0.0032,
    fixed: true,
    seed: hashString('creator/foxlendor'),
    signals: { returns: 0 },
  };

  return [creator];
}
