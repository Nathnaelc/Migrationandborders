'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ChartErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Chart Error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 border border-red-300 bg-red-50 rounded-lg text-center">
          <h3 className="text-lg font-medium text-red-800 mb-2">Chart couldn't be loaded</h3>
          <p className="text-red-700 mb-4">Please try refreshing the page.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChartErrorBoundary;