import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Coffee,
  ExternalLink,
  FileText,
  GraduationCap,
  HelpCircle,
  MapPin,
  Video,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  MetricCard,
} from '../../components/ui';
import { useSession } from '../../contexts/SessionContext';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import { useToast } from '../../contexts/ToastContext';
import {
  evaluateAttendanceStatus,
  formatDateBR,
  getDisplayName,
} from '../../utils/formatters';
import {
  STUDENT_ANNOUNCEMENTS_FEED,
  STUDENT_PENDING_TASKS,
  STUDENT_STUDY_MATERIALS,
  STUDENT_TODAY_TIMELINE,
} from './studentData';

export const StudentDashboardPage: React.FC = () => {
  const { currentPerson } = useSession();
  const { db, getStudentAttendancePercentage } = useMockDatabase();
  const { showToast } = useToast();

  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);

  if (!currentPerson) return null;

  // Saudação usando Nome Social prioritário (getDisplayName)
  const greetingName = useMemo(() => {
    return getDisplayName(currentPerson);
  }, [currentPerson]);

  // Matrícula, Turma e Período Letivo do Aluno
  const activeEnrollment = useMemo(
    () =>
      db.enrollments.find(
        (e) => e.studentPersonId === currentPerson.id && e.status === 'ativa'
      ) ?? db.enrollments[0],
    [db.enrollments, currentPerson.id]
  );

  const studentClassRoom = useMemo(
    () =>
      db.classRooms.find((c) => c.id === activeEnrollment?.classRoomId) ??
      db.classRooms[0],
    [db.classRooms, activeEnrollment]
  );

  const currentPeriod = useMemo(
    () =>
      db.academicPeriods.find((p) => p.id === activeEnrollment?.periodId) ??
      db.academicPeriods.find((p) => p.isCurrent) ??
      db.academicPeriods[0],
    [db.academicPeriods, activeEnrollment]
  );

  // Cálculo de Frequência (presenças / total de aulas registradas)
  const studentAttendances = useMemo(
    () => db.attendances.filter((a) => a.studentPersonId === currentPerson.id),
    [db.attendances, currentPerson.id]
  );
  const attendedCount = studentAttendances.filter(
    (a) => a.presence === 'presente' || a.presence === 'justificada'
  ).length;
  const totalRecordedClasses = studentAttendances.length || 5;
  const attendancePercentage = getStudentAttendancePercentage(currentPerson.id);
  const attendanceEval = evaluateAttendanceStatus(attendancePercentage);

  // Próxima Aula do Dia + Link do Google Classroom
  const nextLessonSlot = useMemo(
    () =>
      STUDENT_TODAY_TIMELINE.find((slot) => slot.type === 'lesson' && slot.isNextHighlight) ??
      STUDENT_TODAY_TIMELINE[0],
    []
  );

  const nextLessonClassroomUrl = useMemo(() => {
    const matchedSubject = db.subjects.find(
      (s) => s.name === nextLessonSlot.subjectName
    );
    const classSubject = matchedSubject
      ? db.classSubjects.find(
          (cs) =>
            cs.subjectId === matchedSubject.id &&
            cs.classRoomId === studentClassRoom?.id
        )
      : undefined;
    return classSubject?.classroomUrl ?? 'https://classroom.google.com';
  }, [db.subjects, db.classSubjects, nextLessonSlot.subjectName, studentClassRoom?.id]);

  // Último Aviso
  const latestAnnouncement = STUDENT_ANNOUNCEMENTS_FEED[0];

  // Tarefas Pendentes
  const remainingTasksCount = STUDENT_PENDING_TASKS.filter(
    (t) => !completedTaskIds.includes(t.id)
  ).length;

  const toggleTaskDone = (taskId: string, taskTitle: string) => {
    const isAlreadyDone = completedTaskIds.includes(taskId);
    setCompletedTaskIds((prev) =>
      isAlreadyDone ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
    if (!isAlreadyDone) {
      showToast({
        variant: 'success',
        title: 'Passo concluído! Muito bem!',
        description: `Você marcou "${taskTitle}" como concluída.`,
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. CABEÇALHO ENXUTO (Regra 2) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1>Olá, {greetingName}</h1>
          <p className="text-xs text-ink-muted">
            {studentClassRoom?.name ?? 'Turma Esperança • Noite'} •{' '}
            {currentPeriod?.name ?? '2º semestre de 2026'}
          </p>
        </div>

        <Link
          to="/aluno/aulas"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-cta px-4 text-sm font-medium text-cta-fg transition-all duration-150 ease-out hover:bg-cta-hover active:scale-[0.98]"
        >
          <CalendarCheck className="h-4 w-4" aria-hidden="true" />
          <span>Grade Semanal</span>
        </Link>
      </div>

      {/* CARD "PRÓXIMA AULA" EM DESTAQUE NO TOPO (ALUNO MOBILE < 768px — Requisito 3) */}
      <section
        aria-label="Próxima aula do dia"
        className="rounded-lg border border-academic-border bg-surface p-4 md:hidden"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="academic">Próxima Aula</Badge>
              <span className="num text-xs font-semibold text-ink">
                {nextLessonSlot.startTime}–{nextLessonSlot.endTime}
              </span>
            </div>
            <h2 className="text-base font-bold text-ink">
              {nextLessonSlot.subjectName ?? 'Matemática'}
            </h2>
            <p className="text-xs text-ink-muted">
              {nextLessonSlot.teacherName ?? 'Prof. Carlos Eduardo'} •{' '}
              {nextLessonSlot.roomLabel ?? 'Sala 01'}
            </p>
          </div>
        </div>

        <a
          href={nextLessonClassroomUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md bg-academic px-4 py-2.5 text-xs font-semibold text-white transition-all duration-150 ease-out hover:opacity-95 active:scale-[0.98]"
        >
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          <span>Abrir no Google Classroom</span>
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </section>

      {/* 2. OS 4 KPI CARDS ULTRA-LIMPOS (Máx 3 elementos — Regra 2) */}
      <section aria-label="Resumo do dia">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Frequência Atual"
            value={attendancePercentage}
            scale="percentage"
            accentColor={attendanceEval.status === 'critical' ? 'critical' : 'progress'}
            statusBadge={{
              label: `${attendedCount}/${totalRecordedClasses} presenças`,
              variant: attendanceEval.status === 'critical' ? 'danger' : 'success',
            }}
          />

          <MetricCard
            title="Próxima Aula"
            value={nextLessonSlot.subjectName ?? 'Matemática'}
            accentColor="academic"
            subtitle={`${nextLessonSlot.startTime}–${nextLessonSlot.endTime} • ${
              nextLessonSlot.roomLabel ?? 'Sala 01'
            }`}
          />

          <MetricCard
            title="Próximo Simulado"
            value="24/11"
            accentColor="assess"
            subtitle={latestAnnouncement.title}
          />

          <MetricCard
            title="Atividades Pendentes"
            value={
              remainingTasksCount === 0
                ? '0 pendentes'
                : `${remainingTasksCount} ${
                    remainingTasksCount === 1 ? 'atividade' : 'atividades'
                  }`
            }
            accentColor={remainingTasksCount > 0 ? 'assess' : 'progress'}
            subtitle={remainingTasksCount > 0 ? 'Entregas da semana' : 'Tudo em dia'}
          />
        </div>
      </section>

      {/* 3. LINHA DO TEMPO "SUAS AULAS DE HOJE" + "PARA VOCÊ SE ORGANIZAR" */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Coluna Esquerda (7 cols): Suas aulas de hoje */}
        <div className="lg:col-span-7 space-y-6">
          <Card
            as="section"
            title="Suas aulas de hoje"
            subtitle={`Rotina de hoje na ${studentClassRoom?.name ?? 'Turma Esperança • Noite'} — cada aula aproxima você do seu objetivo.`}
            headerAction={
              <Link
                to="/aluno/aulas"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold text-primary-800 hover:bg-primary-50"
              >
                <span>Grade completa</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          >
            <ol className="relative border-l-4 border-primary-200 ml-3 space-y-5">
              {STUDENT_TODAY_TIMELINE.map((slot) => {
                if (slot.type === 'break') {
                  return (
                    <li key={slot.id} className="ml-6">
                      <span
                        className="absolute -left-3.5 flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-800 ring-4 ring-white"
                        aria-hidden="true"
                      >
                        <Coffee className="h-3.5 w-3.5" />
                      </span>
                      <div className="rounded-xl border border-dashed border-amber-400/70 bg-amber-50/70 px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-bold text-amber-900">
                            Intervalo e Lanche Comunitário
                          </span>
                          <span className="text-xs font-extrabold text-amber-800">
                            {slot.startTime} às {slot.endTime}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-700">
                          {slot.topic}
                        </p>
                      </div>
                    </li>
                  );
                }

                return (
                  <li key={slot.id} className="ml-6">
                    <span
                      className={`absolute -left-3.5 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${
                        slot.isNextHighlight
                          ? 'bg-primary-700 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                      aria-hidden="true"
                    >
                      <Clock className="h-3.5 w-3.5" />
                    </span>

                    <div
                      className={`rounded-2xl border-2 p-4 transition-all ${
                        slot.isNextHighlight
                          ? 'border-primary-600 bg-primary-50/60 shadow-xs'
                          : 'border-slate-200 bg-slate-50/60'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-extrabold text-slate-900">
                            {slot.subjectName}
                          </span>
                          {slot.isNextHighlight && (
                            <Badge variant="primary">Próxima Aula</Badge>
                          )}
                        </div>
                        <span className="text-sm font-extrabold text-primary-900">
                          {slot.startTime} às {slot.endTime}
                        </span>
                      </div>

                      <p className="mt-1.5 text-base font-medium text-slate-800">
                        Tema de hoje: {slot.topic}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
                        <span>{slot.teacherName}</span>
                        <span className="inline-flex items-center gap-1 font-semibold">
                          <MapPin className="h-4 w-4 text-primary-700" aria-hidden="true" />
                          {slot.roomLabel}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>

          {/* 5. SEÇÃO "ÚLTIMOS MATERIAIS" COM LINK RÁPIDO "VER TODOS" */}
          <Card
            as="section"
            title="Últimos materiais publicados"
            subtitle="Apostilas, listas de exercícios e vídeos postados recentemente pelos seus professores."
            headerAction={
              <Link
                to="/aluno/materias"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-primary-50 px-3.5 py-2 text-sm font-bold text-primary-900 hover:bg-primary-100"
              >
                <span>Ver todos os materiais</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          >
            <div className="space-y-3">
              {STUDENT_STUDY_MATERIALS.slice(0, 3).map((material) => (
                <div
                  key={material.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary-800 border border-slate-200"
                      aria-hidden="true"
                    >
                      {material.type === 'video' ? (
                        <Video className="h-5 w-5" />
                      ) : (
                        <FileText className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-primary-800">
                          {material.subjectName} • {material.typeLabel}
                        </span>
                        {material.isNew && <Badge variant="success">Novo</Badge>}
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-0.5">
                        {material.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {material.teacherName} • Publicado em {formatDateBR(material.postedAt)}
                      </p>
                    </div>
                  </div>

                  {material.externalUrl && (
                    <a
                      href={material.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100"
                    >
                      <BookOpen className="h-4 w-4" aria-hidden="true" />
                      <span>Abrir material</span>
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Coluna Direita (5 cols): Para você se organizar + Nosso Próximo Encontro + Precisa de ajuda */}
        <div className="lg:col-span-5 space-y-6">
          {/* Bloco "Para você se organizar" */}
          <Card
            as="section"
            title="Para você se organizar"
            subtitle="Marque cada atividade concluída para acompanhar seu ritmo na semana."
          >
            <div className="space-y-3">
              {STUDENT_PENDING_TASKS.map((task) => {
                const isDone = completedTaskIds.includes(task.id);
                const badgeVariant =
                  isDone
                    ? 'success'
                    : task.urgency === 'hoje'
                    ? 'danger'
                    : task.urgency === 'proxima'
                    ? 'warning'
                    : 'primary';

                return (
                  <div
                    key={task.id}
                    className={`rounded-xl border p-3.5 transition-colors ${
                      isDone
                        ? 'border-emerald-300 bg-emerald-50/50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                        {task.subjectName}
                      </span>
                      <Badge variant={badgeVariant}>
                        {isDone ? 'Concluída' : task.dueDateLabel}
                      </Badge>
                    </div>

                    <p
                      className={`mt-1.5 text-base font-bold ${
                        isDone
                          ? 'line-through text-slate-500'
                          : 'text-slate-900'
                      }`}
                    >
                      {task.title}
                    </p>

                    <div className="mt-3">
                      <Button
                        variant={isDone ? 'ghost' : 'primary'}
                        onClick={() => toggleTaskDone(task.id, task.title)}
                        leftIcon={<CheckCircle2 className="h-4 w-4" />}
                        fullWidth
                      >
                        {isDone ? 'Desmarcar tarefa' : 'Marcar como concluída'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Card destacado "Nosso Próximo Encontro" */}
          <Card
            as="section"
            className="border-2 border-secondary-600 bg-secondary-50/40"
            title="Nosso Próximo Encontro Especial"
            subtitle="Momento importante para treinar tempo de prova e redação com tranquilidade."
            headerAction={
              <Badge variant="secondary" icon={<GraduationCap className="h-4 w-4" />}>
                Simulado ENEM
              </Badge>
            }
          >
            <div className="space-y-3">
              <h4 className="text-lg font-extrabold text-slate-900">
                4º Simulado Comunitário Geral (Modelo ENEM)
              </h4>

              <div className="space-y-1.5 text-sm text-slate-700">
                <p className="flex items-center gap-2 font-semibold">
                  <Calendar className="h-4 w-4 text-secondary-700 shrink-0" aria-hidden="true" />
                  <span>Sábado, 28 de Novembro de 2026 • das 13h00 às 18h30</span>
                </p>
                <p className="flex items-center gap-2 font-semibold">
                  <MapPin className="h-4 w-4 text-secondary-700 shrink-0" aria-hidden="true" />
                  <span>Todas as salas do Cursinho Comunitário Bonsucesso</span>
                </p>
              </div>

              <div className="rounded-xl bg-white p-3.5 border border-secondary-200 text-sm space-y-1">
                <p className="font-bold text-secondary-900">
                  O que levar no dia:
                </p>
                <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                  <li>Caneta esferográfica de tinta preta em material transparente</li>
                  <li>Documento oficial com foto e sua garrafinha de água</li>
                  <li>Lanche gratuito servido na copa do cursinho antes do início</li>
                </ul>
              </div>

              <Link
                to="/aluno/eventos"
                className="inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-secondary-700 px-4 py-2.5 text-base font-bold text-white hover:bg-secondary-800 transition-colors"
              >
                <Calendar className="h-5 w-5" aria-hidden="true" />
                <span>Ver todos os Eventos e Avisos</span>
              </Link>
            </div>
          </Card>

          {/* Bloco discreto "Precisa de ajuda?" */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-start gap-3.5">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-800"
              aria-hidden="true"
            >
              <HelpCircle className="h-5 w-5" />
            </div>
            <div className="space-y-1 text-sm">
              <h3 className="font-bold text-slate-900">
                Precisa de ajuda para navegar?
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Use o menu lateral (ou a barra na parte de baixo do celular) para abrir{' '}
                <strong>Minhas Aulas</strong>, baixar apostilas em <strong>Meus Materiais</strong> ou
                acompanhar suas notas em <strong>Meu Desempenho</strong>. Para aumentar o tamanho da
                letra, acesse{' '}
                <Link
                  to="/aluno/configuracoes"
                  className="font-bold text-primary-800 underline"
                >
                  Configurações
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
