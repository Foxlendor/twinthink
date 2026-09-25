import { TWINS_DATABASE } from '../../twinsData';
import type { TwinData } from '../../types';
import { DAY_MS, type HistoryEventType, type RelationshipType } from '../model';
import type { AuthoredSpec } from './authored';

/**
 * Adapter from existing Twin records (lib/twinsData.ts, same shape as the
 * API's /api/twins/{id}) into Field structure.
 *
 * Everything produced here is origin: 'record'. The mapping from the existing
 * disclosure system to d(x) is direct:
 *   publication_scope 'public_preview' -> low d (anyone can perceive)
 *   publication_scope 'private'        -> d 0.9 (the creator's private layer)
 */

export interface RecordOverlay {
  title: string;
  summary: string;
  recordHref: string;
  createdAtDaysAgo: number;
  events: Array<[HistoryEventType, number, string?]>;
  facets: AuthoredSpec[];
  relationships: Array<[RelationshipType, string]>;
}

const daysAgo = (iso: string, now: number) => Math.max(0, Math.round((now - Date.parse(iso)) / DAY_MS));

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'item';

function stripMarks(title: string) {
  return title.replace(/™/g, '').trim();
}

function formatValue(value: unknown, unit?: string) {
  if (typeof value === 'number') return unit ? `${value} ${unit}` : String(value);
  return String(value);
}

export function recordOverlay(recordId: string, now: number, resolveRecordNode: (recordId: string) => string | null): RecordOverlay | null {
  const record: TwinData | undefined = TWINS_DATABASE[recordId];
  if (!record) return null;
  const version = record.current_version;
  const created = daysAgo(record.created_at, now);
  const events: RecordOverlay['events'] = [['began', created, 'Twin record created']];
  for (const v of record.versions.slice(1)) events.push(['revised', daysAgo(v.published_at, now), `Version ${v.semver}`]);
  if (recordId === '0001') events.push(['realized', created, 'Built and shown as a physical prototype']);

  const relationships: RecordOverlay['relationships'] = [];
  const parentId = record.lineage.parent?.parent_twin_id;
  if (parentId) {
    const target = resolveRecordNode(parentId);
    if (target) relationships.push(['descends_from', target]);
  }

  const facets: AuthoredSpec[] = [];
  const properties = version.properties ?? [];
  if (properties.length) {
    facets.push({
      slug: 'record-what-it-is',
      kind: 'facet',
      title: 'What the record says',
      gist: 'Specifications from the Twin record.',
      began: created,
      d: 0.12,
      origin: 'record',
      children: properties.map((property, index) => ({
        slug: slugify(property.key) || 'p' + index,
        kind: 'component',
        title: property.label ?? property.key,
        gist: formatValue(property.value, property.unit),
        body: `${property.label ?? property.key}: ${formatValue(property.value, property.unit)}`,
        began: created,
        // Pricing is the kind of detail a creator shares with people who are closer.
        d: /usd|msrp|cost|price/i.test(property.key) ? 0.5 : 0.16,
        origin: 'record',
        children: [],
      })),
    });
  }

  const callouts = version.disclosure?.callouts ?? [];
  if (callouts.length) {
    facets.push({
      slug: 'record-principles',
      kind: 'facet',
      title: 'Principles',
      gist: 'What the creator chose to point out.',
      began: created,
      d: 0.12,
      origin: 'record',
      children: callouts.map((callout) => ({
        slug: slugify(callout.label),
        kind: 'thought',
        title: callout.label,
        body: callout.description,
        began: created,
        d: 0.14,
        origin: 'record',
        children: [],
      })),
    });
  }

  const assets = version.assets ?? [];
  if (assets.length) {
    facets.push({
      slug: 'record-artifacts',
      kind: 'facet',
      title: 'Artifacts',
      gist: 'Files attached to the record.',
      began: created,
      d: 0.14,
      origin: 'record',
      children: assets.map((asset) => {
        const open = asset.publication_scope === 'public_preview';
        return {
          slug: slugify(asset.relative_path),
          kind: 'evidence' as const,
          title: asset.entrypoint_name || asset.relative_path,
          body: open ? 'Part of the public preview of this Twin.' : 'Kept private by the creator.',
          began: created,
          d: open ? 0.16 : 0.9,
          origin: 'record' as const,
          evidence: [
            {
              medium: /model|gltf|threejs/.test(asset.media_type) ? ('file' as const) : /csv/.test(asset.media_type) ? ('measurement' as const) : ('file' as const),
              label: asset.entrypoint_name || asset.relative_path,
              href: open ? `/twins/${record.id}` : undefined,
            },
          ],
          events: [
            ['began', created],
            ['evidence', created],
          ] as Array<[HistoryEventType, number]>,
          children: [],
        };
      }),
    });
  }

  return {
    title: stripMarks(version.title),
    summary: version.summary,
    recordHref: `/twins/${record.id}`,
    createdAtDaysAgo: created,
    events,
    facets,
    relationships,
  };
}
