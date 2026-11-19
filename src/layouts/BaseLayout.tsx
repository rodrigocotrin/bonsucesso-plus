import React from 'react';
import { BookHeart, HeartHandshake } from 'lucide-react';

export interface BaseLayoutProps {
  children: React.ReactNode;
}

/**
 * Shell Base do IntegraCurso com cabeçalho institucional limpo e rodapé comunitário.
 * Os controles de Tema e Tamanho da Fonte ficarão concentrados na aba de Configurações do Perfil do usuário.
 */
export const BaseLayout: React.FC<BaseLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Link de salto para acessibilidade via teclado */}
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-primary-700 focus:px-4 focus:py-2.5 focus:text-white focus:font-bold"
      >
        Ir direto para o conteúdo principal
      </a>

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-700 text-white shadow-xs dark:bg-primary-600"
              aria-hidden="true"
            >
              <BookHeart className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-primary-900 dark:text-primary-200">
                IntegraCurso
              </span>
              <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                Cursinho Popular Comunitário — Preparatório ENEM
              </p>
            </div>
          </div>
        </div>
      </header>

      <main id="conteudo-principal" className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 text-sm text-slate-600 dark:text-slate-300 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 font-medium">
            <HeartHandshake className="h-5 w-5 text-primary-700 dark:text-primary-400 shrink-0" aria-hidden="true" />
            <span>IntegraCurso — Educação popular, gratuita e acolhedora para a nossa comunidade.</span>
          </div>
          <span>Acessibilidade WCAG 2.1 AA • Linguagem Cidadã</span>
        </div>
      </footer>
    </div>
  );
};
