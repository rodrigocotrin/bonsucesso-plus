import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Calendar,
  ClipboardCheck,
  Clock,
  ExternalLink,
  GraduationCap,
  Layers,
  MapPin,
  Plus,
  Users,
} from 'lucide-react';
import {
  Badge,
  CalloutAlert,
  Card,
  MetricCard,
} from '../../components/ui';
import { useSession } from '../../contexts/SessionContext';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import {
  formatDateBR,
  getDisplayName,
} from '../../utils/formatters';

export const TeacherDashboardPage: React.FC = () => {
  const { currentPerson } = useSession();
  const { db } = useMockDatabase();

  if (!currentPerson) return null;

  const teacherName = getDisplayName(currentPerson);

  // Turmas/disciplinas atribuídas ao professor logado
  const teacherClassSubjects = useMemo(() => {
    const own = db.classSubjects.filter(
      (cs) => cs.teacherPersonId === currentPerson.id
    );
    return own.length > 0 ? own : db.classSubjects.slice(0, 2);
  }, [db.classSubjects, currentPerson.id]);

  // Cartões enriquecidos das turmas atribuídas (estilo SUAP limpo)
  const enrichedClassCards = useMemo(() => {
    return teacherClassSubjects.map((cs) => {
      const classRoom = db.classRooms.find((c) => c.id === cs.classRoomId);
      const subject = db.subjects.find((s) => s.id === cs.subjectId);
      const period = db.academicPeriods.find((p) => p.id === classRoom?.periodId);
      const activeStudentsCount = db.enrollments.filter(
        (e) => e.classRoomId === cs.classRoomId && e.status === 'ativa'
      ).length;
      const lessonsForPair = db.lessons.filter(
        (l) => l.classRoomId === cs.classRoomId && l.subjectId === cs.subjectId
      );

      return {
        classSubject: cs,
        classRoom,
        subject,
        periodName: period?.name ?? '2º semestre de 2026',
        activeStudentsCount,
        totalLessonsCount: lessonsForPair.length,
      };
    });
  }, [teacherClassSubjects, db.classRooms, db.subjects, db.academicPeriods, db.enrollments, db.lessons]);

  // Aulas do professor (ordenadas da mais recente/próxima para a mais antiga)
  const teacherLessons = useMemo(() => {
    return db.lessons
      .filter((l) => l.teacherPersonId === currentPerson.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [db.lessons, currentPerson.id]);

  // Identifica aulas com chamada pendente (agendadas ou com menos alunos marcados que os matriculados na turma)
  const pendingAttendanceLessons = useMemo(() => {
    return teacherLessons.filter((lesson) => {
      const enrolledStudents = db.enrollments.filter(
        (e) => e.classRoomId === lesson.classRoomId && e.status === 'ativa'
      );
      const recordedForLesson = db.attendances.filter(
        (a) => a.lessonId === lesson.id
      );
      return (
        lesson.status === 'agendada' ||
        recordedForLesson.length < enrolledStudents.length
      );
    });
  }, [teacherLessons, db.enrollments, db.attendances]);

  const primaryPendingLesson = pendingAttendanceLessons[0] ?? teacherLessons[0];

  return (
    <div className="space-y-8">
      {/* Cabeçalho Acolhedor e Ágil para o Professor Voluntário */}
      <section className="rounded-2xl border-2 border-primary-200 bg-gradient-to-br from-primary-50 via-white to-secondary-50/40 p-5 sm:p-6 dark:border-primary-800 dark:from-primary-950/70 dark:via-slate-900 dark:to-secondary-950/30">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary">Docência Voluntária • 2º semestre de 2026</Badge>
              <Badge variant="neutral">{enrichedClassCards.length} turmas atribuídas</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Olá, {teacherName}! Obrigado por transformar vidas.
            </h1>
            <p className="text-base text-slate-700 dark:text-slate-200 max-w-2xl">
              Preparamos atalhos rápidos para você registrar a chamada pelo celular ou computador em
              menos de 1 minuto e lançar notas em lote.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to={
                primaryPendingLesson
                  ? `/professor/chamada?lessonId=${primaryPendingLesson.id}`
                  : '/professor/chamada'
              }
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary-700 px-5 py-2.5 text-base font-extrabold text-white shadow-xs hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-500 transition-colors"
            >
              <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
              <span>Fazer chamada agora</span>
            </Link>

            <Link
              to="/professor/aulas?nova=1"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 text-base font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
              <span>Nova Aula</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Alerta Direto de Chamada Pendente com 1 Clique */}
      {primaryPendingLesson && (
        <CalloutAlert
          variant="warning"
          title={`Chamada pendente: ${primaryPendingLesson.topic} (${formatDateBR(
            primaryPendingLesson.date
          )})`}
          action={
            <Link
              to={`/professor/chamada?lessonId=${primaryPendingLesson.id}`}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 py-2 text-sm font-extrabold text-white hover:bg-primary-800 dark:bg-primary-600"
            >
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              <span>Fazer chamada agora</span>
            </Link>
          }
        >
          Você tem <strong>{pendingAttendanceLessons.length}</strong>{' '}
          {pendingAttendanceLessons.length === 1
            ? 'aula aguardando registro completo de presença'
            : 'aulas aguardando registro completo de presença'}
          . Use o botão ao lado para marcar todos como presentes em 1 clique e ajustar apenas quem
          faltou.
        </CalloutAlert>
      )}

      {/* KPIs Rápidos do Professor */}
      <section aria-label="Resumo rápido da sua semana docente">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            title="Aulas Registradas / Semana"
            value={`${teacherLessons.length} aulas`}
            scale="raw"
            accentColor="primary"
            icon={<BookOpen className="h-6 w-6" />}
            statusBadge={{ label: 'Plano de ensino', variant: 'primary' }}
            subtitle="Aulas ministradas e agendadas nas suas turmas."
          />

          <MetricCard
            title="Chamadas Pendentes"
            value={
              pendingAttendanceLessons.length === 0
                ? 'Em dia!'
                : `${pendingAttendanceLessons.length} ${
                    pendingAttendanceLessons.length === 1 ? 'pendente' : 'pendentes'
                  }`
            }
            scale="raw"
            accentColor={pendingAttendanceLessons.length > 0 ? 'warning' : 'success'}
            icon={<ClipboardCheck className="h-6 w-6" />}
            statusBadge={{
              label: pendingAttendanceLessons.length > 0 ? 'Ação rápida' : 'Concluído',
              variant: pendingAttendanceLessons.length > 0 ? 'warning' : 'success',
            }}
            subtitle="Sincronizado imediatamente com o portal do Aluno e do Responsável."
          />

          <MetricCard
            title="Avaliações e Simulados"
            value={`${db.assessments.length} avaliações`}
            scale="raw"
            accentColor="secondary"
            icon={<GraduationCap className="h-6 w-6" />}
            statusBadge={{ label: 'Lançamento em lote', variant: 'secondary' }}
            subtitle="Simulados ENEM (0 a 1000) e listas de atividades da turma."
          />
        </div>
      </section>

      {/* Cards das Turmas / Disciplinas Atribuídas (Inspirados no SUAP, limpos e diretos) */}
      <section aria-labelledby="teacher-classes-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2
              id="teacher-classes-heading"
              className="text-xl font-extrabold text-slate-900 dark:text-white"
            >
              Minhas Turmas e Diários Atribuídos
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Acesse diretamente a chamada, o lançamento de notas ou o Google Sala de Aula de cada
              turma.
            </p>
          </div>

          <Link
            to="/professor/desempenho"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <BarChart3 className="h-4 w-4 text-primary-700 dark:text-primary-400" aria-hidden="true" />
            <span>Ver Desempenho Consolidado das Turmas</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {enrichedClassCards.map(
            ({
              classSubject,
              classRoom,
              subject,
              periodName,
              activeStudentsCount,
              totalLessonsCount,
            }) => (
              <Card
                key={classSubject.id}
                className="border-t-4 border-t-primary-700 dark:border-t-primary-500"
                title={`${subject?.name ?? 'Matemática'} — ${
                  classRoom?.name ?? 'Turma Esperança • Noite'
                }`}
                subtitle={`Código do Diário: ${classSubject.id.toUpperCase()} • ${periodName}`}
                headerAction={
                  <Badge variant="primary" icon={<Layers className="h-4 w-4" />}>
                    {subject?.area ?? 'Matemática'}
                  </Badge>
                }
                footer={
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/professor/chamada?classRoomId=${classSubject.classRoomId}`}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-primary-700 px-3.5 py-2 text-sm font-bold text-white hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-500 transition-colors"
                      >
                        <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                        <span>Fazer Chamada</span>
                      </Link>

                      <Link
                        to={`/professor/avaliacoes?classRoomId=${classSubject.classRoomId}`}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-secondary-700 px-3.5 py-2 text-sm font-bold text-white hover:bg-secondary-800 dark:bg-secondary-600 dark:hover:bg-secondary-500 transition-colors"
                      >
                        <GraduationCap className="h-4 w-4" aria-hidden="true" />
                        <span>Lançar Notas</span>
                      </Link>
                    </div>

                    {classSubject.classroomUrl && (
                      <a
                        href={classSubject.classroomUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span>Google Sala de Aula</span>
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                }
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <Clock className="h-4 w-4 text-primary-700 dark:text-primary-400" aria-hidden="true" />
                      <span>Horário Semanal</span>
                    </span>
                    <p className="mt-1 font-bold text-slate-900 dark:text-white">
                      {classSubject.weeklySchedule}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <MapPin className="h-4 w-4 text-primary-700 dark:text-primary-400" aria-hidden="true" />
                      <span>Local / Sala</span>
                    </span>
                    <p className="mt-1 font-bold text-slate-900 dark:text-white">
                      {classRoom?.roomLabel ?? 'Sala 01 — Térreo'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <Users className="h-4 w-4 text-primary-700 dark:text-primary-400" aria-hidden="true" />
                      <span>Estudantes Matriculados</span>
                    </span>
                    <p className="mt-1 font-extrabold text-slate-900 dark:text-white">
                      {activeStudentsCount} estudantes ativos
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <Calendar className="h-4 w-4 text-primary-700 dark:text-primary-400" aria-hidden="true" />
                      <span>Aulas no Diário</span>
                    </span>
                    <p className="mt-1 font-extrabold text-slate-900 dark:text-white">
                      {totalLessonsCount} aulas cadastradas
                    </p>
                  </div>
                </div>
              </Card>
            )
          )}
        </div>
      </section>

      {/* Aulas da Semana e Avaliações Recentes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        <div className="lg:col-span-7">
          <Card
            as="section"
            title="Suas Aulas Recentes e Agendadas"
            subtitle="Clique em Fazer Chamada para registrar a presença dos alunos."
            headerAction={
              <Link
                to="/professor/aulas"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold text-primary-800 hover:bg-primary-50 dark:text-primary-300"
              >
                <span>Gerenciar aulas</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          >
            <div className="space-y-3">
              {teacherLessons.slice(0, 4).map((lesson) => {
                const classRoom = db.classRooms.find((c) => c.id === lesson.classRoomId);
                const isPending = pendingAttendanceLessons.some((p) => p.id === lesson.id);

                return (
                  <div
                    key={lesson.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-primary-800 dark:text-primary-300">
                          {formatDateBR(lesson.date)} • {lesson.startTime} às {lesson.endTime}
                        </span>
                        <Badge variant={isPending ? 'warning' : 'success'}>
                          {isPending ? 'Chamada pendente' : 'Chamada concluída'}
                        </Badge>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {lesson.topic}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {classRoom?.name ?? 'Turma Esperança'}
                      </p>
                    </div>

                    <Link
                      to={`/professor/chamada?lessonId=${lesson.id}`}
                      className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl border-2 border-primary-700 bg-white px-3.5 py-2 text-sm font-bold text-primary-900 hover:bg-primary-50 dark:border-primary-500 dark:bg-slate-900 dark:text-primary-200"
                    >
                      <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                      <span>{isPending ? 'Fazer chamada' : 'Revisar chamada'}</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card
            as="section"
            title="Avaliações e Simulados Recentes"
            subtitle="Lance ou atualize notas na escala ENEM (0 a 1000) ou atividades."
            headerAction={
              <Link
                to="/professor/avaliacoes"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold text-secondary-800 hover:bg-secondary-50 dark:text-secondary-300"
              >
                <span>Ver todas</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          >
            <div className="space-y-3">
              {db.assessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      {formatDateBR(assessment.date)}
                    </span>
                    <Badge variant="secondary">Máx: {assessment.maxScore} pts</Badge>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {assessment.title}
                  </h4>
                  <div className="pt-1">
                    <Link
                      to={`/professor/avaliacoes?assessmentId=${assessment.id}`}
                      className="inline-flex w-full min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-secondary-700 px-3.5 py-2 text-sm font-bold text-white hover:bg-secondary-800 dark:bg-secondary-600"
                    >
                      <GraduationCap className="h-4 w-4" aria-hidden="true" />
                      <span>Lançar / Editar Notas</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
