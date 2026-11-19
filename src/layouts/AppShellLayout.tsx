import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronRight,
  ExternalLink,
  LogOut,
  Menu,
  Monitor,
  Moon,
  MoreHorizontal,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  UserCircle,
  X,
} from 'lucide-react';
import {
  Badge,
  BrandLoader,
  BrandLockup,
  Button,
  CommandPalette,
  CommandPaletteNavEntry,
  ConfirmDialog,
  SlideOverDrawer,
} from '../components/ui';
import { useTheme } from '../contexts/AccessibilityContext';
import { useSession } from '../contexts/SessionContext';
import { useMockDatabase } from '../contexts/MockDatabaseContext';
import { useToast } from '../contexts/ToastContext';
import { DURATIONS, EASINGS, SPRINGS, VARIANTS } from '../lib/motion';
import { getDisplayName, getLegalName, hasSocialName } from '../lib/person';
import {
  resolveActiveNavMenuItem,
  ROLE_NAVIGATION_MENUS,
} from './navigationConfig';
import { UserRole } from '../types';
import {
  calculateSimpleEnemAverage,
  cn,
  formatDateBR,
  formatEnemScore,
  getDefaultRouteForRole,
  getInitials,
  getRoleDisplayLabel,
} from '../utils/formatters';

export interface AppShellLayoutProps {
  children: React.ReactNode;
}

const PROTOTYPE_ROLE_SWITCHER: Array<{
  role: UserRole;
  shortLabel: string;
}> = [
  { role: 'coordinator', shortLabel: 'Coordenador' },
  { role: 'teacher', shortLabel: 'Professor' },
  { role: 'student', shortLabel: 'Aluno' },
  { role: 'guardian', shortLabel: 'Responsável' },
];

