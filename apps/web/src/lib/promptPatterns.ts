// Prompt pattern library — each pattern maps a well-known LLM prompt engineering technique
// to a concrete TwinThink interaction, available in the UI and via MCP tools.

export type PatternId =
  | 'question-refinement'
  | 'sub-questions'
  | 'persona'
  | 'template'
  | 'meta-language'
  | 'recipe'
  | 'alternatives'
  | 'outline-expander'
  | 'fact-verification'
  | 'tail-prompt'
  | 'filter';

export interface PromptPattern {
  id: PatternId;
  name: string;
  description: string;
  twinThinkUse: string;
}

export const PATTERNS: PromptPattern[] = [
  {
    id: 'question-refinement',
    name: 'Question Refinement',
    description: 'Suggest a more precise, testable version of an inquiry or hypothesis.',
    twinThinkUse: 'Sharpen Core Inquiry questions in Thought Logs into falsifiable, measurable hypotheses.',
  },
  {
    id: 'sub-questions',
    name: 'Sub-question Decomposer',
    description: 'Break down a complex question into supporting sub-questions whose answers combine into the full answer.',
    twinThinkUse: 'Decompose a Thought Log inquiry into specific, independently testable sub-problems.',
  },
  {
    id: 'persona',
    name: 'Persona Lens',
    description: 'View and evaluate information through the perspective of a specific expert or stakeholder.',
    twinThinkUse: 'Reframe peer reviews and design decisions from investor, machinist, safety, or end-user perspectives.',
  },
  {
    id: 'template',
    name: 'Template Fill',
    description: 'Structure output around a fixed template with named CAPITALIZED placeholders.',
    twinThinkUse: 'Create new Thought Logs using a structured invention-analysis template.',
  },
  {
    id: 'meta-language',
    name: 'Meta Language Commands',
    description: 'Define shorthand commands (X → do Y) that trigger specific analytical behaviors.',
    twinThinkUse: 'Use shorthand in the ShadowField canvas (expand:, alt:, validate:, recipe:) to activate pattern modes.',
  },
  {
    id: 'recipe',
    name: 'Recipe / Step Completer',
    description: 'Given a goal and partial steps, fill in missing steps and remove redundant ones.',
    twinThinkUse: "Complete an inventor's manufacturing or R&D roadmap from known milestones.",
  },
  {
    id: 'alternatives',
    name: 'Alternative Approaches',
    description: 'List the best alternative approaches to a decision with pros/cons comparison.',
    twinThinkUse: 'For any BOM material, mechanism, or design choice — show alternatives with trade-off analysis.',
  },
  {
    id: 'outline-expander',
    name: 'Outline Expander',
    description: 'Generate a bullet outline from a topic, then expand selected bullets progressively.',
    twinThinkUse: 'Turn an invention topic into a structured investigation outline for new Thought Logs.',
  },
  {
    id: 'fact-verification',
    name: 'Fact Verification',
    description: 'Extract the fundamental verifiable claims from text — those that would undermine it if wrong.',
    twinThinkUse: 'Surface key physical constants, material specs, and test results inside Thought Log deliberations.',
  },
  {
    id: 'tail-prompt',
    name: 'Tail Prompt',
    description: 'At the end of output, repeat key open items and ask for the next action.',
    twinThinkUse: "End Peer Review sessions with an open-questions summary and prompt for the inventor's next response.",
  },
  {
    id: 'filter',
    name: 'Content Filter',
    description: 'Remove or isolate specific information matching given criteria.',
    twinThinkUse: 'Filter Thought Logs and Peer Reviews by phase, topic, date, or persona.',
  },
];

// ─── Question Refinement ────────────────────────────────────────────────────

export function refineQuestion(q: string): string {
  const stripped = q.replace(/[?.!]+$/, '').trim();
  const lower = stripped.toLowerCase();
  if (lower.startsWith('can ') || lower.startsWith('is ') || lower.startsWith('does ') || lower.startsWith('will ')) {
    return stripped + ' — under the specified operating conditions, with success defined by a physically measurable, numerically bounded outcome?';
  }
  if (lower.startsWith('how ') || lower.startsWith('what ') || lower.startsWith('why ')) {
    return `Can "${stripped}" be answered through direct physical measurement or quantitative analysis within the operating constraints of this prototype?`;
  }
  return `Can "${stripped}" be validated empirically within the prototype's operating envelope, with a measurable threshold distinguishing success from failure?`;
}

// ─── Sub-question Decomposer ─────────────────────────────────────────────────

