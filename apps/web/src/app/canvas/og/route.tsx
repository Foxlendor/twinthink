import { ImageResponse } from 'next/og';
import { describeShared } from '@/lib/shadowfield/share';

// The card a shared link unfolds into: its name in ink on paper, and a still
// from its film when it has one. Nothing else.

let serif: Promise<ArrayBuffer | null> | null = null;

/** The Canvas's italic serif, fetched once (the card falls back to a plain face without it). */
function loadSerif() {
  serif ??= (async () => {
    try {
      const css = await (
        await fetch('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,500', { headers: { 'user-agent': 'Mozilla/4.0' } })
      ).text();
      const src = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
      return src ? await (await fetch(src)).arrayBuffer() : null;
    } catch {
      return null;
    }
  })();
  return serif;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const at = url.searchParams.get('at') ?? undefined;
  const d = (await describeShared(at)) ?? { title: 'the Canvas', line: 'songs, dances, animation and inventions' };
  const font = await loadSerif();
  const still = d.still ? new URL(d.still, url.origin).toString() : null;
  const title = d.title.length > 90 ? d.title.slice(0, 88) + '…' : d.title;
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fbfaf7',
          color: 'rgb(30,28,36)',
          fontFamily: font ? 'Cormorant' : 'serif',
          padding: 80,
          position: 'relative',
        }}
      >
        {[520, 400, 290, 190].map((r, i) => (
          <div
            key={r}
            style={{
              position: 'absolute',
              width: r * 2,
              height: r * 2,
              left: 600 - r,
              top: 315 - r,
              borderRadius: r,
              border: `2px dashed rgba(30,28,36,${0.1 + i * 0.04})`,
            }}
          />
        ))}
        {still && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={still} alt="" height={300} style={{ borderRadius: 6, marginBottom: 28, opacity: 0.92 }} />
        )}
        <div style={{ fontSize: title.length > 40 ? 58 : 76, fontStyle: 'italic', textAlign: 'center', lineHeight: 1.15, display: 'flex' }}>{title}</div>
        <div style={{ fontSize: 34, fontStyle: 'italic', opacity: 0.6, marginTop: 20, display: 'flex' }}>{d.line}</div>
        <div style={{ position: 'absolute', bottom: 40, fontSize: 26, opacity: 0.45, display: 'flex' }}>twinth.ink</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { 'cache-control': 'public, max-age=600' },
      ...(font ? { fonts: [{ name: 'Cormorant', data: font, style: 'italic' as const, weight: 500 as const }] } : {}),
    }
  );
}
