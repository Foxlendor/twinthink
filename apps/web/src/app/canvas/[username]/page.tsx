'use client';

import type { Metadata } from 'next';
import { Cormorant_Garamond } from 'next/font/google';
import ShadowField from '@/components/shadowfield/ShadowField';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400', '500'],
  variable: '--font-serif',
  display: 'swap',
});

export default function UserCanvasPage() {
  const params = useParams();
  const username = params.username as string;
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.user && data.user.owner === username) {
          setIsOwner(true);
        }
      });
  }, [username]);

  return (
    <main className={serif.variable}>
      <ShadowField
        serif={serif.style.fontFamily}
        username={username}
        showPrivate={isOwner}
      />
    </main>
  );
}
