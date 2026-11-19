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

const CHUNK_RELOAD_KEY = 'bonsucesso_chunk_reload_ts';

function isChunkLoadError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('failed to fetch dynamically imported module') ||
    lower.includes('importing a module script failed') ||
    lower.includes('loading chunk')
  );
}

/**
 * ErrorBoundary Global — recuperação graciosa com auto-reload em atualização de deploy na Vercel.
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

  componentDidCatch(error: Error) {
    const msg = error?.message || '';
    if (isChunkLoadError(msg) && typeof window !== 'undefined') {
      try {
        const lastReload = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || '0');
        const now = Date.now();
        if (now - lastReload > 10000) {
          sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
          window.location.reload();
        }
      } catch {
        window.location.reload();
      }
    }
  }

  handleRetry = () => {
    const msg = this.state.errorMessage || '';
    if (isChunkLoadError(msg) && typeof window !== 'undefined') {
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, errorMessage: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] w-full items-center justify-center bg-paper p-6 text-ink">
          <Card className="w-full max-w-md">
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-critical-bg text-critical">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-ink">
                  Nova versão disponível
                </h2>
                <p className="break-words text-xs text-ink-muted">
                  Atualize a página para carregar a versão mais recente da plataforma.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<RotateCcw className="h-4 w-4" />}
                onClick={this.handleRetry}
              >
                Atualizar página
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
