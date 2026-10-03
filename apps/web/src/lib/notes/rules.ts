// Anonymous notes left at a seal: the rules, shared by the API and the tests.

export const NOTE_MAX = 500;

/** A note is plain words: trimmed, no control characters, 1..NOTE_MAX long. */
export function cleanNote(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const text = raw.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim();
  if (!text || text.length > NOTE_MAX) return null;
  return text;
}
