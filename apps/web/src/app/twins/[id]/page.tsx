import { TwinData } from '@/lib/types';
import TwinHeader from '@/components/TwinHeader';
import TwinHero from '@/components/TwinHero';
import TwinTabs from '@/components/TwinTabs';
import { notFound } from 'next/navigation';

export default async function TwinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // In a real app, this would be a database call or fetch to an external API
  // Here we're fetching from our mock API route
  // We need absolute URL for server-side fetching, or we can just mock it directly here
  // For simplicity and to avoid SSR fetch issues with absolute URLs in dev, we'll fetch from the route using a relative-like approach if possible, but actually let's just mock the response directly or use a full URL.
  // Wait, Next.js allows fetching full URLs. Since we don't know the port in advance safely (might be 3000, 3001), let's just import the GET handler or mock it directly.
  
  let twin: TwinData | null = null;
  
  try {
    const res = await fetch(`http://127.0.0.1:8001/api/twins/${id}`, { cache: 'no-store' });
    if (res.ok) {
      twin = await res.json();
    }
  } catch (err) {
    console.error("Failed to fetch twin:", err);
  }

  if (!twin) {
    notFound();
  }

  return (
    <main className="container" style={{ paddingBottom: '4rem' }}>
      <TwinHeader twin={twin} />
      <TwinHero twin={twin} />
      <TwinTabs twin={twin} />
    </main>
  );
}
