// One Fall across sources: Wikipedia's articles and a maker's own Whoeuvre, joined only where the
// maker has said a piece relates to an article (bridges.ts). Knowledge and human work then share
// one space: from an article, a thread of credit leads to the piece; from the piece, back again.

import { FallNode, Graph, Strand } from './graph';
import { Bridge } from './bridges';
import { WIKI_PREFIX, wikiId } from './wiki';

export const isWiki = (id: string) => id.startsWith(WIKI_PREFIX);

export function joinSources(wiki: Graph, whoeuvre: Graph | null, bridges: Bridge[], maker: string): Graph {
  const pick = (id: string) => (isWiki(id) ? wiki : whoeuvre);
  // only bridges to pieces this visitor may enter (the Whoeuvre source knows which)
  const open = (b: Bridge) => !!whoeuvre?.known?.(b.piece);
  const humanFrom = (id: string): Strand[] => {
    if (isWiki(id)) {
      const out: Strand[] = [];
      for (const b of bridges) {
        if (wikiId(b.article) !== id || !open(b)) continue;
        out.push({ to: b.piece, title: titleOf(b.piece), bearing: 'to', why: `${maker} made this: ${b.why}`, strength: 0.8, human: true });
      }
      return out;
    }
    return bridges
      .filter((b) => b.piece === id && open(b))
      .map((b) => ({ to: wikiId(b.article), title: b.article.replace(/_/g, ' '), bearing: 'from' as const, why: b.why, strength: 0.8, human: true }));
  };
  // a piece is named by its own title, as the Whoeuvre gives it
  const titleOf = (piece: string) => whoeuvre?.titleNow?.(piece) ?? piece;

  return {
    strands: async (id) => {
      const g = pick(id);
      if (!g) throw new Error('not ready');
      const human = humanFrom(id);
      try {
        return [...human, ...(await g.strands(id))];
      } catch (e) {
        // the maker's own threads do not depend on the source being reachable; if there are none,
        // the place says it could not be reached and shows nothing in their place
        if (human.length) return human;
        throw e;
      }
    },
    node: (id): Promise<FallNode> => pick(id)?.node(id) ?? Promise.reject(new Error('not ready')),
    known: (id) => {
      const k = pick(id)?.known?.(id);
      return k ? [...humanFrom(id), ...k] : undefined;
    },
  };
}
