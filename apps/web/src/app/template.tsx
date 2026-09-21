import React from 'react';
import TransitionScreen from '@/components/TransitionScreen';

export default function RootTemplate({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TransitionScreen />
      {children}
    </>
  );
}
