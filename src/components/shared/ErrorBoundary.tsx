import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button, Card } from '../ui';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage?: string;
}

/**
 * ErrorBoundary Global — recuperação graciosa com botão "Tentar novamente".
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Erro inesperado ao renderizar este módulo.',
    };
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] w-full items-center justify-center bg-paper p-6 text-ink">
          <Card className="max-w-md w-full">
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-critical-bg text-critical">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-ink">
                  Não foi possível carregar esta visualização
                </h2>
                <p className="text-xs text-ink-muted">
                  {this.state.errorMessage}
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<RotateCcw className="h-4 w-4" />}
                onClick={this.handleRetry}
              >
                Tentar novamente
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
