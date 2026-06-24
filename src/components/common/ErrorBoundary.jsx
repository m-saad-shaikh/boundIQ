import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 glass rounded-3xl border border-red-500/20 my-8">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-white/40 text-sm max-w-md mb-8">
            The analysis module encountered an unexpected error. Don't worry, your data is safe.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary px-8 py-3 text-sm flex items-center gap-2"
          >
            <RotateCcw size={16} />
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
