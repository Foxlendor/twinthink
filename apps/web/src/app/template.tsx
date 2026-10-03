import React from 'react';

// The home page is the Canvas; page-to-page transitions are no longer needed.
export default function RootTemplate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
