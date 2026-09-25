import { redirect } from 'next/navigation';

// The Canvas now lives at the root; keep old links working.
export default function CanvasRedirect() {
  redirect('/');
}
