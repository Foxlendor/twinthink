import type { IdeaNode } from './model';

/** Only recorded, permitted events define a replay. Empty time is not history. */
export function recordedRange(node: IdeaNode, maySee: (node: IdeaNode) => boolean) {
  const times: number[] = [];
  const visit = (current: IdeaNode) => {
    if (!maySee(current)) return;
    times.push(current.began, ...current.events.map(event => event.t));
    current.children.forEach(visit);
  };
  visit(node);
  const ordered = [...new Set(times.filter(Number.isFinite))].sort((a, b) => a - b);
  return ordered.length > 1 ? { from: ordered[0], to: ordered[ordered.length - 1] } : null;
}
