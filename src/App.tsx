import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { MockDatabaseProvider } from './contexts/MockDatabaseContext';
import { SessionProvider, useSession } from './contexts/SessionContext';
import { ToastProvider } from './contexts/ToastContext';
import { LoginPage, PrivateRoute } from './features/auth';
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
import { RoleRoutePlaceholder } from './pages/RoleRoutePlaceholder';
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

const OTHER_ROLES: UserRole[] = ['guardian', 'teacher', 'coordinator'];

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
                        <RoleRoutePlaceholder
                          title="Meus Dados e Preferências"
                          description="Seus dados cadastrais, tamanho da letra e modo de exibição."
                          sectionCode="STD-PROFILE"
                        />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />

                {/* =========================================================
                    ROTAS DOS DEMAIS PERFIS (Intactas como Placeholders)
                   ========================================================= */}
                {OTHER_ROLES.flatMap((role) =>
                  ROLE_NAVIGATION_MENUS[role].map((item) => (
                    <Route
                      key={item.id}
                      path={item.path}
                      element={
                        <PrivateRoute allowedRoles={[role]}>
                          <AppShellLayout>
                            <RoleRoutePlaceholder
                              title={item.label}
                              description={item.description}
                              sectionCode={item.id.toUpperCase()}
                            />
                          </AppShellLayout>
                        </PrivateRoute>
                      }
                    />
                  ))
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
