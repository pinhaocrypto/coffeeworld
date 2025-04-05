import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Log to console in development, could log to an error tracking service in production
    if (process.env.NODE_ENV !== 'production') {
      console.log("React Error Boundary caught an error:", error.message);
      console.log("Component Stack:", errorInfo.componentStack);
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default fallback UI
      return (
        <div className="p-4 bg-amber-100 border-l-4 border-amber-600 text-amber-800 rounded shadow-md">
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm">{this.state.error?.message || 'An unexpected error occurred'}</p>
          <button
            className="mt-3 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
