import { redirect } from 'next/navigation';
import { AUTHOR } from '@/lib/shadowfield/sources/author';

// The HEX (Human EXperience) Lab, inside his Whoeuvre.
export default async function HexLab({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  redirect(decodeURIComponent(name).trim().toLowerCase() === AUTHOR.name ? '/slate?at=hex-lab' : '/slate');
}
