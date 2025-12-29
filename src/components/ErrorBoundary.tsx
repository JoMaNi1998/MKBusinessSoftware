import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Global Error Boundary Component
 *
 * Fängt unerwartete Fehler in der Component-Hierarchie ab
 * und zeigt eine benutzerfreundliche Fehlerseite an.
 *
 * Features:
 * - Freundliche Fehler-UI statt blank screen
 * - Entwicklermodus: Zeigt Fehlerdetails
 * - Produktionsmodus: Versteckt technische Details
 * - "Seite neu laden" und "Erneut versuchen" Buttons
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Save error info to state
    this.setState({ errorInfo });

    // Optional: Send to error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
    // Example: Firebase Analytics
    // logEvent(analytics, 'exception', {
    //   description: error.toString(),
    //   fatal: true,
    //   component: errorInfo.componentStack
    // });
  }

  handleReset = (): void => {
    // Reset error state and try to recover
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="text-red-500 text-6xl mb-4">⚠️</div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Etwas ist schiefgelaufen
            </h1>
            <p className="text-gray-600 mb-6">
              Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.
            </p>

            {/* Development Mode: Show Error Details */}
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left text-sm bg-gray-100 p-4 rounded mb-6 cursor-pointer">
                <summary className="font-medium text-gray-700 hover:text-gray-900">
                  🔍 Fehlerdetails (Development)
                </summary>

                {/* Error Message */}
                <div className="mt-3">
                  <p className="font-semibold text-gray-700 mb-1">Error:</p>
                  <pre className="overflow-auto bg-red-50 p-2 rounded text-red-700 text-xs">
                    {this.state.error?.toString()}
                  </pre>
                </div>

                {/* Component Stack */}
                {this.state.errorInfo?.componentStack && (
                  <div className="mt-3">
                    <p className="font-semibold text-gray-700 mb-1">Component Stack:</p>
                    <pre className="overflow-auto bg-gray-50 p-2 rounded text-gray-600 text-xs max-h-48">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Seite neu laden
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Erneut versuchen
              </button>
            </div>

            {/* Help Text */}
            <p className="mt-6 text-xs text-gray-500">
              Falls das Problem weiterhin besteht, kontaktieren Sie bitte den Support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
