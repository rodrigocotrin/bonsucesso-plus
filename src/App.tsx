import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { MockDatabaseProvider } from './contexts/MockDatabaseContext';
import { SessionProvider, useSession } from './contexts/SessionContext';
import { ToastProvider } from './contexts/ToastContext';
import { LoginPage, PrivateRoute } from './features/auth';
import {
  GuardianAttendancePage,
  GuardianNoticesPage,
  GuardianPerformancePage,
  GuardianSummaryPage,
} from './features/guardian';
import {
  StudentClassesPage,
  StudentDashboardPage,
  StudentEventsPage,
  StudentMaterialsPage,
  StudentPerformancePage,
} from './features/student';
import { AppShellLayout } from './layouts/AppShellLayout';
import { BaseLayout } from './layouts/BaseLayout';
import { ROLE_NAVIGATION_MENUS } from './layouts/navigationConfig';
import { DesignSystemPage } from './pages/DesignSystemPage';
import { MyDataPage } from './pages/MyDataPage';
import { RoleRoutePlaceholder } from './pages/RoleRoutePlaceholder';
import { SettingsPage } from './pages/SettingsPage';
import { UserRole } from './types';
import { getDefaultRouteForRole } from './utils/formatters';

/**
 * Redireciona a rota raiz "/" para o painel do usuário autenticado ou para "/login"
 */
const RootRedirect: React.FC = () => {
  const { isAuthenticated, currentAccount } = useSession();
  if (!isAuthenticated || !currentAccount) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={getDefaultRouteForRole(currentAccount.role)} replace />;
};

const REMAINING_PLACEHOLDER_ROLES: UserRole[] = ['teacher', 'coordinator'];

export const App: React.FC = () => {
  return (
    <AccessibilityProvider>
      <MockDatabaseProvider>
        <SessionProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                {/* Rota Pública: Login e Recuperação de Senha */}
                <Route path="/login" element={<LoginPage />} />

                {/* Rota de Validação Visual do Design System (Etapa 1) */}
                <Route
                  path="/design-system"
                  element={
                    <BaseLayout>
                      <DesignSystemPage />
                    </BaseLayout>
                  }
                />

                {/* =========================================================
                    ROTAS DO PERFIL ALUNO (Etapa 3 — Implementação Completa)
                   ========================================================= */}
                <Route
                  path="/aluno"
                  element={
                    <PrivateRoute allowedRoles={['student']}>
                      <AppShellLayout>
                        <StudentDashboardPage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/aluno/aulas"
                  element={
                    <PrivateRoute allowedRoles={['student']}>
                      <AppShellLayout>
                        <StudentClassesPage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/aluno/materias"
                  element={
                    <PrivateRoute allowedRoles={['student']}>
                      <AppShellLayout>
                        <StudentMaterialsPage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/aluno/eventos"
                  element={
                    <PrivateRoute allowedRoles={['student']}>
                      <AppShellLayout>
                        <StudentEventsPage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/aluno/desempenho"
                  element={
                    <PrivateRoute allowedRoles={['student']}>
                      <AppShellLayout>
                        <StudentPerformancePage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/aluno/perfil"
                  element={
                    <PrivateRoute allowedRoles={['student']}>
                      <AppShellLayout>
                        <MyDataPage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/aluno/configuracoes"
                  element={
                    <PrivateRoute allowedRoles={['student']}>
                      <AppShellLayout>
                        <SettingsPage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />

                {/* =========================================================
                    ROTAS DO PERFIL RESPONSÁVEL (Etapa 4 — Implementação Completa)
                   ========================================================= */}
                <Route
                  path="/responsavel"
                  element={
                    <PrivateRoute allowedRoles={['guardian']}>
                      <AppShellLayout>
                        <GuardianSummaryPage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/responsavel/frequencia"
                  element={
                    <PrivateRoute allowedRoles={['guardian']}>
                      <AppShellLayout>
                        <GuardianAttendancePage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/responsavel/simulados"
                  element={
                    <PrivateRoute allowedRoles={['guardian']}>
                      <AppShellLayout>
                        <GuardianPerformancePage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/responsavel/calendario"
                  element={
                    <PrivateRoute allowedRoles={['guardian']}>
                      <AppShellLayout>
                        <GuardianNoticesPage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/responsavel/perfil"
                  element={
                    <PrivateRoute allowedRoles={['guardian']}>
                      <AppShellLayout>
                        <MyDataPage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/responsavel/configuracoes"
                  element={
                    <PrivateRoute allowedRoles={['guardian']}>
                      <AppShellLayout>
                        <SettingsPage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />

                {/* =========================================================
                    ROTAS DOS DEMAIS PERFIS (Intactas como Placeholders, exceto Meus Dados e Configurações)
                   ========================================================= */}
                {REMAINING_PLACEHOLDER_ROLES.flatMap((role) =>
                  ROLE_NAVIGATION_MENUS[role].map((item) => {
                    const isProfileRoute = item.path.endsWith('/perfil');
                    const isSettingsRoute = item.path.endsWith('/configuracoes');

                    return (
                      <Route
                        key={item.id}
                        path={item.path}
                        element={
                          <PrivateRoute allowedRoles={[role]}>
                            <AppShellLayout>
                              {isProfileRoute ? (
                                <MyDataPage />
                              ) : isSettingsRoute ? (
                                <SettingsPage />
                              ) : (
                                <RoleRoutePlaceholder
                                  title={item.label}
                                  description={item.description}
                                  sectionCode={item.id.toUpperCase()}
                                />
                              )}
                            </AppShellLayout>
                          </PrivateRoute>
                        }
                      />
                    );
                  })
                )}

                {/* Redirecionamento padrão */}
                <Route path="/" element={<RootRedirect />} />
                <Route path="*" element={<RootRedirect />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </SessionProvider>
      </MockDatabaseProvider>
    </AccessibilityProvider>
  );
};

export default App;
