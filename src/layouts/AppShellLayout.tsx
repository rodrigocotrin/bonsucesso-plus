import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BookHeart,
  ChevronRight,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { ConfirmDialog } from '../components/ui';
import { useSession } from '../contexts/SessionContext';
import { useMockDatabase } from '../contexts/MockDatabaseContext';
import { useToast } from '../contexts/ToastContext';
import { ROLE_NAVIGATION_MENUS } from './navigationConfig';
import { UserRole } from '../types';
import {
  cn,
  getDefaultRouteForRole,
  getDisplayName,
  getRoleDisplayLabel,
} from '../utils/formatters';

export interface AppShellLayoutProps {
  children: React.ReactNode;
}

const ROLE_OPTIONS_FOR_PROTOTYPE: Array<{ role: UserRole; label: string }> = [
  { role: 'student', label: 'Aluno (Mariana)' },
  { role: 'guardian', label: 'Responsável (Dona Helena)' },
  { role: 'teacher', label: 'Professor (Prof. Carlos)' },
  { role: 'coordinator', label: 'Coordenadora (Ana Paula)' },
];

export const AppShellLayout: React.FC<AppShellLayoutProps> = ({ children }) => {
  const {
    currentAccount,
    currentPerson,
    quickLoginAsRole,
    logout,
    linkedStudentsForGuardian,
    selectedStudentForGuardian,
    setSelectedStudentIdForGuardian,
  } = useSession();
  const { resetDemoData } = useMockDatabase();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  if (!currentAccount || !currentPerson) {
    return <>{children}</>;
  }

  const role = currentAccount.role;
  const menuItems = ROLE_NAVIGATION_MENUS[role];
  const mobileBottomItems = menuItems.filter((item) => item.showInMobileBottomBar).slice(0, 4);
  const activeMenuItem =
    menuItems.find((item) => item.path === location.pathname) ?? menuItems[0];

  const handlePrototypeRoleSwitch = (newRole: UserRole) => {
    const result = quickLoginAsRole(newRole);
    if (result.success && result.role) {
      showToast({
        variant: 'info',
        title: `Modo Protótipo: Perfil alterado para ${getRoleDisplayLabel(result.role)}`,
        description: 'Navegando para o painel correspondente.',
      });
      navigate(getDefaultRouteForRole(result.role));
    }
  };

  const handleConfirmLogout = () => {
    setIsLogoutDialogOpen(false);
    logout();
    showToast({
      variant: 'info',
      title: 'Você saiu da sua conta com segurança',
      description: 'Até breve no Cursinho Comunitário Bonsucesso!',
    });
    navigate('/login', { replace: true });
  };

  const handleConfirmResetData = () => {
    setIsResetDialogOpen(false);
    resetDemoData();
    showToast({
      variant: 'success',
      title: 'Dados de demonstração restaurados!',
      description: 'Todos os registros voltaram ao estado inicial do Cursinho Bonsucesso.',
    });
  };

  const displayName = getDisplayName(currentPerson);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Link de salto para acessibilidade via teclado */}
      <a
        href="#conteudo-principal-app"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-primary-700 focus:px-4 focus:py-2.5 focus:text-white focus:font-bold"
      >
        Ir direto para o conteúdo principal
      </a>

      {/* SIDEBAR DESKTOP (Vertical Retrátil fixa na altura da tela) */}
      <aside
        aria-label="Menu principal de navegação"
        className={cn(
          'hidden lg:flex lg:flex-col lg:shrink-0 lg:sticky lg:top-0 lg:h-screen border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-all duration-200',
          isSidebarCollapsed ? 'lg:w-24' : 'lg:w-72'
        )}
      >
        {/* Identidade Institucional */}
        <div
          className={cn(
            'flex border-b border-slate-200 px-4 py-4 dark:border-slate-800',
            isSidebarCollapsed
              ? 'flex-col items-center gap-3 px-2'
              : 'items-center justify-between gap-2'
          )}
        >
          <Link
            to={getDefaultRouteForRole(role)}
            className={cn(
              'flex items-center gap-3',
              isSidebarCollapsed ? 'justify-center' : 'min-w-0'
            )}
            title="IntegraCurso — Educação que transforma"
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-700 text-white shadow-xs dark:bg-primary-600"
              aria-hidden="true"
            >
              <BookHeart className="h-6 w-6" />
            </div>
            {!isSidebarCollapsed && (
              <div className="truncate">
                <span className="block text-lg font-extrabold tracking-tight text-primary-900 dark:text-primary-200">
                  IntegraCurso
                </span>
                <span className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Educação que transforma
                </span>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            aria-expanded={!isSidebarCollapsed}
            title={isSidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
            )}
            <span className="sr-only">
              {isSidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            </span>
          </button>
        </div>

        {/* Cartão de Identificação do Usuário Logado */}
        <div className={cn('border-b border-slate-200 dark:border-slate-800', isSidebarCollapsed ? 'p-2' : 'p-4')}>
          <div
            className={cn(
              'rounded-xl bg-slate-100/80 dark:bg-slate-800/70',
              isSidebarCollapsed ? 'px-1.5 py-2.5 text-center' : 'p-3'
            )}
            title={`${displayName} — ${getRoleDisplayLabel(role)}`}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-primary-800 dark:text-primary-300 truncate">
              {isSidebarCollapsed
                ? role === 'student'
                  ? 'ALUNO'
                  : role === 'guardian'
                  ? 'RESP.'
                  : role === 'teacher'
                  ? 'PROF.'
                  : 'COORD.'
                : getRoleDisplayLabel(role)}
            </p>
            {!isSidebarCollapsed && (
              <>
                <p className="mt-0.5 text-base font-extrabold text-slate-900 dark:text-white truncate">
                  {displayName}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                  {currentPerson.email}
                </p>
              </>
            )}
          </div>

          {/* Se for Responsável com múltiplos filhos vinculados, permite alternar facilmente */}
          {role === 'guardian' && linkedStudentsForGuardian.length > 1 && !isSidebarCollapsed && (
            <div className="mt-3">
              <label
                htmlFor="sidebar-guardian-student-select"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                Acompanhando estudante:
              </label>
              <select
                id="sidebar-guardian-student-select"
                value={selectedStudentForGuardian?.id ?? ''}
                onChange={(e) => {
                  setSelectedStudentIdForGuardian(e.target.value);
                  showToast({
                    variant: 'info',
                    title: 'Estudante selecionado alterado',
                    description: 'Exibindo dados atualizados.',
                  });
                }}
                className="w-full min-h-[44px] rounded-xl border-2 border-primary-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-900 dark:border-primary-700 dark:bg-slate-900 dark:text-white"
              >
                {linkedStudentsForGuardian.map((student) => (
                  <option key={student.id} value={student.id}>
                    {getDisplayName(student)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Lista de Navegação por Perfil */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {menuItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === getDefaultRouteForRole(role)}
              className={({ isActive }) =>
                cn(
                  'flex min-h-[48px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-base font-semibold transition-colors',
                  isActive
                    ? 'bg-primary-700 text-white shadow-xs dark:bg-primary-600'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
                  isSidebarCollapsed && 'justify-center px-2'
                )
              }
              title={item.label}
            >
              <span className="shrink-0" aria-hidden="true">
                {item.icon}
              </span>
              {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
              {isSidebarCollapsed && <span className="sr-only">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Rodapé da Sidebar: Resetar Demo + Sair (sempre visível na base da viewport) */}
        <div className="border-t border-slate-200 p-3 space-y-2 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setIsResetDialogOpen(true)}
            title="Resetar dados de demonstração"
            className={cn(
              'flex w-full min-h-[44px] items-center gap-2.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors',
              isSidebarCollapsed && 'justify-center px-2'
            )}
          >
            <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
            {!isSidebarCollapsed && <span>Resetar dados demo</span>}
            {isSidebarCollapsed && <span className="sr-only">Resetar dados demo</span>}
          </button>

          <button
            type="button"
            onClick={() => setIsLogoutDialogOpen(true)}
            title="Sair da conta"
            className={cn(
              'flex w-full min-h-[44px] items-center gap-2.5 rounded-xl border border-danger-500/40 bg-danger-50 px-3.5 py-2 text-base font-bold text-danger-800 hover:bg-danger-100 dark:border-red-800 dark:bg-danger-900/30 dark:text-red-200 dark:hover:bg-danger-900/50 transition-colors',
              isSidebarCollapsed && 'justify-center px-2'
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
            {!isSidebarCollapsed && <span>Sair da Conta</span>}
            {isSidebarCollapsed && <span className="sr-only">Sair da Conta</span>}
          </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL + TOPBAR */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        {/* TOPBAR */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            {/* Esquerda Mobile: Botão Menu Hambúrguer + Logo */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(true)}
                className="lg:hidden inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
                <span>Menu</span>
              </button>

              {/* Breadcrumbs — Orientação Espacial (Heurística de Nielsen) */}
              <nav aria-label="Você está em (Breadcrumb)" className="flex items-center">
                <ol className="flex flex-wrap items-center gap-1.5 text-sm">
                  <li>
                    <Link
                      to={getDefaultRouteForRole(role)}
                      className="font-semibold text-slate-600 hover:text-primary-800 dark:text-slate-300 dark:hover:text-primary-300"
                    >
                      {getRoleDisplayLabel(role)}
                    </Link>
                  </li>
                  <li aria-hidden="true">
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </li>
                  <li aria-current="page" className="font-extrabold text-slate-900 dark:text-white">
                    {activeMenuItem?.label ?? 'Painel'}
                  </li>
                </ol>
              </nav>
            </div>

            {/* Direita Topbar: Seletor Rápido de Troca de Perfil (Protótipo) + Acessibilidade + Sair Mobile */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Seletor Rápido: Trocar Perfil (Modo Protótipo) */}
              <div className="flex items-center gap-1.5 rounded-xl border border-secondary-300 bg-secondary-50/80 px-2.5 py-1 dark:border-secondary-700 dark:bg-secondary-950/60">
                <Sparkles
                  className="h-4 w-4 text-secondary-700 dark:text-secondary-300 shrink-0"
                  aria-hidden="true"
                />
                <label
                  htmlFor="prototype-role-switcher"
                  className="text-xs font-bold text-secondary-900 dark:text-secondary-200 whitespace-nowrap"
                >
                  Trocar perfil (Protótipo):
                </label>
                <select
                  id="prototype-role-switcher"
                  value={role}
                  onChange={(e) => handlePrototypeRoleSwitch(e.target.value as UserRole)}
                  className="min-h-[36px] rounded-lg border border-secondary-300 bg-white px-2 py-1 text-xs font-bold text-slate-900 dark:border-secondary-700 dark:bg-slate-900 dark:text-white"
                >
                  {ROLE_OPTIONS_FOR_PROTOTYPE.map((opt) => (
                    <option key={opt.role} value={opt.role}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </header>

        {/* ÁREA DE PÁGINA INTERNA */}
        <main
          id="conteudo-principal-app"
          className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
        >
          {children}
        </main>
      </div>

      {/* DRAWER MOBILE (Menu Hambúrguer completo) */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex bg-slate-950/70 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
        >
          <div className="relative flex w-full max-w-xs flex-col bg-white dark:bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-700 text-white">
                  <BookHeart className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <span className="block text-base font-extrabold text-primary-900 dark:text-primary-200">
                    IntegraCurso
                  </span>
                  <span className="block text-xs text-slate-600 dark:text-slate-400">
                    Educação que transforma
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span>Fechar</span>
              </button>
            </div>

            <div className="border-b border-slate-200 p-4 dark:border-slate-800">
              <p className="text-xs font-bold uppercase text-primary-800 dark:text-primary-300">
                {getRoleDisplayLabel(role)}
              </p>
              <p className="text-base font-extrabold text-slate-900 dark:text-white">
                {displayName}
              </p>

              {role === 'guardian' && linkedStudentsForGuardian.length > 1 && (
                <div className="mt-3">
                  <label
                    htmlFor="mobile-guardian-student-select"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Acompanhando estudante:
                  </label>
                  <select
                    id="mobile-guardian-student-select"
                    value={selectedStudentForGuardian?.id ?? ''}
                    onChange={(e) => setSelectedStudentIdForGuardian(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border-2 border-primary-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-900 dark:border-primary-700 dark:bg-slate-900 dark:text-white"
                  >
                    {linkedStudentsForGuardian.map((student) => (
                      <option key={student.id} value={student.id}>
                        {getDisplayName(student)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {menuItems.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  end={item.path === getDefaultRouteForRole(role)}
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-[48px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-base font-semibold transition-colors',
                      isActive
                        ? 'bg-primary-700 text-white'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                    )
                  }
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="border-t border-slate-200 p-4 space-y-2 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  setIsResetDialogOpen(true);
                }}
                className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Resetar dados de demonstração</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  setIsLogoutDialogOpen(true);
                }}
                className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-danger-700 px-3 py-2 text-base font-bold text-white"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
                <span>Sair da Conta</span>
              </button>
            </div>
          </div>

          <div
            className="flex-1"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-hidden="true"
          />
        </div>
      )}

      {/* BARRA INFERIOR MOBILE (Atalhos principais do perfil — sempre com ícone + rótulo) */}
      <nav
        aria-label="Atalhos rápidos do perfil"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95"
      >
        <div className="grid grid-cols-5 gap-1 px-2 py-1.5">
          {mobileBottomItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === getDefaultRouteForRole(role)}
              className={({ isActive }) =>
                cn(
                  'flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-xs font-bold transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-800 dark:bg-primary-950 dark:text-primary-200'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                )
              }
            >
              <span aria-hidden="true">{item.icon}</span>
              <span className="truncate max-w-full">{item.shortMobileLabel}</span>
            </NavLink>
          ))}

          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Users className="h-5 w-5" aria-hidden="true" />
            <span>Mais</span>
          </button>
        </div>
      </nav>

      {/* ConfirmDialog para Sair da Conta */}
      <ConfirmDialog
        isOpen={isLogoutDialogOpen}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Deseja sair da sua conta agora?"
        description={`Você está conectado(a) como ${displayName} (${getRoleDisplayLabel(role)}).`}
        confirmLabel="Sim, sair da conta"
        cancelLabel="Continuar navegando"
      />

      {/* ConfirmDialog para Resetar Dados de Demonstração */}
      <ConfirmDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleConfirmResetData}
        variant="danger"
        title="Restaurar dados originais de demonstração?"
        description="Todas as chamadas, notas, matrículas ou itens de copa alterados durante os seus testes voltarão ao estado inicial do Cursinho Comunitário Bonsucesso."
        consequenceNote="Essa ação limpa o armazenamento local (localStorage) do protótipo para você recomeçar os testes do zero."
        confirmLabel="Sim, resetar dados"
        cancelLabel="Cancelar"
      />
    </div>
  );
};
