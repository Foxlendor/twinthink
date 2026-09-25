'use client';

import ShadowField from '@/components/shadowfield/ShadowField';
import { buildRehearsalField } from '@/lib/shadowfield/sources/specimens';
import { rootNode } from '@/lib/shadowfield/world';

let cached: ReturnType<typeof rootNode> | null = null;
const factory = () => (cached ??= rootNode('rehearsal', buildRehearsalField()));

export default function RehearsalField({ serif }: { serif: string }) {
  return <ShadowField serif={serif} worldFactory={factory} rehearsal />;
}