export function generateSubQuestions(topic: string): string[] {
  return [
    `What are the fundamental physical or chemical mechanisms that enable or prevent ${topic}?`,
    `What is the measurable threshold or quantitative boundary that defines success versus failure?`,
    `What existing approaches or prior art address this problem, and why are they insufficient here?`,
    `What are the most likely failure modes, edge cases, or degradation pathways?`,
    `How can the answer be empirically validated or reproduced in a physical bench test?`,
    `What upstream decisions or constraints does this answer affect in the BOM or design?`,
  ];
}

// ─── Fact Verification ──────────────────────────────────────────────────────

const CLAIM_RE = /\d+[\.,]?\d*\s*(?:kJ\/kg|kJ|W\/m·K|W|kg|mm|°C|K|Pa|MPa|GPa|wt%|mL\/s|mL|Hz|N|V|A|g|cm|in|psi|bar|mol\/L|mol|rpm|μm|nm|cycles?|seconds?|minutes?|hours?|days?)|316L|SAT|HDPE|PEEK|PTFE|pH\s*[\d.]+|±[\d.]+|[≤≥<>]\s*\d[\d.]*|AISI\s*\d+|ASTM\s*\w+|ISO\s*\d+|\d+\s*(?:x|×)\s*\d+/i;

export function extractVerifiableClaims(text: string): string[] {
  const sentences = text
    .split(/(?<=[.!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25);
  return sentences.filter((s) => CLAIM_RE.test(s));
}

// ─── Template ───────────────────────────────────────────────────────────────

export const INVENTION_LOG_TEMPLATE = `TOPIC: [ENGINEERING DOMAIN / PROBLEM AREA]
PHASE: [DEVELOPMENT PHASE — e.g., Conceptual Feasibility · Structural Engineering · Mechanism Prototyping]
CORE INQUIRY: Can [MECHANISM OR MATERIAL] achieve [MEASURABLE OUTCOME] within [CONSTRAINT OR OPERATING CONDITION]?
DELIBERATION: [Quantitative analysis. Include relevant equations, published material values, competing approaches considered, and edge cases stress-tested.]
CONCLUSION: [PHYSICAL SPECIFICATION OR DESIGN DECISION ESTABLISHED]
PARAMETERS:
  [PARAMETER LABEL 1]: [VALUE WITH UNITS ± TOLERANCE]
  [PARAMETER LABEL 2]: [VALUE WITH UNITS ± TOLERANCE]`;

// ─── Personas ────────────────────────────────────────────────────────────────

export interface Persona {
  id: string;
  label: string;
  color: string;
  focusAreas: string[];
  lens: string;
}

export const PERSONAS: Persona[] = [
  {
    id: 'investor',
    label: 'Investor / Backer',
    color: '#7C3AED',
    focusAreas: ['IP defensibility', 'Manufacturing scalability', 'Unit economics', 'Market size'],
    lens: 'Reviews for investability: cost-per-unit at scale, defensible moat, tooling capex, and go-to-market timeline.',
  },
  {
    id: 'machinist',
    label: 'Machinist / Fabricator',
    color: '#2563EB',
    focusAreas: ['Tolerances & GD&T', 'Tooling paths', 'Material machinability', 'Assembly sequence'],
    lens: 'Reviews for manufacturability: achievable tolerances, fixturing complexity, surface finish requirements, and minimum order quantities.',
  },
  {
    id: 'safety',
    label: 'Safety Engineer',
    color: '#DC2626',
    focusAreas: ['FMEA failure modes', 'FDA / CE / RoHS compliance', 'Thermal runaway risk', 'Contact material safety'],
    lens: 'Reviews for hazard potential: failure modes, regulatory compliance gaps, edge-case exposures, and recall risk.',
  },
  {
    id: 'enduser',
    label: 'End User / Consumer',
    color: '#059669',
    focusAreas: ['Usability & ergonomics', 'Portability & carry', 'Cleaning / maintenance', 'Price point'],
    lens: 'Reviews for lived experience: ease of use, daily-carry practicality, cleaning ritual, and value vs. existing products.',
  },
  {
    id: 'chemist',
    label: 'Materials / Chemist',
    color: '#D97706',
    focusAreas: ['Phase diagram accuracy', 'Chemical compatibility', 'Long-term stability', 'Supplier purity specs'],
    lens: 'Reviews for material science rigor: phase behavior fidelity, leaching risk, degradation over thermal cycles, and purity requirements.',
  },
];

// ─── Alternatives ─────────────────────────────────────────────────────────--

export interface MaterialAlternative {
  name: string;
  pros: string[];
  cons: string[];
  costFactor: string;
  suitability: 'high' | 'medium' | 'low';
}

export const MATERIAL_ALTERNATIVES: Record<string, MaterialAlternative[]> = {
  '316l': [
    {
      name: '304 Stainless Steel',
      pros: ['~30% lower cost', 'Very widely available', 'Same machinability'],
      cons: ['No molybdenum — susceptible to pitting in acidic media (pH <5)', 'Not recommended for beverage contact in acidic drinks'],
      costFactor: '0.7×',
      suitability: 'low',
    },
    {
      name: 'Titanium Grade 2',
      pros: ['Excellent corrosion resistance across all pH', 'Biocompatible / FDA-approved', 'Lighter (4.5 g/cm³ vs 7.9)'],
      cons: ['2–3× more expensive', 'Harder to machine (lower SFM, specialized tooling)', 'Limited precision tube suppliers'],
      costFactor: '2.5×',
      suitability: 'medium',
    },
    {
      name: 'PEEK Polymer (30% GF)',
      pros: ['Low thermal conductivity — reduces heat loss to hand', 'Chemically inert', 'Injection-moldable'],
      cons: ['Lower stiffness than metal', 'Not suitable for sharp Viton O-ring seal faces', 'Higher creep at elevated temperature'],
      costFactor: '1.8×',
      suitability: 'low',
    },
  ],
  'sodium acetate': [
    {
      name: 'Erythritol (PCM)',
      pros: ['Higher latent heat (339 kJ/kg)', 'Higher melting point (117°C)', 'Food-safe'],
      cons: ['Not supercoolable on demand', 'Crystallises violently — hard to control', 'Very expensive'],
      costFactor: '4×',
      suitability: 'low',
    },
    {
      name: 'Paraffin Wax C18',
      pros: ['Very cheap and stable', 'Wide availability', 'No hydration issues'],
      cons: ['Not food-safe — contact risk', 'No supercooling capability', 'Lower latent heat (244 kJ/kg)', 'Leakage risk if melted'],
      costFactor: '0.3×',
      suitability: 'low',
    },
    {
      name: 'CaCl₂·6H₂O (Calcium Chloride Hexahydrate)',
      pros: ['Supercoolable', 'Inexpensive (0.5×)', 'Decent latent heat (190 kJ/kg)'],
      cons: ['Corrosive to most metals including 304SS', 'Hygroscopic — packaging complexity', 'Narrower phase plateau'],
      costFactor: '0.5×',
      suitability: 'medium',
    },
  ],
};

export function lookupAlternatives(keyword: string): MaterialAlternative[] | null {
  const key = keyword.toLowerCase();
  if (key.includes('316') || key.includes('stainless')) return MATERIAL_ALTERNATIVES['316l'];
  if (key.includes('sodium acetate') || key.includes('sat') || key.includes('phase change') || key.includes('pcm')) return MATERIAL_ALTERNATIVES['sodium acetate'];
  return null;
}

// ─── Meta Language ───────────────────────────────────────────────────────────

export interface MetaCommand {
  prefix: string;
  label: string;
  patternId: PatternId;
  description: string;
}

export const META_COMMANDS: MetaCommand[] = [
  { prefix: 'expand:', label: 'expand:', patternId: 'outline-expander', description: 'Generate an investigation outline for this topic' },
  { prefix: 'alt:', label: 'alt:', patternId: 'alternatives', description: 'Show alternative approaches for this material or mechanism' },
  { prefix: 'validate:', label: 'validate:', patternId: 'fact-verification', description: 'Extract verifiable claims from this statement' },
  { prefix: 'recipe:', label: 'recipe:', patternId: 'recipe', description: 'Complete the step sequence toward this goal' },
  { prefix: 'refine:', label: 'refine:', patternId: 'question-refinement', description: 'Suggest a more testable version of this question' },
  { prefix: 'persona:', label: 'persona:', patternId: 'persona', description: 'Reframe through a stakeholder perspective (investor / machinist / safety / user / chemist)' },
];

export function parseMetaCommand(text: string): { command: MetaCommand; arg: string } | null {
  for (const cmd of META_COMMANDS) {
    if (text.toLowerCase().startsWith(cmd.prefix)) {
      return { command: cmd, arg: text.slice(cmd.prefix.length).trim() };
    }
  }
  return null;
}
