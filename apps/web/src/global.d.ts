import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
  namespace React.JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}
