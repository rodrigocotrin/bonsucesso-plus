import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { MockDatabaseProvider } from './contexts/MockDatabaseContext';
import { SessionProvider, useSession } from './contexts/SessionContext';
import { ToastProvider } from './contexts/ToastContext';
import { LoginPage, PrivateRoute } from './features/auth';
import {
  CoordinatorCalendarPage,
  CoordinatorClassesPage,
  CoordinatorDashboardPage,
  CoordinatorEnrollmentsPage,
  CoordinatorGuardiansPage,
  CoordinatorSchedulePage,
  CoordinatorStudentsPage,
  CoordinatorSubjectsPage,
  CoordinatorTeachersPage,
} from './features/coordinator';
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
import {
  TeacherAssessmentsPage,
  TeacherAttendancePage,
  TeacherClassPerformancePage,
  TeacherDashboardPage,
  TeacherLessonsPage,
} from './features/teacher';
import { AppShellLayout } from './layouts/AppShellLayout';
import { BaseLayout } from './layouts/BaseLayout';
import { DesignSystemPage } from './pages/DesignSystemPage';
import { MyDataPage } from './pages/MyDataPage';
import { SettingsPage } from './pages/SettingsPage';
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
                    ROTAS DO PERFIL PROFESSOR VOLUNTÁRIO (Etapa 5 — Implementação Completa)
                   ========================================================= */}
                <Route
                  path="/professor"
                  element={
                    <PrivateRoute allowedRoles={['teacher']}>
                      <AppShellLayout>
                        <TeacherDashboardPage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/professor/aulas"
                  element={
                    <PrivateRoute allowedRoles={['teacher']}>
                      <AppShellLayout>
                        <TeacherLessonsPage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/professor/chamada"
                  element={
                    <PrivateRoute allowedRoles={['teacher']}>
                      <AppShellLayout>
                        <TeacherAttendancePage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/professor/avaliacoes"
                  element={
                    <PrivateRoute allowedRoles={['teacher']}>
                      <AppShellLayout>
                        <TeacherAssessmentsPage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/professor/desempenho"
                  element={
                    <PrivateRoute allowedRoles={['teacher']}>
                      <AppShellLayout>
                        <TeacherClassPerformancePage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/professor/perfil"
                  element={
                    <PrivateRoute allowedRoles={['teacher']}>
                      <AppShellLayout>
                        <MyDataPage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/professor/configuracoes"
                  element={
                    <PrivateRoute allowedRoles={['teacher']}>
                      <AppShellLayout>
                        <SettingsPage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />

                {/* =========================================================
                    ROTAS DO PERFIL COORDENADOR (Etapa 6 Partes 1 e 2 — 100% Completo)
                   ========================================================= */}
                <Route
                  path="/coordenacao"
                  element={
                    <PrivateRoute allowedRoles={['coordinator']}>
                      <AppShellLayout>
                        <CoordinatorDashboardPage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/coordenacao/alunos"
                  element={
                    <PrivateRoute allowedRoles={['coordinator']}>
                      <AppShellLayout>
                        <CoordinatorStudentsPage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/coordenacao/professores"
                  element={
                    <PrivateRoute allowedRoles={['coordinator']}>
                      <AppShellLayout>
                        <CoordinatorTeachersPage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/coordenacao/responsaveis"
                  element={
                    <PrivateRoute allowedRoles={['coordinator']}>
                      <AppShellLayout>
                        <CoordinatorGuardiansPage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/coordenacao/disciplinas"
                  element={
                    <PrivateRoute allowedRoles={['coordinator']}>
                      <AppShellLayout>
                        <CoordinatorSubjectsPage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/coordenacao/turmas"
                  element={
                    <PrivateRoute allowedRoles={['coordinator']}>
                      <AppShellLayout>
                        <CoordinatorClassesPage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/coordenacao/matriculas"
                  element={
                    <PrivateRoute allowedRoles={['coordinator']}>
                      <AppShellLayout>
                        <CoordinatorEnrollmentsPage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/coordenacao/grade-horaria"
                  element={
                    <PrivateRoute allowedRoles={['coordinator']}>
                      <AppShellLayout>
                        <CoordinatorSchedulePage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/coordenacao/calendario"
                  element={
                    <PrivateRoute allowedRoles={['coordinator']}>
                      <AppShellLayout>
                        <CoordinatorCalendarPage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/coordenacao/perfil"
                  element={
                    <PrivateRoute allowedRoles={['coordinator']}>
                      <AppShellLayout>
                        <MyDataPage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/coordenacao/configuracoes"
                  element={
                    <PrivateRoute allowedRoles={['coordinator']}>
                      <AppShellLayout>
                        <SettingsPage />
                      </AppShellLayout>
                    </PrivateRoute>
                  }
                />

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
