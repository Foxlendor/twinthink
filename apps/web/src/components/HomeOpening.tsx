'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type Props = {
  /** No one has been here on this device before: the film plays first, then the words. */
  firstVisit: boolean;
  headline: 'mission' | 'canon';
  /** The class that sets Literata, for the headline variant. */
  literata: string;
};

const SEEN = 'twinthink_intro_seen';
/** The film is about five seconds; the words never wait longer than this. */
const FILM_MAX_MS = 6500;

/**
 * The front page as one motion: on a first visit the ink film plays alone, and
 * as it ends the words arrive. Anyone who has been here before gets the words
 * at once. A tap, a key, or a film that cannot play all bring the words early.
 */
export default function HomeOpening({ firstVisit, headline, literata }: Props) {
  const [shown, setShown] = useState(!firstVisit);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!firstVisit) return;
    // remembered for a year, so the film is an opening, not a gate
    try {
      document.cookie = `${SEEN}=1; max-age=31536000; path=/; SameSite=Lax`;
    } catch {
      // optional
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setShown(true);
    const t = window.setTimeout(() => setShown(true), FILM_MAX_MS);
    const onKey = () => setShown(true);
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [firstVisit]);

  const reveal = () => setShown(true);

  return (
    <main className="tt-home" data-shown={shown ? 'yes' : 'no'} onPointerDown={shown ? undefined : reveal}>
      {/* his ink film, behind the words */}
      <div className="tt-home-film" aria-hidden>
        <video
          ref={video}
          className="brand-ink-video"
          src="/brand_ink_reveal.mp4"
          poster="/brand_ink_reveal_poster.jpg"
          autoPlay
          muted
          playsInline
          onEnded={reveal}
          onError={reveal}
          onStalled={reveal}
        />
      </div>
      <div className="tt-home-card" aria-hidden={!shown}>
        {headline === 'canon' ? (
          <>
            <h1 className={`tt-home-headline ${literata}`}>A living canon of everything you dare to create.</h1>
            <p className="tt-home-mission tt-home-mission-small">Every idea, finished or not, with where it came from and what it led to.</p>
          </>
        ) : (
          <p className="tt-home-mission">
            Preserving what humanity creates, not just what succeeds. Every idea, finished or not, with where it came from and what it led to.
          </p>
        )}
        {/* one way in, plain: scroll and you are falling */}
        <Link href="/slate" className="tt-home-fall" tabIndex={shown ? 0 : -1}>
          fall in
          <span className="tt-home-fall-cue" aria-hidden />
        </Link>
        <p className="tt-home-aside">
          <Link href="/slate#view=map" tabIndex={shown ? 0 : -1}>or see everything at once</Link>
        </p>
        <p className="tt-home-support">
          <Link href="/support" tabIndex={shown ? 0 : -1}>help keep it here</Link>
        </p>
      </div>
    </main>
  );
}
