import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  CalendarCheck,
  Coffee,
  ExternalLink,
  GraduationCap,
  HeartHandshake,
  Layers,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  Badge,
  CalloutAlert,
  Card,
  MetricCard,
} from '../components/ui';
import { AccessibilityToolbar } from '../components/shared/AccessibilityToolbar';
import { useSession } from '../contexts/SessionContext';
import { useMockDatabase } from '../contexts/MockDatabaseContext';
import { ROLE_NAVIGATION_MENUS } from '../layouts/navigationConfig';
import {
  calculateSimpleEnemAverage,
  evaluateAttendanceStatus,
  getDefaultRouteForRole,
  getDisplayName,
  getRoleDisplayLabel,
} from '../utils/formatters';

export interface RoleRoutePlaceholderProps {
  title: string;
  description: string;
  sectionCode: string;
}

/**
 * Componente Placeholder limpo e contextualizado para cada rota protegida por perfil (Etapa 2).
 * Exibe os indicadores reais da Store Mockada Reativa do Cursinho Comunitário Bonsucesso
 * sem ainda implementar as telas internas detalhadas (reservadas para as próximas etapas).
 */
export const RoleRoutePlaceholder: React.FC<RoleRoutePlaceholderProps> = ({
  title,
  description,
  sectionCode,
}) => {
  const {
    currentAccount,
    currentPerson,
    selectedStudentForGuardian,
    linkedStudentsForGuardian,
  } = useSession();
  const { db, getStudentAttendancePercentage } = useMockDatabase();

  if (!currentAccount || !currentPerson) return null;

  const role = currentAccount.role;
  const menuItems = ROLE_NAVIGATION_MENUS[role];

  // Determina qual estudante exibir nas métricas de resumo quando for student ou guardian
  const targetStudent =
    role === 'student'
      ? currentPerson
      : role === 'guardian'
      ? selectedStudentForGuardian
      : null;

  const targetStudentAttendance = targetStudent
    ? getStudentAttendancePercentage(targetStudent.id)
    : 0;
  const targetAttendanceEval = evaluateAttendanceStatus(targetStudentAttendance);

  const targetStudentGrades = targetStudent
    ? db.grades.filter((g) => g.studentPersonId === targetStudent.id)
    : [];
  const targetStudentEnemAvg = calculateSimpleEnemAverage(targetStudentGrades);

  // Estatísticas globais da base mockada para validação da Etapa 2
  const totalStudents = db.enrollments.filter((e) => e.status === 'ativa').length;
  const totalTeachers = db.persons.filter((p) => p.id.startsWith('per-prof-')).length;
  const lowAttendanceStudentsCount = db.persons
    .filter((p) => p.id.startsWith('per-est-') && p.status === 'active')
    .filter((student) => getStudentAttendancePercentage(student.id) < 75).length;

  const isProfilePage = sectionCode.endsWith('-PROFILE');

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Rota Placeholder */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary" icon={<Sparkles className="h-4 w-4" />}>
              Etapa 2 • App Shell, RBAC & Store Reativa ({sectionCode})
            </Badge>
            <Badge variant="neutral">{getRoleDisplayLabel(role)}</Badge>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          <p className="mt-1 max-w-3xl text-base text-slate-600 dark:text-slate-300">
            {description}
          </p>
        </div>

        <Link
          to="/design-system"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <span>Ver Catálogo do Design System</span>
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {/* Preferências de Acessibilidade concentradas na aba de Perfil */}
      {isProfilePage && (
        <Card
          title="Preferências de Aparência e Acessibilidade"
          subtitle="Ajuste o tamanho da letra e o tema de cores conforme o seu conforto visual. Suas escolhas ficam salvas automaticamente."
        >
          <AccessibilityToolbar />
        </Card>
      )}

      {/* Se for Responsável, mostra aviso sobre a troca entre os filhos vinculados */}
      {role === 'guardian' && targetStudent && (
        <CalloutAlert
          variant={targetAttendanceEval.status === 'critical' ? 'warning' : 'info'}
          title={`Acompanhando atualmente: ${getDisplayName(targetStudent)}`}
        >
          {linkedStudentsForGuardian.length > 1 ? (
            <span>
              Você possui <strong>{linkedStudentsForGuardian.length} estudantes vinculados</strong> ao seu cadastro (
              {linkedStudentsForGuardian.map((s) => getDisplayName(s)).join(' e ')}). Use o seletor{' '}
              <strong>"Acompanhando estudante"</strong> no menu lateral para alternar entre eles e ver a frequência e notas atualizarem em tempo real!
            </span>
          ) : (
            <span>
              Visualizando os dados atualizados de presença e simulados ENEM de{' '}
              <strong>{getDisplayName(targetStudent)}</strong>.
            </span>
          )}
        </CalloutAlert>
      )}

      {/* Métricas Dinâmicas Conectadas à Store Mockada (src/contexts/MockDatabaseContext) */}
      {(role === 'student' || role === 'guardian') && targetStudent && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <MetricCard
            title={`Presença de ${getDisplayName(targetStudent).split(' ')[0]}`}
            value={targetStudentAttendance}
            scale="percentage"
            accentColor={targetAttendanceEval.status === 'critical' ? 'danger' : 'success'}
            icon={<CalendarCheck className="h-6 w-6" />}
            statusBadge={{
              label: targetAttendanceEval.label,
              variant: targetAttendanceEval.status === 'critical' ? 'danger' : 'success',
            }}
            subtitle={targetAttendanceEval.description}
          />

          <MetricCard
            title="Média Geral nos Simulados"
            value={targetStudentEnemAvg}
            scale="enem"
            accentColor="secondary"
            icon={<GraduationCap className="h-6 w-6" />}
            subtitle={`Calculada sobre ${targetStudentGrades.length} simulados realizados no 2º semestre de 2026.`}
          />

          <MetricCard
            title="Matérias com Google Sala de Aula"
            value={`${db.subjects.length} disciplinas`}
            scale="raw"
            accentColor="primary"
            icon={<BookOpen className="h-6 w-6" />}
            subtitle="Matemática, Redação, Português, História, Geografia, Física, Química e Biologia."
          />
        </div>
      )}

      {role === 'teacher' && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <MetricCard
            title="Minhas Turmas Vinculadas"
            value={`${
              db.classSubjects.filter((cs) => cs.teacherPersonId === currentPerson.id).length
            } turmas`}
            scale="raw"
            accentColor="primary"
            icon={<Layers className="h-6 w-6" />}
            subtitle="Turma Esperança • Noite e Turma A • Noite (2º semestre de 2026)."
          />

          <MetricCard
            title="Aulas Registradas no Semestre"
            value={`${
              db.lessons.filter((l) => l.teacherPersonId === currentPerson.id).length
            } aulas`}
            scale="raw"
            accentColor="secondary"
            icon={<CalendarCheck className="h-6 w-6" />}
            subtitle="Diário de classe sincronizado com o controle de frequência."
          />

          <MetricCard
            title="Simulados Gerais do Cursinho"
            value={`${db.assessments.length} simulados`}
            scale="raw"
            accentColor="success"
            icon={<GraduationCap className="h-6 w-6" />}
            subtitle="Escala oficial ENEM (0 a 1000 pontos)."
          />
        </div>
      )}

      {role === 'coordinator' && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Estudantes com Matrícula Ativa"
            value={`${totalStudents} alunos`}
            scale="raw"
            accentColor="primary"
            icon={<Users className="h-6 w-6" />}
            subtitle={`Distribuídos em ${db.classRooms.length} turmas (${totalTeachers} professores voluntários).`}
          />

          <MetricCard
            title="Alerta de Frequência (< 75%)"
            value={`${lowAttendanceStudentsCount} alunos`}
            scale="raw"
            accentColor="danger"
            icon={<CalendarCheck className="h-6 w-6" />}
            statusBadge={{ label: 'Atenção', variant: 'danger' }}
            subtitle="Estudantes abaixo de 75% de presença que precisam de acolhimento."
          />

          <MetricCard
            title="Itens da Copa / Merenda"
            value={`${db.pantryItems.length} itens`}
            scale="raw"
            accentColor="warning"
            icon={<Coffee className="h-6 w-6" />}
            subtitle={`${
              db.pantryItems.filter((i) => i.currentQuantity < i.minimumThreshold).length
            } itens com estoque abaixo do mínimo recomendado.`}
          />

          <MetricCard
            title="Doações Registradas Internamente"
            value={`${db.internalDonations.length} apoios`}
            scale="raw"
            accentColor="secondary"
            icon={<HeartHandshake className="h-6 w-6" />}
            subtitle="Controle interno da coordenação (sem perfil externo de doador)."
          />
        </div>
      )}

      {/* Mapa das Rotas do Perfil Atual */}
      <Card
        title={`Menu Exclusivo do Perfil: ${getRoleDisplayLabel(role)}`}
        subtitle="Estrutura de navegação protegida por RBAC pronta para receber as telas detalhadas nas próximas etapas."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className="group flex flex-col justify-between rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-4 transition-all hover:border-primary-600 hover:bg-white dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-primary-500 dark:hover:bg-slate-900"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300">
                    {item.icon}
                  </div>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {item.path}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-primary-800 dark:text-white dark:group-hover:text-primary-300">
                  {item.label}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-primary-800 dark:text-primary-300">
                <span>Abrir seção</span>
                <span aria-hidden="true">→</span>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      {/* Resumo dos Dados Mockados Carregados do Cursinho Comunitário Bonsucesso */}
      <Card
        title="Resumo da Base Mockada Reativa (Cursinho Comunitário Bonsucesso)"
        subtitle="Dados persistidos em localStorage e prontos para consumo pelas features de Aluno, Responsável, Professor e Coordenação."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 text-sm">
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Pessoas (Entidade Central)
            </span>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
              {db.persons.length} registros
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Turmas Ativas ({db.academicPeriods.find((p) => p.isCurrent)?.name})
            </span>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
              {db.classRooms.length} turmas
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Disciplinas ENEM
            </span>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
              {db.subjects.length} matérias
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Simulados Históricos
            </span>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
              {db.assessments.length} simulados
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Próximos Eventos
            </span>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
              {db.calendarEvents.length} agendados
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-primary-700 dark:text-primary-400" aria-hidden="true" />
            <span>
              Rota inicial do perfil atual: <strong>{getDefaultRouteForRole(role)}</strong>
            </span>
          </span>
          <span>
            Experimente tentar acessar na barra de endereço uma rota de outro perfil para validar o bloqueio e redirecionamento automático (RBAC).
          </span>
        </div>
      </Card>
    </div>
  );
};
