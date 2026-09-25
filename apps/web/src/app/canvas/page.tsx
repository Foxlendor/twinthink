import type { Metadata } from 'next';
import ShadowCanvas from '@/components/field/ShadowCanvas';

export const metadata: Metadata = {
  title: 'Canvas | TWINTH.INK',
  description: 'Move through ideas instead of scrolling past them. Scroll toward a Shadow to go inside the thought.',
};

export default function CanvasPage() {
  return <ShadowCanvas />;
}
