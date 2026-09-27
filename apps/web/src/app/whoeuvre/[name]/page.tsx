import { redirect } from 'next/navigation';
import { AUTHOR } from '@/lib/shadowfield/sources/author';

// A Whoeuvre: what one person has left behind. Its place is on the Slate:
// his is the Slate itself; anyone else's is their ring in "from everyone".
export default async function Whoeuvre({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const who = decodeURIComponent(name).trim().toLowerCase();
  if (who === AUTHOR.name) redirect('/slate');
  redirect(`/slate?who=${encodeURIComponent(who.slice(0, 60))}`);
}
