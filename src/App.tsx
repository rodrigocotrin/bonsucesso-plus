import React, { Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { BrandLoader } from './components/ui';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
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
import { UserRole } from './types';
import { getDefaultRouteForRole } from './utils/formatters';

const RootRedirect: React.FC = () => {
  const { isAuthenticated, currentAccount } = useSession();
  if (!isAuthenticated || !currentAccount) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={getDefaultRouteForRole(currentAccount.role)} replace />;
};

function withRoleShell(role: UserRole, element: React.ReactNode) {
  return (
    <PrivateRoute allowedRoles={[role]}>
      <AppShellLayout>{element}</AppShellLayout>
    </PrivateRoute>
  );
}

export const App: React.FC = () => {
  return (
    <MotionConfig reducedMotion="user">
      <AccessibilityProvider>
      <ErrorBoundary>
      <MockDatabaseProvider>
        <SessionProvider>
          <ToastProvider>
            <BrowserRouter>
              <Suspense
                fallback={<BrandLoader variant="fullscreen" label="Carregando módulo..." />}
              >
              <Routes>
                {/* Rotas Públicas Oficiais (Seção 4 do Contrato) */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/recuperar-senha" element={<LoginPage />} />

                {/* Catálogo do Design System Bonsucesso+ */}
                <Route
                  path="/design-system"
                  element={
                    <BaseLayout>
                      <DesignSystemPage />
                    </BaseLayout>
                  }
                />

                {/* =========================================================
                    PERFIL 1: COORDENADOR (Modo Alta Densidade Operacional)
                    Sidebar (5 itens): Painel | Pessoas | Acadêmico | Desempenho | Calendário
                   ========================================================= */}
                <Route
                  path="/coordenacao"
                  element={withRoleShell('coordinator', <CoordinatorDashboardPage />)}
                />
                <Route
                  path="/coordenacao/pessoas"
                  element={<Navigate to="/coordenacao/alunos" replace />}
                />
                <Route
                  path="/coordenacao/alunos"
                  element={withRoleShell('coordinator', <CoordinatorStudentsPage />)}
                />
                <Route
                  path="/coordenacao/professores"
                  element={withRoleShell('coordinator', <CoordinatorTeachersPage />)}
                />
                <Route
                  path="/coordenacao/responsaveis"
                  element={withRoleShell('coordinator', <CoordinatorGuardiansPage />)}
                />
                <Route
                  path="/coordenacao/academico"
                  element={<Navigate to="/coordenacao/turmas" replace />}
                />
                <Route
                  path="/coordenacao/turmas"
                  element={withRoleShell('coordinator', <CoordinatorClassesPage />)}
                />
                <Route
                  path="/coordenacao/matriculas"
                  element={withRoleShell('coordinator', <CoordinatorEnrollmentsPage />)}
                />
                <Route
                  path="/coordenacao/disciplinas"
                  element={withRoleShell('coordinator', <CoordinatorSubjectsPage />)}
                />
                <Route
                  path="/coordenacao/grade-horaria"
                  element={withRoleShell('coordinator', <CoordinatorSchedulePage />)}
                />
                <Route
                  path="/coordenacao/desempenho"
                  element={withRoleShell('coordinator', <CoordinatorDashboardPage />)}
                />
                <Route
                  path="/coordenacao/calendario"
                  element={withRoleShell('coordinator', <CoordinatorCalendarPage />)}
                />
                <Route
                  path="/coordenacao/perfil"
                  element={withRoleShell('coordinator', <MyDataPage />)}
                />
                <Route
                  path="/coordenacao/configuracoes"
                  element={withRoleShell('coordinator', <SettingsPage />)}
                />

                {/* =========================================================
                    PERFIL 2: PROFESSOR (Modo Alta Densidade Operacional)
                    Sidebar (5 itens): Minhas Aulas | Frequência | Avaliações | Desempenho | Calendário
                   ========================================================= */}
                <Route
                  path="/professor"
                  element={withRoleShell('teacher', <TeacherDashboardPage />)}
                />
                <Route
                  path="/professor/aulas"
                  element={withRoleShell('teacher', <TeacherLessonsPage />)}
                />
                <Route
                  path="/professor/chamada"
                  element={withRoleShell('teacher', <TeacherAttendancePage />)}
                />
                <Route
                  path="/professor/frequencia"
                  element={withRoleShell('teacher', <TeacherAttendancePage />)}
                />
                <Route
                  path="/professor/avaliacoes"
                  element={withRoleShell('teacher', <TeacherAssessmentsPage />)}
                />
                <Route
                  path="/professor/desempenho"
                  element={withRoleShell('teacher', <TeacherClassPerformancePage />)}
                />
                <Route
                  path="/professor/calendario"
                  element={withRoleShell('teacher', <StudentEventsPage />)}
                />
                <Route
                  path="/professor/perfil"
                  element={withRoleShell('teacher', <MyDataPage />)}
                />
                <Route
                  path="/professor/configuracoes"
                  element={withRoleShell('teacher', <SettingsPage />)}
                />

                {/* =========================================================
                    PERFIL 3: ALUNO (Modo Clareza & Motivação)
                    Sidebar (5 itens): Meu Desempenho | Minhas Aulas | Avaliações | Frequência | Calendário
                   ========================================================= */}
                <Route
                  path="/aluno"
                  element={withRoleShell('student', <StudentDashboardPage />)}
                />
                <Route
                  path="/aluno/desempenho"
                  element={withRoleShell('student', <StudentPerformancePage />)}
                />
                <Route
                  path="/aluno/aulas"
                  element={withRoleShell('student', <StudentClassesPage />)}
                />
                <Route
                  path="/aluno/materias"
                  element={withRoleShell('student', <StudentMaterialsPage />)}
                />
                <Route
                  path="/aluno/avaliacoes"
                  element={withRoleShell('student', <StudentPerformancePage />)}
                />
                <Route
                  path="/aluno/frequencia"
                  element={withRoleShell('student', <StudentPerformancePage />)}
                />
                <Route
                  path="/aluno/eventos"
                  element={withRoleShell('student', <StudentEventsPage />)}
                />
                <Route
                  path="/aluno/calendario"
                  element={withRoleShell('student', <StudentEventsPage />)}
                />
                <Route
                  path="/aluno/perfil"
                  element={withRoleShell('student', <MyDataPage />)}
                />
                <Route
                  path="/aluno/configuracoes"
                  element={withRoleShell('student', <SettingsPage />)}
                />

                {/* =========================================================
                    PERFIL 4: RESPONSAVEL (Modo Clareza & Acompanhamento)
                    Sidebar (4 itens): Acompanhamento | Frequência | Avaliações | Calendário
                   ========================================================= */}
                <Route
                  path="/responsavel"
                  element={withRoleShell('guardian', <GuardianSummaryPage />)}
                />
                <Route
                  path="/responsavel/frequencia"
                  element={withRoleShell('guardian', <GuardianAttendancePage />)}
                />
                <Route
                  path="/responsavel/simulados"
                  element={withRoleShell('guardian', <GuardianPerformancePage />)}
                />
                <Route
                  path="/responsavel/avaliacoes"
                  element={withRoleShell('guardian', <GuardianPerformancePage />)}
                />
                <Route
                  path="/responsavel/calendario"
                  element={withRoleShell('guardian', <GuardianNoticesPage />)}
                />
                <Route
                  path="/responsavel/perfil"
                  element={withRoleShell('guardian', <MyDataPage />)}
                />
                <Route
                  path="/responsavel/configuracoes"
                  element={withRoleShell('guardian', <SettingsPage />)}
                />

                {/* Redirecionamento padrão */}
                <Route path="/" element={<RootRedirect />} />
                <Route path="*" element={<RootRedirect />} />
              </Routes>
              </Suspense>
            </BrowserRouter>
          </ToastProvider>
        </SessionProvider>
      </MockDatabaseProvider>
      </ErrorBoundary>
    </AccessibilityProvider>
    </MotionConfig>
  );
};

export default App;
