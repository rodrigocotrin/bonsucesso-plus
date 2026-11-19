import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BrandLockup } from '../components/ui';

export interface BaseLayoutProps {
  children: React.ReactNode;
}

/**
 * Shell Base do Bonsucesso+ para páginas de documentação/catálogo (`/design-system`).
 */
export const BaseLayout: React.FC<BaseLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Ir direto para o conteúdo principal
      </a>

      <header className="sticky top-0 z-40 border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/">
            <BrandLockup subtitle="Design System • Bauhaus Suíço (Regra 90/10)" />
          </Link>

          <Link
            to="/"
            className="inline-flex h-10 items-center gap-2 rounded border border-line bg-surface px-3 text-xs font-semibold text-ink hover:border-ink hover:bg-subtle"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Voltar ao AppShell</span>
          </Link>
        </div>
      </header>

      <main
        id="conteudo-principal"
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8"
      >
        {children}
      </main>

      <footer className="border-t border-line bg-surface py-4">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-xs text-ink-muted sm:flex-row sm:px-6 lg:px-8">
          <span>Bonsucesso+ — Plataforma de Gestão Acadêmica e Comunitária</span>
          <span className="num">Plus Jakarta Sans + JetBrains Mono • Grid 8px • WCAG AA/AAA</span>
        </div>
      </footer>
    </div>
  );
};