function getProfileSettingsPaths(role: UserRole): { profile: string; settings: string } {
  switch (role) {
    case 'coordinator':
      return { profile: '/coordenacao/perfil', settings: '/coordenacao/configuracoes' };
    case 'teacher':
      return { profile: '/professor/perfil', settings: '/professor/configuracoes' };
    case 'student':
      return { profile: '/aluno/perfil', settings: '/aluno/configuracoes' };
    case 'guardian':
      return { profile: '/responsavel/perfil', settings: '/responsavel/configuracoes' };
  }
}

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
  const { db, resetDemoData, getStudentAttendancePercentage } = useMockDatabase();
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isProfilePopoverOpen, setIsProfilePopoverOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  // Slide-over Drawer Rápido de Aluno (acionado pelo Command Palette Ctrl+K)
  const [quickDrawerStudentId, setQuickDrawerStudentId] = useState<string | null>(null);
  const [quickDrawerTab, setQuickDrawerTab] = useState<string>('resumo');

  // Atalho global Ctrl+K / Cmd+K
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (!isSwitchingRole) return;
    const timer = window.setTimeout(() => setIsSwitchingRole(false), 180);
    return () => window.clearTimeout(timer);
  }, [isSwitchingRole]);

  if (!currentAccount || !currentPerson) {
    return <>{children}</>;
  }

  const role = currentAccount.role;
  const menuItems = ROLE_NAVIGATION_MENUS[role];
  // Bottom Navigation Bar Mobile (4 a 5 itens principais do perfil)
  const mobileBottomItems = menuItems.slice(0, 5);
  const activeMenuItem = resolveActiveNavMenuItem(menuItems, location.pathname);
  const activeSubTab = activeMenuItem?.subTabs?.find((t) => t.path === location.pathname);
  const accountPaths = getProfileSettingsPaths(role);
  const displayName = getDisplayName(currentPerson);

  const handlePrototypeRoleSwitch = (newRole: UserRole) => {
    if (newRole === role) return;
    setIsSwitchingRole(true);
    const result = quickLoginAsRole(newRole);
    if (result.success && result.role) {
      navigate(getDefaultRouteForRole(result.role));
    }
  };

  const handleConfirmLogout = () => {
    setIsLogoutDialogOpen(false);
    logout();
    showToast({
      variant: 'info',
      title: 'Sessão encerrada',
    });
    navigate('/login', { replace: true });
  };

  const handleConfirmResetData = () => {
    setIsResetDialogOpen(false);
    resetDemoData();
    showToast({
      variant: 'success',
      title: 'Base de demonstração restaurada',
    });
  };

  // Entradas de navegação permitidas ao perfil ativo para o Command Palette (RBAC)
  const commandNavEntries = useMemo<CommandPaletteNavEntry[]>(() => {
    const list: CommandPaletteNavEntry[] = [];
    for (const item of menuItems) {
      list.push({
        id: item.id,
        label: item.label,
        sublabel: item.description,
        path: item.path,
      });
      if (item.subTabs) {
        for (const tab of item.subTabs) {
          list.push({
            id: `${item.id}-${tab.id}`,
            label: `${item.label} → ${tab.label}`,
            sublabel: item.description,
            path: tab.path,
          });
        }
      }
    }
    list.push(
      {
        id: 'account-profile',
        label: 'Meus Dados',
        sublabel: 'Informações cadastrais e nome social',
        path: accountPaths.profile,
      },
      {
        id: 'account-settings',
        label: 'Configurações & Aparência',
        sublabel: 'Tema Claro/Escuro e escala tipográfica',
        path: accountPaths.settings,
      }
    );
    return list;
  }, [menuItems, accountPaths]);

  const studentPersons = useMemo(
    () => db.persons.filter((p) => p.id.startsWith('per-est-')),
    [db.persons]
  );

  // Dados do aluno selecionado no Quick SlideOverDrawer
  const quickDrawerData = useMemo(() => {
    if (!quickDrawerStudentId) return null;
    const person = db.persons.find((p) => p.id === quickDrawerStudentId);
    if (!person) return null;
    const enrollment = db.enrollments.find((e) => e.studentPersonId === person.id);
    const classRoom = db.classRooms.find((c) => c.id === enrollment?.classRoomId);
    const attendancePct = getStudentAttendancePercentage(person.id);
    const grades = db.grades.filter((g) => g.studentPersonId === person.id);
    const enemAvg = calculateSimpleEnemAverage(grades);
    return {
      person,
      enrollment,
      classRoom,
      attendancePct,
      grades,
      enemAvg,
    };
  }, [
    quickDrawerStudentId,
    db.persons,
    db.enrollments,
    db.classRooms,
    db.grades,
    getStudentAttendancePercentage,
  ]);

  // Contexto do aluno ativo para o Perfil Responsável (Requisito 6)
  const guardianStudentContext = useMemo(() => {
    if (role !== 'guardian' || !selectedStudentForGuardian) return null;
    const enrollment = db.enrollments.find(
      (e) => e.studentPersonId === selectedStudentForGuardian.id && e.status === 'ativa'
    );
    const classRoom = db.classRooms.find((c) => c.id === enrollment?.classRoomId);
    const responsibility = db.responsibilities.find(
      (r) =>
        r.guardianPersonId === currentPerson.id &&
        r.studentPersonId === selectedStudentForGuardian.id
    );
    return {
      student: selectedStudentForGuardian,
      displayName: getDisplayName(selectedStudentForGuardian),
      enrollmentCode: enrollment?.enrollmentCode ?? 'BS-2026',
      classRoomName: classRoom?.name ?? 'Turma Esperança',
      shift: classRoom?.shift ?? 'Noite',
      roomLabel: classRoom?.roomLabel ?? 'Sala 1',
      relationship: responsibility?.relationship ?? 'Responsável',
    };
  }, [
    role,
    selectedStudentForGuardian,
    db.enrollments,
    db.classRooms,
    db.responsibilities,
    currentPerson.id,
  ]);

  return (
    <div className="flex min-h-[100dvh] w-full max-w-full flex-col overflow-x-clip bg-paper text-ink lg:flex-row">
      <a
        href="#conteudo-principal-app"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-cta focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-cta-fg"
      >
        Ir para o conteúdo principal
      </a>

      {/* =====================================================================
          SIDEBAR DESKTOP (Âncora Espacial Imóvel + Indicador Deslizante layoutId)
         ===================================================================== */}
      <aside
        aria-label="Navegação principal"
        className={cn(
          'no-print hidden lg:sticky lg:top-0 lg:flex lg:h-[100dvh] lg:shrink-0 lg:flex-col border-r border-line bg-surface',
          isSidebarCollapsed ? 'lg:w-16' : 'lg:w-60'
        )}
      >
        {/* Topo: Logo Bonsucesso+ / Cursinho Comunitário */}
        <div
          className={cn(
            'flex h-14 items-center border-b border-line px-4',
            isSidebarCollapsed ? 'justify-center px-2' : 'justify-between gap-2'
          )}
        >
          <Link
            to={getDefaultRouteForRole(role)}
            title="Bonsucesso+ — Cursinho Comunitário"
            className="min-w-0"
          >
            <BrandLockup
              collapsed={isSidebarCollapsed}
              subtitle="Cursinho Comunitário"
            />
          </Link>

          {!isSidebarCollapsed && (
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(true)}
              aria-label="Recolher menu lateral"
              title="Recolher menu lateral"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-muted transition-all duration-150 ease-out hover:bg-subtle hover:text-ink active:scale-95"
            >
              <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {isSidebarCollapsed && (
          <div className="flex justify-center border-b border-line py-2">
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(false)}
              aria-label="Expandir menu lateral"
              title="Expandir menu lateral"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-all duration-150 ease-out hover:bg-subtle hover:text-ink active:scale-95"
            >
              <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Meio: Módulos com Indicador Deslizante (layoutId="sidebar-active-indicator") */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <nav aria-label="Módulos do perfil" className="space-y-1">
            {menuItems.map((item) => {
              const isItemActive = activeMenuItem?.id === item.id;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  aria-current={isItemActive ? 'page' : undefined}
                  title={item.label}
                  className={cn(
                    'relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors duration-150 active:scale-[0.99]',
                    isItemActive
                      ? 'font-semibold text-ink'
                      : 'font-medium text-ink-muted hover:bg-subtle hover:text-ink',
                    isSidebarCollapsed && 'justify-center px-0'
                  )}
                >
                  {isItemActive && (
                    <>
                      <motion.span
                        layoutId="sidebar-active-surface"
                        transition={SPRINGS.indicator}
                        className="absolute inset-0 rounded-md bg-track"
                        aria-hidden="true"
                      />
                      <motion.span
                        layoutId="sidebar-active-indicator"
                        transition={SPRINGS.indicator}
                        className={cn(
                          'absolute inset-y-1.5 left-0 z-10 w-[3px] rounded-r',
                          item.accentBarClass ?? 'bg-ink'
                        )}
                        aria-hidden="true"
                      />
                    </>
                  )}
                  <span
                    className={cn(
                      'relative z-10 shrink-0',
                      isItemActive ? 'text-ink' : 'text-ink-muted'
                    )}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  {!isSidebarCollapsed && (
                    <span className="relative z-10 flex-1 truncate">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Rodapé: Bloco Discreto de Perfil + Popover Animado */}
        <div className="relative shrink-0 border-t border-line p-3">
          <AnimatePresence>
            {isProfilePopoverOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsProfilePopoverOpen(false)}
                  aria-hidden="true"
                />
                <motion.div
                  key="profile-popover"
                  variants={VARIANTS.popover}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  role="menu"
                  aria-label="Opções da conta e ferramentas"
                  className="absolute bottom-16 left-3 right-3 z-40 rounded-lg border border-line bg-surface p-1.5 shadow-sm"
                >
                  <Link
                    to={accountPaths.profile}
                    role="menuitem"
                    onClick={() => setIsProfilePopoverOpen(false)}
                    className="flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-ink transition-colors duration-150 hover:bg-subtle"
                  >
                    <UserCircle className="h-4 w-4 text-ink-muted" aria-hidden="true" />
                    <span>Meus Dados</span>
                  </Link>
                  <Link
                    to={accountPaths.settings}
                    role="menuitem"
                    onClick={() => setIsProfilePopoverOpen(false)}
                    className="flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-ink transition-colors duration-150 hover:bg-subtle"
                  >
                    <Settings className="h-4 w-4 text-ink-muted" aria-hidden="true" />
                    <span>Configurações &amp; Aparência</span>
                  </Link>

                  <div className="my-1 border-t border-line" />

                  <div className="px-2 py-1.5">
                    <span className="mb-1.5 block text-[11px] font-medium text-ink-muted">
                      Aparência
                    </span>
                    <div
                      role="group"
                      aria-label="Alternar tema"
                      className="grid grid-cols-3 gap-0.5 rounded-md bg-track p-0.5"
                    >
                      {(
                        [
                          { id: 'light', label: 'Claro', icon: <Sun className="h-3.5 w-3.5" /> },
                          { id: 'dark', label: 'Escuro', icon: <Moon className="h-3.5 w-3.5" /> },
                          { id: 'system', label: 'Auto', icon: <Monitor className="h-3.5 w-3.5" /> },
                        ] as const
                      ).map((opt) => {
                        const isActive = theme === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setTheme(opt.id)}
                            aria-pressed={isActive}
                            className={cn(
                              'relative flex h-7 items-center justify-center gap-1 rounded text-[11px] transition-colors duration-150',
                              isActive
                                ? 'bg-surface font-semibold text-ink shadow-xs'
                                : 'font-medium text-ink-muted hover:text-ink'
                            )}
                          >
                            {opt.icon}
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="my-1 border-t border-line" />

                  <Link
                    to="/design-system"
                    role="menuitem"
                    onClick={() => setIsProfilePopoverOpen(false)}
                    className="flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-ink-muted transition-colors duration-150 hover:bg-subtle hover:text-ink"
                  >
                    <Palette className="h-4 w-4" aria-hidden="true" />
                    <span>Catálogo Design System</span>
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsProfilePopoverOpen(false);
                      setIsResetDialogOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-medium text-ink-muted transition-colors duration-150 hover:bg-subtle hover:text-ink"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    <span>Restaurar Dados Demo</span>
                  </button>

                  <div className="my-1 border-t border-line" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsProfilePopoverOpen(false);
                      setIsLogoutDialogOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-medium text-critical transition-colors duration-150 hover:bg-critical-bg"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    <span>Sair da Conta</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <div
            className={cn(
              'flex items-center gap-2.5 rounded-md p-1.5 transition-colors duration-150 hover:bg-subtle',
              isSidebarCollapsed ? 'justify-center' : 'justify-between'
            )}
          >
            <button
              type="button"
              onClick={() => setIsProfilePopoverOpen((v) => !v)}
              aria-expanded={isProfilePopoverOpen}
              aria-label="Abrir menu do perfil"
              title="Abrir menu do perfil"
              className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
            >
              <span
                className="font-mono flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-track text-xs font-semibold text-ink"
                aria-hidden="true"
              >
                {getInitials(displayName)}
              </span>
              {!isSidebarCollapsed && (
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-ink">
                    {displayName}
                  </span>
                  <span className="block truncate text-[11px] text-ink-muted">
                    {getRoleDisplayLabel(role)}
                  </span>
                </span>
              )}
            </button>

            {!isSidebarCollapsed && (
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setIsProfilePopoverOpen((v) => !v)}
                  title="Opções e ferramentas"
                  aria-label="Opções e ferramentas"
                  className="inline-flex h-7 w-7 items-center justify-center rounded text-ink-muted transition-all duration-150 ease-out hover:bg-track hover:text-ink active:scale-95"
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogoutDialogOpen(true)}
                  title="Sair da conta"
                  aria-label="Sair da conta"
                  className="inline-flex h-7 w-7 items-center justify-center rounded text-ink-muted transition-all duration-150 ease-out hover:bg-critical-bg hover:text-critical active:scale-95"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* =====================================================================
          COLUNA PRINCIPAL: TOPBAR + BARRA DE CONTEXTO (RESPONSÁVEL) + MAIN
         ===================================================================== */}
      <div className="flex min-w-0 max-w-full flex-1 flex-col">
        {/* TOPBAR (h-14) */}
        <header className="no-print sticky top-0 z-30 w-full max-w-full border-b border-line bg-surface">
          <div className="flex h-14 w-full max-w-full items-center justify-between gap-2 px-4 sm:px-6">
            {/* Esquerda: Menu Mobile + Título Curto (< 768px) / Breadcrumb (>= 768px) */}
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(true)}
                aria-label="Abrir menu lateral"
                title="Abrir menu lateral"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-ink transition-all duration-150 ease-out hover:bg-subtle active:scale-[0.98] lg:hidden"
              >
                <Menu className="h-4 w-4" aria-hidden="true" />
              </button>

              {/* Mobile (< 768px): Título curto da página atual sem breadcrumb longo */}
              <span className="truncate text-sm font-semibold text-ink md:hidden">
                {activeSubTab?.label ?? activeMenuItem?.label ?? 'Bonsucesso+'}
              </span>

              {/* Desktop/Tablet (>= 768px): Breadcrumb completo */}
              <nav aria-label="Breadcrumb" className="hidden min-w-0 md:block">
                <ol className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <li className="truncate">
                    <Link
                      to={getDefaultRouteForRole(role)}
                      className="transition-colors duration-150 hover:text-ink"
                    >
                      {getRoleDisplayLabel(role)}
                    </Link>
                  </li>
                  <li aria-hidden="true">
                    <ChevronRight className="h-3.5 w-3.5 text-ink-muted/60" />
                  </li>
                  <li className="truncate">
                    <Link
                      to={activeMenuItem?.path ?? getDefaultRouteForRole(role)}
                      className={cn(
                        'transition-colors duration-150',
                        activeSubTab
                          ? 'text-ink-muted hover:text-ink'
                          : 'font-medium text-ink'
                      )}
                    >
                      {activeMenuItem?.label ?? 'Painel'}
                    </Link>
                  </li>
                  {activeSubTab && (
                    <>
                      <li aria-hidden="true">
                        <ChevronRight className="h-3.5 w-3.5 text-ink-muted/60" />
                      </li>
                      <li aria-current="page" className="truncate font-medium text-ink">
                        {activeSubTab.label}
                      </li>
                    </>
                  )}
                </ol>
              </nav>
            </div>

            {/* Direita: Gatilho Command Palette (Ctrl+K) + Seletor de Perfil */}
            <div className="flex shrink-0 items-center gap-2">
              {/* Gatilho Desktop (>= 768px) Command Palette */}
              <button
                type="button"
                onClick={() => setIsCommandPaletteOpen(true)}
                aria-label="Abrir busca rápida e comandos (Ctrl+K)"
                title="Busca rápida e comandos (Ctrl+K / ⌘K)"
                className="hidden md:inline-flex h-9 w-52 items-center justify-between gap-2 rounded-md border border-line bg-search px-3 text-xs text-ink-muted transition-colors duration-150 hover:border-ink/40 hover:text-ink xl:w-64"
              >
                <span className="flex items-center gap-2 truncate">
                  <Search className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">Buscar aluno, turma...</span>
                </span>
                <kbd className="num shrink-0 rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
                  Ctrl K
                </kbd>
              </button>

              {/* Gatilho Mobile (< 768px): Botão de Lupa 40px x 40px */}
              <button
                type="button"
                onClick={() => setIsCommandPaletteOpen(true)}
                aria-label="Abrir busca rápida (Ctrl+K)"
                title="Abrir busca rápida"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-line bg-search text-ink transition-colors duration-150 hover:bg-subtle md:hidden"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
              </button>

              {/* Seletor de Perfil: Dropdown compacto no Mobile/Tablet (< 1024px) e Segmented Control no Desktop */}
              <div
                role="group"
                aria-label="Alternar perfil"
                className="flex shrink-0 items-center rounded-md bg-track p-0.5"
              >
                <div className="hidden lg:flex items-center gap-0.5">
                  {PROTOTYPE_ROLE_SWITCHER.map((opt) => {
                    const isCurrent = role === opt.role;
                    return (
                      <button
                        key={opt.role}
                        type="button"
                        onClick={() => handlePrototypeRoleSwitch(opt.role)}
                        aria-pressed={isCurrent}
                        className={cn(
                          'relative h-7 rounded px-2.5 text-xs transition-colors duration-150 active:scale-[0.98]',
                          isCurrent
                            ? 'font-semibold text-ink'
                            : 'font-medium text-ink-muted hover:text-ink'
                        )}
                      >
                        {isCurrent && (
                          <motion.span
                            layoutId="topbar-role-switcher-pill"
                            transition={SPRINGS.indicator}
                            className="absolute inset-0 rounded bg-surface shadow-xs"
                            aria-hidden="true"
                          />
                        )}
                        <span className="relative z-10">{opt.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>

                <select
                  aria-label="Alternar perfil"
                  value={role}
                  onChange={(e) => handlePrototypeRoleSwitch(e.target.value as UserRole)}
                  className="h-9 max-w-[122px] truncate rounded bg-surface px-2 text-xs font-medium text-ink lg:hidden"
                >
                  {PROTOTYPE_ROLE_SWITCHER.map((opt) => (
                    <option key={opt.role} value={opt.role}>
                      {opt.shortLabel}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* TABS HORIZONTAIS COM SUBLINHADO DESLIZANTE (layoutId) — scroll confinado ao trilho */}
          {activeMenuItem?.subTabs && activeMenuItem.subTabs.length > 0 && (
            <div className="w-full max-w-full border-t border-line bg-surface px-4 sm:px-6">
              <div
                role="tablist"
                aria-label={`Abas de ${activeMenuItem.label}`}
                className="no-scrollbar mx-auto flex w-full max-w-7xl items-center gap-5 overflow-x-auto"
              >
                {activeMenuItem.subTabs.map((tab) => {
                  const isTabActive = location.pathname === tab.path;
                  return (
                    <Link
                      key={tab.id}
                      to={tab.path}
                      role="tab"
                      aria-selected={isTabActive}
                      className={cn(
                        'relative inline-flex h-10 shrink-0 items-center text-sm transition-colors duration-150',
                        isTabActive
                          ? 'font-semibold text-ink'
                          : 'font-medium text-ink-muted hover:text-ink'
                      )}
                    >
                      <span>{tab.label}</span>
                      {isTabActive && (
                        <motion.span
                          layoutId={`topbar-subtab-indicator-${activeMenuItem.id}`}
                          transition={SPRINGS.indicator}
                          className="absolute inset-x-0 bottom-0 h-0.5 bg-ink"
                          aria-hidden="true"
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* =================================================================
              6. BARRA FIXA DE PROTEÇÃO DE CONTEXTO PARA O PERFIL RESPONSÁVEL
             ================================================================= */}
          {role === 'guardian' && guardianStudentContext && (
            <div
              role="region"
              aria-label="Contexto do estudante acompanhado"
              className="w-full max-w-full border-t border-line bg-subtle px-4 py-2 sm:px-6"
            >
              <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-progress-bg text-progress">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-ink-muted">Acompanhando:</span>
                    <strong className="truncate font-semibold text-ink">
                      {guardianStudentContext.displayName}
                    </strong>
                    <span className="text-ink-muted">•</span>
                    <span className="truncate font-medium text-ink">
                      {guardianStudentContext.classRoomName}
                    </span>
                    <span className="hidden sm:inline text-ink-muted">
                      ({guardianStudentContext.shift} • {guardianStudentContext.roomLabel})
                    </span>
                  </div>
                </div>

                {linkedStudentsForGuardian.length > 0 && (
                  <div className="flex min-w-0 items-center gap-2">
                    <label
                      htmlFor="guardian-context-student-select"
                      className="shrink-0 text-xs font-medium text-ink-muted"
                    >
                      Alternar:
                    </label>
                    <select
                      id="guardian-context-student-select"
                      value={selectedStudentForGuardian?.id ?? ''}
                      onChange={(e) => setSelectedStudentIdForGuardian(e.target.value)}
                      className="h-8 min-w-0 flex-1 sm:flex-initial sm:max-w-[240px] truncate rounded-md border border-line bg-surface px-2.5 text-xs font-semibold text-ink transition-colors duration-150 focus:border-ink"
                    >
                      {linkedStudentsForGuardian.map((student) => {
                        const enr = db.enrollments.find(
                          (item) => item.studentPersonId === student.id
                        );
                        const cls = db.classRooms.find((c) => c.id === enr?.classRoomId);
                        return (
                          <option key={student.id} value={student.id}>
                            {getDisplayName(student)} — {cls?.name ?? 'Turma Esperança'}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
        </header>

        {/* CONTEÚDO PRINCIPAL COM TRANSIÇÃO ULTRA-RÁPIDA (160ms/180ms) + BrandLoader */}
        <main
          id="conteudo-principal-app"
          className="mx-auto w-full max-w-7xl min-w-0 flex-1 overflow-x-clip px-4 pt-5 pb-24 sm:px-6 md:pb-8 lg:px-8"
        >
          {isSwitchingRole ? (
            <BrandLoader variant="fullscreen" label="Alternando perfil..." />
          ) : (
            <Suspense fallback={<BrandLoader variant="fullscreen" label="Carregando dados..." />}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${location.pathname}-${
                    role === 'guardian' ? selectedStudentForGuardian?.id ?? '' : ''
                  }`}
                  className="min-w-0 w-full max-w-full"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { duration: DURATIONS.overlay, ease: EASINGS.snappy },
                  }}
                  exit={{
                    opacity: 0,
                    transition: { duration: DURATIONS.pageExit, ease: EASINGS.snappy },
                  }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </Suspense>
          )}
        </main>
      </div>

      {/* =====================================================================
          1. COMMAND PALETTE GLOBAL (Ctrl+K / Cmd+K)
         ===================================================================== */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        role={role}
        navEntries={commandNavEntries}
        students={studentPersons}
        enrollments={db.enrollments}
        classRooms={db.classRooms}
        subjects={db.subjects}
        linkedStudentsForGuardian={linkedStudentsForGuardian}
        resolvedTheme={resolvedTheme}
        onToggleTheme={toggleTheme}
        onNavigate={(path) => navigate(path)}
        onSelectStudent={(studentId) => {
          setQuickDrawerTab('resumo');
          setQuickDrawerStudentId(studentId);
        }}
        onSelectGuardianStudent={(studentId) => {
          setSelectedStudentIdForGuardian(studentId);
        }}
      />

      {/* =====================================================================
          SLIDE-OVER DRAWER RÁPIDO DO ALUNO (Acionado pelo Command Palette)
         ===================================================================== */}
      <SlideOverDrawer
        isOpen={Boolean(quickDrawerData)}
        onClose={() => setQuickDrawerStudentId(null)}
        eyebrow={
          quickDrawerData?.enrollment
            ? `Matrícula ${quickDrawerData.enrollment.enrollmentCode}`
            : 'Ficha do Estudante'
        }
        title={quickDrawerData ? getDisplayName(quickDrawerData.person) : 'Estudante'}
        subtitle={quickDrawerData?.classRoom?.name ?? 'Turma Esperança • Noite'}
        headerBadge={
          quickDrawerData ? (
            <Badge
              variant={quickDrawerData.attendancePct < 75 ? 'critical' : 'progress'}
            >
              Frequência {quickDrawerData.attendancePct}%
            </Badge>
          ) : undefined
        }
        tabs={
          role === 'coordinator'
            ? [
                { id: 'resumo', label: 'Resumo Acadêmico' },
                {
                  id: 'notas',
                  label: 'Simulados ENEM',
                  badgeCount: quickDrawerData?.grades.length ?? 0,
                },
                { id: 'dados', label: 'Dados Pessoais' },
              ]
            : [
                { id: 'resumo', label: 'Resumo Acadêmico' },
                {
                  id: 'notas',
                  label: 'Simulados ENEM',
                  badgeCount: quickDrawerData?.grades.length ?? 0,
                },
              ]
        }
        activeTabId={quickDrawerTab}
        onTabChange={setQuickDrawerTab}
        footer={
          quickDrawerData ? (
            <>
              <Button variant="secondary" onClick={() => setQuickDrawerStudentId(null)}>
                Fechar
              </Button>
              {role === 'coordinator' && (
                <Button
                  variant="primary"
                  rightIcon={<ExternalLink className="h-4 w-4" />}
                  onClick={() => {
                    const id = quickDrawerData.person.id;
                    setQuickDrawerStudentId(null);
                    navigate(`/coordenacao/alunos?studentId=${id}`);
                  }}
                >
                  Abrir Ficha Completa
                </Button>
              )}
            </>
          ) : undefined
        }
      >
        {quickDrawerData && (
          <div className="space-y-4">
            {quickDrawerTab === 'resumo' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 rounded-md bg-subtle p-4">
                  <div>
                    <span className="eyebrow">Frequência Acumulada</span>
                    <p className="num mt-1 text-2xl font-semibold text-ink">
                      {quickDrawerData.attendancePct}%
                    </p>
                  </div>
                  <div>
                    <span className="eyebrow">Média Geral ENEM</span>
                    <p className="num mt-1 text-2xl font-semibold text-ink">
                      {quickDrawerData.enemAvg > 0
                        ? formatEnemScore(quickDrawerData.enemAvg)
                        : '—'}
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-line text-xs">
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-ink-muted">Turma</span>
                    <span className="font-medium text-ink">
                      {quickDrawerData.classRoom?.name ?? 'Turma Esperança'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-ink-muted">E-mail</span>
                    <span className="font-medium text-ink">
                      {quickDrawerData.person.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-ink-muted">Telefone</span>
                    <span className="num font-medium text-ink">
                      {quickDrawerData.person.phone}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {quickDrawerTab === 'notas' && (
              <div className="divide-y divide-line">
                {quickDrawerData.grades.length > 0 ? (
                  quickDrawerData.grades.map((grade) => {
                    const assessment = db.assessments.find(
                      (a) => a.id === grade.assessmentId
                    );
                    return (
                      <div
                        key={grade.id}
                        className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-ink">
                            {assessment?.title ?? 'Simulado ENEM'}
                          </p>
                          <p className="num text-xs text-ink-muted">
                            {formatDateBR(grade.recordedAt)}
                          </p>
                        </div>
                        <span className="num text-base font-semibold text-ink">
                          {grade.score} pts
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="py-4 text-xs text-ink-muted">
                    Nenhuma avaliação registrada até o momento.
                  </p>
                )}
              </div>
            )}

            {quickDrawerTab === 'dados' && role === 'coordinator' && (
              <div className="divide-y divide-line text-xs">
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-ink-muted">Nome de Exibição / Social</span>
                  <span className="font-semibold text-ink">
                    {getDisplayName(quickDrawerData.person)}
                  </span>
                </div>
                {hasSocialName(quickDrawerData.person) && (
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-ink-muted">Nome Civil (Registro)</span>
                    <span className="text-ink-muted">
                      {getLegalName(quickDrawerData.person)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-ink-muted">CPF</span>
                  <span className="num font-medium text-ink">
                    {quickDrawerData.person.cpf}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-ink-muted">Data de Nascimento</span>
                  <span className="num font-medium text-ink">
                    {formatDateBR(quickDrawerData.person.birthDate)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </SlideOverDrawer>

      {/* DRAWER MOBILE COM ANIMAÇÃO GPU-ONLY */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <motion.div
            key="mobile-drawer-backdrop"
            variants={VARIANTS.backdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            className="no-print fixed inset-0 z-50 flex overflow-hidden bg-backdrop backdrop-blur-[2px] lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsMobileDrawerOpen(false);
            }}
          >
            <motion.div
              key="mobile-drawer-panel"
              variants={VARIANTS.mobileDrawerLeft}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative flex w-full max-w-xs flex-col border-r border-line bg-surface"
            >
              <div className="flex h-14 items-center justify-between border-b border-line px-4">
                <BrandLockup subtitle="Cursinho Comunitário" />
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  aria-label="Fechar menu"
                  title="Fechar menu"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-muted transition-all duration-150 ease-out hover:bg-subtle active:scale-95"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {menuItems.map((item) => {
                  const isItemActive = activeMenuItem?.id === item.id;
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className={cn(
                        'flex min-h-[44px] items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors duration-150',
                        isItemActive
                          ? 'bg-track font-semibold text-ink'
                          : 'font-medium text-ink-muted hover:bg-subtle hover:text-ink'
                      )}
                    >
                      <span aria-hidden="true">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                <div className="my-2 border-t border-line pt-2 space-y-1">
                  <Link
                    to={accountPaths.profile}
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="flex min-h-[44px] items-center gap-3 rounded-md px-3 py-2 text-xs font-medium text-ink-muted transition-colors duration-150 hover:bg-subtle hover:text-ink"
                  >
                    <UserCircle className="h-4 w-4" aria-hidden="true" />
                    <span>Meus Dados</span>
                  </Link>
                  <Link
                    to={accountPaths.settings}
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="flex min-h-[44px] items-center gap-3 rounded-md px-3 py-2 text-xs font-medium text-ink-muted transition-colors duration-150 hover:bg-subtle hover:text-ink"
                  >
                    <Settings className="h-4 w-4" aria-hidden="true" />
                    <span>Configurações &amp; Aparência</span>
                  </Link>
                  <Link
                    to="/design-system"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="flex min-h-[44px] items-center gap-3 rounded-md px-3 py-2 text-xs font-medium text-ink-muted transition-colors duration-150 hover:bg-subtle hover:text-ink"
                  >
                    <Palette className="h-4 w-4" aria-hidden="true" />
                    <span>Catálogo Design System</span>
                  </Link>
                </div>
              </nav>

              <div className="flex items-center justify-between gap-2 border-t border-line p-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="font-mono flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-track text-xs font-semibold text-ink">
                    {getInitials(displayName)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-ink">{displayName}</p>
                    <p className="truncate text-[11px] text-ink-muted">{getRoleDisplayLabel(role)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    setIsLogoutDialogOpen(true);
                  }}
                  aria-label="Sair da conta"
                  title="Sair da conta"
                  className="inline-flex h-10 items-center gap-1 rounded-md px-2.5 text-xs font-medium text-critical transition-colors duration-150 hover:bg-critical-bg"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Sair</span>
                </button>
              </div>
            </motion.div>

            <div
              className="flex-1"
              onClick={() => setIsMobileDrawerOpen(false)}
              aria-hidden="true"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================================
          3. BOTTOM NAVIGATION BAR MOBILE (h-16, pb-safe, 4–5 itens principais,
             alvos de toque >= 44px e indicador ativo na cor semântica)
         ===================================================================== */}
      <nav
        aria-label="Navegação rápida mobile"
        className="no-print fixed inset-x-0 bottom-0 z-30 h-16 border-t border-line bg-surface pb-safe lg:hidden"
      >
        <div
          className={cn(
            'grid h-full gap-1 px-2',
            mobileBottomItems.length === 4 ? 'grid-cols-4' : 'grid-cols-5'
          )}
        >
          {mobileBottomItems.map((item) => {
            const isItemActive = activeMenuItem?.id === item.id;
            return (
              <Link
                key={item.id}
                to={item.path}
                aria-current={isItemActive ? 'page' : undefined}
                className={cn(
                  'relative flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] transition-colors duration-150 active:scale-95',
                  isItemActive
                    ? 'font-semibold text-ink'
                    : 'font-medium text-ink-muted hover:bg-subtle'
                )}
              >
                {isItemActive && (
                  <>
                    <motion.span
                      layoutId="mobile-bottom-active-pill"
                      transition={SPRINGS.indicator}
                      className="absolute inset-x-1 inset-y-1.5 rounded-md bg-track"
                      aria-hidden="true"
                    />
                    <motion.span
                      layoutId="mobile-bottom-semantic-bar"
                      transition={SPRINGS.indicator}
                      className={cn(
                        'absolute inset-x-3 top-0 z-10 h-[3px] rounded-b',
                        item.accentBarClass ?? 'bg-ink'
                      )}
                      aria-hidden="true"
                    />
                  </>
                )}
                <span className="relative z-10" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="relative z-10 max-w-full truncate">
                  {item.shortMobileLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <ConfirmDialog
        isOpen={isLogoutDialogOpen}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Encerrar sessão?"
        description={`Você está conectado(a) como ${displayName}.`}
        confirmLabel="Sair"
        cancelLabel="Cancelar"
      />

      <ConfirmDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleConfirmResetData}
        variant="danger"
        title="Restaurar dados de demonstração?"
        description="Todos os registros alterados voltarão ao estado inicial do Cursinho Bonsucesso."
        confirmLabel="Restaurar"
        cancelLabel="Cancelar"
      />
    </div>
  );
};
