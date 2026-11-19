import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ClipboardCheck,
  ExternalLink,
  GraduationCap,
  Plus,
} from 'lucide-react';
import {
  Badge,
  Card,
  MetricCard,
} from '../../components/ui';
import { useSession } from '../../contexts/SessionContext';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import {
  formatDateBR,
} from '../../utils/formatters';

export const TeacherDashboardPage: React.FC = () => {
  const { currentPerson } = useSession();
  const { db } = useMockDatabase();

  if (!currentPerson) return null;

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
      {/* Cabeçalho enxuto (Regra 2: Título curto + 1 único CTA primário) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1>Minhas Turmas</h1>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/professor/aulas?nova=1"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 text-sm font-medium text-ink hover:bg-subtle"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Nova Aula</span>
          </Link>

          <Link
            to={
              primaryPendingLesson
                ? `/professor/chamada?lessonId=${primaryPendingLesson.id}`
                : '/professor/chamada'
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-cta px-4 text-sm font-medium text-cta-fg transition-all duration-150 ease-out hover:bg-cta-hover active:scale-[0.98]"
          >
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            <span>Fazer Chamada</span>
          </Link>
        </div>
      </div>

      {/* KPIs Rápidos Ultra-Limpos (Máx 3 elementos — Regra 2) */}
      <section aria-label="Resumo docente">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            title="Aulas Registradas"
            value={`${teacherLessons.length} aulas`}
            accentColor="academic"
            subtitle={`${enrichedClassCards.length} turmas atribuídas`}
          />

          <MetricCard
            title="Chamadas Pendentes"
            value={
              pendingAttendanceLessons.length === 0
                ? '0 pendentes'
                : `${pendingAttendanceLessons.length} ${
                    pendingAttendanceLessons.length === 1 ? 'pendente' : 'pendentes'
                  }`
            }
            accentColor={pendingAttendanceLessons.length > 0 ? 'assess' : 'progress'}
            statusBadge={{
              label:
                pendingAttendanceLessons.length > 0
                  ? primaryPendingLesson?.topic ?? 'Aguardando registro'
                  : '100% em dia',
              variant: pendingAttendanceLessons.length > 0 ? 'warning' : 'success',
            }}
          />

          <MetricCard
            title="Avaliações"
            value={`${db.assessments.length} avaliações`}
            accentColor="assess"
            subtitle="Escala ENEM 0–1000"
          />
        </div>
      </section>

      {/* Cards das Turmas (Sem box-ception e sem botões pretos duplicados) */}
      <section aria-labelledby="teacher-classes-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="teacher-classes-heading">Turmas Atribuídas</h2>

          <Link
            to="/professor/desempenho"
            className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink"
          >
            <span>Desempenho das turmas</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {enrichedClassCards.map(
            ({
              classSubject,
              classRoom,
              subject,
              activeStudentsCount,
              totalLessonsCount,
            }) => (
              <Card
                key={classSubject.id}
                title={`${subject?.name ?? 'Matemática'} — ${
                  classRoom?.name ?? 'Turma Esperança'
                }`}
                subtitle={`${classRoom?.roomLabel ?? 'Sala 01'} • ${classSubject.weeklySchedule}`}
                headerAction={
                  <Badge variant="academic">{subject?.area ?? 'Matemática'}</Badge>
                }
                footer={
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/professor/chamada?classRoomId=${classSubject.classRoomId}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line bg-surface px-3 text-xs font-medium text-ink hover:bg-subtle"
                      >
                        <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Frequência</span>
                      </Link>

                      <Link
                        to={`/professor/avaliacoes?classRoomId=${classSubject.classRoomId}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line bg-surface px-3 text-xs font-medium text-ink hover:bg-subtle"
                      >
                        <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Notas</span>
                      </Link>
                    </div>

                    {classSubject.classroomUrl && (
                      <a
                        href={classSubject.classroomUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center gap-1.5 rounded-md bg-academic-bg px-3 text-xs font-medium text-academic hover:bg-academic hover:text-white"
                      >
                        <span>Google Classroom</span>
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                }
              >
                <div className="flex items-center gap-6 text-xs text-ink-muted">
                  <span>
                    <strong className="font-mono text-sm font-semibold text-ink tabular-nums">
                      {activeStudentsCount}
                    </strong>{' '}
                    alunos ativos
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="font-mono text-sm font-semibold text-ink tabular-nums">
                      {totalLessonsCount}
                    </strong>{' '}
                    aulas no diário
                  </span>
                </div>
              </Card>
            )
          )}
        </div>
      </section>

      {/* Aulas da Semana e Avaliações Recentes (Linhas Horizontais Limpas — Regra 5) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        <div className="lg:col-span-7">
          <Card
            as="section"
            title="Aulas Recentes"
            headerAction={
              <Link
                to="/professor/aulas"
                className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink"
              >
                <span>Ver todas</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            }
            noPadding
          >
            <ul className="divide-y divide-line">
              {teacherLessons.slice(0, 4).map((lesson) => {
                const classRoom = db.classRooms.find((c) => c.id === lesson.classRoomId);
                const isPending = pendingAttendanceLessons.some((p) => p.id === lesson.id);

                return (
                  <li
                    key={lesson.id}
                    className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-ink-muted tabular-nums">
                          {formatDateBR(lesson.date)} • {lesson.startTime}–{lesson.endTime}
                        </span>
                        <Badge variant={isPending ? 'assess' : 'progress'}>
                          {isPending ? 'Chamada pendente' : 'Concluída'}
                        </Badge>
                      </div>
                      <p className="truncate text-sm font-medium text-ink">
                        {lesson.topic}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {classRoom?.name ?? 'Turma Esperança'}
                      </p>
                    </div>

                    <Link
                      to={`/professor/chamada?lessonId=${lesson.id}`}
                      className="inline-flex h-8 shrink-0 items-center rounded-md border border-line bg-surface px-3 text-xs font-medium text-ink hover:bg-subtle"
                    >
                      {isPending ? 'Fazer chamada' : 'Revisar'}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card
            as="section"
            title="Avaliações"
            headerAction={
              <Link
                to="/professor/avaliacoes"
                className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink"
              >
                <span>Ver todas</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            }
            noPadding
          >
            <ul className="divide-y divide-line">
              {db.assessments.map((assessment) => (
                <li
                  key={assessment.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {assessment.title}
                    </p>
                    <p className="font-mono text-xs text-ink-muted tabular-nums">
                      {formatDateBR(assessment.date)} • 0–{assessment.maxScore} pts
                    </p>
                  </div>

                  <Link
                    to={`/professor/avaliacoes?assessmentId=${assessment.id}`}
                    className="inline-flex h-8 shrink-0 items-center rounded-md border border-line bg-surface px-3 text-xs font-medium text-ink hover:bg-subtle"
                  >
                    Notas
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};
