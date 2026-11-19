import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
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
  Sparkles,
  Video,
} from 'lucide-react';
import {
  Badge,
  Button,
  CalloutAlert,
  Card,
  MetricCard,
} from '../../components/ui';
import { useSession } from '../../contexts/SessionContext';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import { useToast } from '../../contexts/ToastContext';
import {
  evaluateAttendanceStatus,
  formatDateBR,
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

  // Saudação usando Nome Social (quando preenchido) ou Primeiro Nome
  const greetingName = useMemo(() => {
    if (currentPerson.socialName && currentPerson.socialName.trim().length > 0) {
      return currentPerson.socialName.trim();
    }
    return currentPerson.fullName.split(' ')[0];
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

  // Próxima Aula do Dia
  const nextLessonSlot = useMemo(
    () =>
      STUDENT_TODAY_TIMELINE.find((slot) => slot.type === 'lesson' && slot.isNextHighlight) ??
      STUDENT_TODAY_TIMELINE[0],
    []
  );

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
      {/* 1. BANNER DE SAUDAÇÃO ACOLHEDORA */}
      <section
        aria-labelledby="student-welcome-heading"
        className="rounded-2xl border-2 border-primary-200 bg-gradient-to-br from-primary-50 via-white to-secondary-50/50 p-5 sm:p-6 dark:border-primary-800/80 dark:from-primary-950/70 dark:via-slate-900 dark:to-secondary-950/40"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary" icon={<Sparkles className="h-4 w-4" />}>
                {studentClassRoom?.name ?? 'Turma Esperança • Noite'}
              </Badge>
              <Badge variant="neutral">
                Período Letivo: {currentPeriod?.name ?? '2º semestre de 2026'}
              </Badge>
            </div>

            <h1
              id="student-welcome-heading"
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white"
            >
              Olá, {greetingName}! Que bom ter você aqui hoje.
            </h1>

            <p className="text-base text-slate-700 dark:text-slate-200 max-w-2xl">
              <strong>Aprender transforma.</strong> Pequenos passos todos os dias fazem diferença na sua
              caminhada até o ENEM. Veja abaixo o que preparamos para organizar seus estudos sem correria.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/aluno/aulas"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 py-2.5 text-base font-bold text-white shadow-xs hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-500 transition-colors"
            >
              <CalendarCheck className="h-5 w-5" aria-hidden="true" />
              <span>Ver Grade da Semana</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Alerta acolhedor se a frequência estiver abaixo de 75% */}
      {attendanceEval.status === 'critical' && (
        <CalloutAlert
          variant="warning"
          title="Sua presença importa para nós — estamos juntos nessa caminhada!"
          action={
            <Link
              to="/aluno/desempenho"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <span>Ver minha frequência</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        >
          Sua presença atual está em <strong>{attendancePercentage}%</strong> ({attendedCount} de{' '}
          {totalRecordedClasses} aulas registradas). Se estiver enfrentando alguma dificuldade com
          transporte ou horário de trabalho, converse com a coordenação — queremos apoiar você e
          separar os resumos das aulas perdidas.
        </CalloutAlert>
      )}

      {/* 2. OS 4 KPI CARDS SUPERIORES */}
      <section aria-label="Resumo rápido do seu dia">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Frequência Atual"
            value={attendancePercentage}
            scale="percentage"
            accentColor={attendanceEval.status === 'critical' ? 'danger' : 'success'}
            icon={<CalendarCheck className="h-6 w-6" />}
            statusBadge={{
              label: attendanceEval.status === 'critical' ? 'Atenção (<75%)' : 'Em dia',
              variant: attendanceEval.status === 'critical' ? 'danger' : 'success',
            }}
            subtitle={`${attendedCount} presenças em ${totalRecordedClasses} aulas registradas no semestre.`}
          />

          <MetricCard
            title="Próxima Aula de Hoje"
            value={nextLessonSlot.subjectName ?? 'Matemática'}
            scale="raw"
            accentColor="primary"
            icon={<Clock className="h-6 w-6" />}
            statusBadge={{
              label: `${nextLessonSlot.startTime} às ${nextLessonSlot.endTime}`,
              variant: 'primary',
            }}
            subtitle={`${nextLessonSlot.roomLabel ?? 'Sala 01 — Térreo'} • ${
              nextLessonSlot.teacherName ?? 'Prof. Carlos'
            }`}
          />

          <MetricCard
            title="Último Aviso"
            value="4º Simulado ENEM"
            scale="raw"
            accentColor="secondary"
            icon={<Bell className="h-6 w-6" />}
            statusBadge={{
              label: 'Novo',
              variant: 'secondary',
            }}
            subtitle={`${latestAnnouncement.title} (${formatDateBR(latestAnnouncement.date)})`}
          />

          <MetricCard
            title="Tarefas Pendentes"
            value={
              remainingTasksCount === 0
                ? 'Tudo em dia!'
                : `${remainingTasksCount} ${remainingTasksCount === 1 ? 'atividade' : 'atividades'}`
            }
            scale="raw"
            accentColor={remainingTasksCount > 0 ? 'warning' : 'success'}
            icon={<CheckCircle2 className="h-6 w-6" />}
            statusBadge={{
              label: remainingTasksCount > 0 ? 'Foco da semana' : 'Concluído',
              variant: remainingTasksCount > 0 ? 'warning' : 'success',
            }}
            subtitle="Pequenos passos fazem diferença na sua preparação."
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
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold text-primary-800 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-950/60"
              >
                <span>Grade completa</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          >
            <ol className="relative border-l-4 border-primary-200 dark:border-primary-800 ml-3 space-y-5">
              {STUDENT_TODAY_TIMELINE.map((slot) => {
                if (slot.type === 'break') {
                  return (
                    <li key={slot.id} className="ml-6">
                      <span
                        className="absolute -left-3.5 flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-800 ring-4 ring-white dark:bg-amber-900 dark:text-amber-200 dark:ring-slate-900"
                        aria-hidden="true"
                      >
                        <Coffee className="h-3.5 w-3.5" />
                      </span>
                      <div className="rounded-xl border border-dashed border-amber-400/70 bg-amber-50/70 px-4 py-3 dark:border-amber-700 dark:bg-amber-950/30">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-bold text-amber-900 dark:text-amber-200">
                            Intervalo e Lanche Comunitário
                          </span>
                          <span className="text-xs font-extrabold text-amber-800 dark:text-amber-300">
                            {slot.startTime} às {slot.endTime}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                          {slot.topic}
                        </p>
                      </div>
                    </li>
                  );
                }

                return (
                  <li key={slot.id} className="ml-6">
                    <span
                      className={`absolute -left-3.5 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 ${
                        slot.isNextHighlight
                          ? 'bg-primary-700 text-white'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                      }`}
                      aria-hidden="true"
                    >
                      <Clock className="h-3.5 w-3.5" />
                    </span>

                    <div
                      className={`rounded-2xl border-2 p-4 transition-all ${
                        slot.isNextHighlight
                          ? 'border-primary-600 bg-primary-50/60 shadow-xs dark:border-primary-500 dark:bg-primary-950/40'
                          : 'border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                            {slot.subjectName}
                          </span>
                          {slot.isNextHighlight && (
                            <Badge variant="primary">Próxima Aula</Badge>
                          )}
                        </div>
                        <span className="text-sm font-extrabold text-primary-900 dark:text-primary-200">
                          {slot.startTime} às {slot.endTime}
                        </span>
                      </div>

                      <p className="mt-1.5 text-base font-medium text-slate-800 dark:text-slate-100">
                        Tema de hoje: {slot.topic}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <span>{slot.teacherName}</span>
                        <span className="inline-flex items-center gap-1 font-semibold">
                          <MapPin className="h-4 w-4 text-primary-700 dark:text-primary-400" aria-hidden="true" />
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
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-primary-50 px-3.5 py-2 text-sm font-bold text-primary-900 hover:bg-primary-100 dark:bg-primary-950 dark:text-primary-200 dark:hover:bg-primary-900"
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
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary-800 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-primary-300"
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
                        <span className="text-xs font-extrabold uppercase tracking-wider text-primary-800 dark:text-primary-300">
                          {material.subjectName} • {material.typeLabel}
                        </span>
                        {material.isNew && <Badge variant="success">Novo</Badge>}
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        {material.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        {material.teacherName} • Publicado em {formatDateBR(material.postedAt)}
                      </p>
                    </div>
                  </div>

                  {material.externalUrl && (
                    <a
                      href={material.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
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
                        ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20'
                        : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        {task.subjectName}
                      </span>
                      <Badge variant={badgeVariant}>
                        {isDone ? 'Concluída' : task.dueDateLabel}
                      </Badge>
                    </div>

                    <p
                      className={`mt-1.5 text-base font-bold ${
                        isDone
                          ? 'line-through text-slate-500 dark:text-slate-400'
                          : 'text-slate-900 dark:text-white'
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
            className="border-2 border-secondary-600 dark:border-secondary-500 bg-secondary-50/40 dark:bg-secondary-950/30"
            title="Nosso Próximo Encontro Especial"
            subtitle="Momento importante para treinar tempo de prova e redação com tranquilidade."
            headerAction={
              <Badge variant="secondary" icon={<GraduationCap className="h-4 w-4" />}>
                Simulado ENEM
              </Badge>
            }
          >
            <div className="space-y-3">
              <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                4º Simulado Comunitário Geral (Modelo ENEM)
              </h4>

              <div className="space-y-1.5 text-sm text-slate-700 dark:text-slate-200">
                <p className="flex items-center gap-2 font-semibold">
                  <Calendar className="h-4 w-4 text-secondary-700 dark:text-secondary-400 shrink-0" aria-hidden="true" />
                  <span>Sábado, 28 de Novembro de 2026 • das 13h00 às 18h30</span>
                </p>
                <p className="flex items-center gap-2 font-semibold">
                  <MapPin className="h-4 w-4 text-secondary-700 dark:text-secondary-400 shrink-0" aria-hidden="true" />
                  <span>Todas as salas do Cursinho Comunitário Bonsucesso</span>
                </p>
              </div>

              <div className="rounded-xl bg-white p-3.5 border border-secondary-200 dark:bg-slate-900 dark:border-secondary-800 text-sm space-y-1">
                <p className="font-bold text-secondary-900 dark:text-secondary-200">
                  O que levar no dia:
                </p>
                <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-0.5">
                  <li>Caneta esferográfica de tinta preta em material transparente</li>
                  <li>Documento oficial com foto e sua garrafinha de água</li>
                  <li>Lanche gratuito servido na copa do cursinho antes do início</li>
                </ul>
              </div>

              <Link
                to="/aluno/eventos"
                className="inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-secondary-700 px-4 py-2.5 text-base font-bold text-white hover:bg-secondary-800 dark:bg-secondary-600 dark:hover:bg-secondary-500 transition-colors"
              >
                <Calendar className="h-5 w-5" aria-hidden="true" />
                <span>Ver todos os Eventos e Avisos</span>
              </Link>
            </div>
          </Card>

          {/* Bloco discreto "Precisa de ajuda?" */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 flex items-start gap-3.5">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300"
              aria-hidden="true"
            >
              <HelpCircle className="h-5 w-5" />
            </div>
            <div className="space-y-1 text-sm">
              <h3 className="font-bold text-slate-900 dark:text-white">
                Precisa de ajuda para navegar?
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Use o menu lateral (ou a barra na parte de baixo do celular) para abrir{' '}
                <strong>Minhas Aulas</strong>, baixar apostilas em <strong>Meus Materiais</strong> ou
                acompanhar suas notas em <strong>Meu Desempenho</strong>. Para aumentar o tamanho da
                letra, acesse{' '}
                <Link
                  to="/aluno/configuracoes"
                  className="font-bold text-primary-800 underline dark:text-primary-300"
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
