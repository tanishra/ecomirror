'use client';

import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-4 p-8 text-center"
          style={{ background: 'var(--background)', color: 'var(--foreground)' }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--red-surface)' }}>
            <svg className="w-8 h-8" style={{ color: '#d93025' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold">Something went wrong</h2>
          <p className="text-sm max-w-md" style={{ color: 'var(--foreground-muted)' }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary mt-2"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
