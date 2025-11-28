'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ErrorBoundaryActions } from './ErrorBoundaryActions';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

/**
 * Error Boundary Component
 * Catches React errors and prevents the entire app from crashing
 * Shows a friendly error message with recovery options
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    this.setState({ errorInfo });

    // Call optional error handler (for logging to external services)
    this.props.onError?.(error, errorInfo);

    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, { contexts: { react: errorInfo } });
    // }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
          <div className='max-w-md w-full bg-white rounded-xl shadow-lg p-8'>
            {/* Icon */}
            <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <AlertTriangle className='w-8 h-8 text-red-600' />
            </div>

            {/* Title */}
            <h1 className='text-2xl font-bold text-gray-900 mb-2 text-center'>
              Oops! Something went wrong
            </h1>

            {/* Description */}
            <p className='text-gray-600 mb-6 text-center'>
              Don&apos;t worry, your data is safe. Try refreshing the page or go
              back to the dashboard.
            </p>

            {/* Error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className='mb-6 p-4 bg-gray-100 rounded-lg'>
                <p className='text-xs font-semibold text-gray-700 mb-2'>
                  Error Details (Development Only):
                </p>
                <p className='text-xs font-mono text-gray-700 whitespace-pre-wrap mb-2'>
                  {this.state.error.message}
                </p>
                {this.state.errorInfo && (
                  <details className='mt-2'>
                    <summary className='text-xs text-gray-600 cursor-pointer hover:text-gray-800'>
                      View component stack
                    </summary>
                    <pre className='text-xs text-gray-600 mt-2 overflow-auto max-h-40 p-2 bg-gray-50 rounded'>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Actions */}
            <ErrorBoundaryActions onReset={this.handleReset} />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Convenience wrapper for card-specific sections
 * Use this to wrap card-related pages/components for better error isolation
 */
export function CardErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={error => {
        console.error('[Card Section Error]:', error);
        // TODO: Log to analytics or error tracking
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Convenience wrapper for dashboard sections
 */
export function DashboardErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={error => {
        console.error('[Dashboard Error]:', error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
