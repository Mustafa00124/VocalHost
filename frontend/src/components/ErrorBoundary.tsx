import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    console.error('🚨 ErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary error details:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '2px solid red',
          borderRadius: '5px',
          backgroundColor: '#ffe6e6',
          color: 'red'
        }}>
          <h2>🚨 Something went wrong!</h2>
          <p><strong>Error:</strong> {this.state.error?.message}</p>
          <details>
            <summary>Stack trace</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
