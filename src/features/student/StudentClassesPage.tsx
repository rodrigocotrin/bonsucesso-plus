import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  MapPin,
  User,
  Video,
  XCircle,
} from 'lucide-react';
import {
  Badge,
  Button,
  CalloutAlert,
  Card,
  Modal,
} from '../../components/ui';
import { useSession } from '../../contexts/SessionContext';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import { formatDateBR } from '../../utils/formatters';
import { STUDENT_WEEKLY_SCHEDULE, WeeklyScheduleSlot } from './studentData';

const DAYS_OF_WEEK: Array<WeeklyScheduleSlot['dayOfWeek']> = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
];

export const StudentClassesPage: React.FC = () => {
  const { currentPerson } = useSession();
  const { db } = useMockDatabase();

  const [selectedDayMobile, setSelectedDayMobile] =
    useState<WeeklyScheduleSlot['dayOfWeek']>('Segunda');
  const [selectedLessonModal, setSelectedLessonModal] =
    useState<WeeklyScheduleSlot | null>(null);

  if (!currentPerson) return null;

  const activeEnrollment = db.enrollments.find(
    (e) => e.studentPersonId === currentPerson.id && e.status === 'ativa'
  );
  const studentClassRoom =
    db.classRooms.find((c) => c.id === activeEnrollment?.classRoomId) ??
    db.classRooms[0];

  // Histórico de aulas recentes combinado com o registro de presença do aluno logado
  const recentLessonsWithPresence = useMemo(() => {
    return db.lessons
      .filter((l) => l.classRoomId === studentClassRoom.id)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((lesson) => {
        const subject = db.subjects.find((s) => s.id === lesson.subjectId);
        const teacher = db.persons.find((p) => p.id === lesson.teacherPersonId);
        const classSubject = db.classSubjects.find(
          (cs) => cs.id === lesson.classSubjectId
        );
        const attendance = db.attendances.find(
          (att) =>
            att.lessonId === lesson.id && att.studentPersonId === currentPerson.id
        );

        return {
          lesson,
          subjectName: subject?.name ?? 'Disciplina',
          area: subject?.area ?? 'Matemática',
          teacherName: teacher?.fullName ?? 'Professor(a) Voluntário(a)',
          classroomUrl: classSubject?.classroomUrl,
          presence: attendance?.presence,
          justification: attendance?.justification,
        };
      });
  }, [
    db.lessons,
    db.subjects,
    db.persons,
    db.classSubjects,
    db.attendances,
    studentClassRoom.id,
    currentPerson.id,
  ]);

  const openHistoryItemInModal = (item: (typeof recentLessonsWithPresence)[0]) => {
    const matchingSchedule = STUDENT_WEEKLY_SCHEDULE.find(
      (s) => s.subjectName === item.subjectName
    );

    setSelectedLessonModal({
      id: item.lesson.id,
      dayOfWeek: matchingSchedule?.dayOfWeek ?? 'Segunda',
      startTime: item.lesson.startTime,
      endTime: item.lesson.endTime,
      subjectName: item.subjectName,
      area: item.area,
      teacherName: item.teacherName,
      roomLabel: studentClassRoom.roomLabel,
      syllabusTopics: [
        item.lesson.topic,
        ...(matchingSchedule?.syllabusTopics ?? []),
      ],
      studyGuideNotes:
        matchingSchedule?.studyGuideNotes ??
        'Revise suas anotações no caderno e resolva os exercícios propostos em sala.',
      externalClassroomUrl:
        matchingSchedule?.externalClassroomUrl ?? item.classroomUrl,
      supportVideoUrl: matchingSchedule?.supportVideoUrl,
    });
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho da Página */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="primary" icon={<Calendar className="h-4 w-4" />}>
            {studentClassRoom.name} • {studentClassRoom.scheduleSummary}
          </Badge>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Minhas Aulas e Grade da Turma
          </h1>
          <p className="mt-1 max-w-3xl text-base text-slate-600 dark:text-slate-300">
            Toque em qualquer aula da semana ou do histórico recente para ver o conteúdo
            programático, o(a) professor(a) voluntário(a) e o link para o Google Sala de Aula.
          </p>
        </div>
      </div>

      {/* 1. GRADE SEMANAL DA TURMA (Lista por Dia no Mobile / Colunas no Desktop) */}
      <Card
        as="section"
        title="Grade Semanal da Sua Turma"
        subtitle="Clique sobre uma aula para abrir os detalhes completos e acessar os links de estudo."
      >
        {/* Seletor de Dia para Telas Mobile */}
        <div
          role="tablist"
          aria-label="Escolher dia da semana"
          className="flex lg:hidden overflow-x-auto gap-2 pb-4 mb-2 border-b border-slate-200 dark:border-slate-800"
        >
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = selectedDayMobile === day;
            return (
              <button
                key={day}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedDayMobile(day)}
                className={`min-h-[44px] shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                  isSelected
                    ? 'bg-primary-700 text-white shadow-xs dark:bg-primary-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                {day}-feira
              </button>
            );
          })}
        </div>

        {/* Visão Mobile (Lista do Dia Selecionado) */}
        <div className="lg:hidden space-y-3">
          {STUDENT_WEEKLY_SCHEDULE.filter((slot) => slot.dayOfWeek === selectedDayMobile).map(
            (slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => setSelectedLessonModal(slot)}
                className="w-full text-left rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-4 hover:border-primary-600 hover:bg-white dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-primary-400 transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-primary-800 dark:text-primary-300">
                    {slot.startTime} às {slot.endTime}
                  </span>
                  <Badge variant={slot.externalClassroomUrl ? 'primary' : 'neutral'}>
                    {slot.externalClassroomUrl ? 'Com link Classroom' : 'Presencial'}
                  </Badge>
                </div>
                <h3 className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">
                  {slot.subjectName}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                  {slot.teacherName} • {slot.roomLabel}
                </p>
                <p className="mt-3 text-xs font-bold text-primary-800 dark:text-primary-300">
                  Toque para ver conteúdo programático →
                </p>
              </button>
            )
          )}
        </div>

        {/* Visão Desktop (Grade de 5 Colunas: Segunda a Sexta) */}
        <div className="hidden lg:grid lg:grid-cols-5 gap-4">
          {DAYS_OF_WEEK.map((day) => {
            const slotsForDay = STUDENT_WEEKLY_SCHEDULE.filter(
              (s) => s.dayOfWeek === day
            );

            return (
              <div
                key={day}
                className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-950/40"
              >
                <div className="mb-3 border-b border-slate-200 pb-2 text-center dark:border-slate-800">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">
                    {day}-feira
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {slotsForDay.map((slot, index) => (
                    <React.Fragment key={slot.id}>
                      {index === 1 && (
                        <div className="rounded-lg border border-dashed border-amber-400/70 bg-amber-50/70 px-2 py-1.5 text-center text-xs font-bold text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                          20:30 - 20:45 • Intervalo e Lanche
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedLessonModal(slot)}
                        className="w-full text-left rounded-xl border-2 border-slate-200 bg-white p-3.5 shadow-2xs transition-all hover:border-primary-600 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-primary-400"
                      >
                        <span className="block text-xs font-extrabold text-primary-800 dark:text-primary-300">
                          {slot.startTime} às {slot.endTime}
                        </span>
                        <h4 className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
                          {slot.subjectName}
                        </h4>
                        <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                          {slot.teacherName}
                        </p>
                        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-primary-800 dark:text-primary-300">
                          <span>Ver detalhes</span>
                          <span aria-hidden="true">→</span>
                        </div>
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 2. HISTÓRICO DE AULAS RECENTES E SUA PRESENÇA */}
      <Card
        as="section"
        title="Histórico de Aulas Recentes e Presença"
        subtitle="Acompanhe os temas já trabalhados em sala e sua presença registrada em cada encontro."
      >
        <div className="space-y-3">
          {recentLessonsWithPresence.map((item) => {
            const isScheduled = item.lesson.status === 'agendada';
            return (
              <div
                key={item.lesson.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/50"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-extrabold text-primary-900 dark:text-primary-300">
                      {formatDateBR(item.lesson.date)} • {item.lesson.startTime} às{' '}
                      {item.lesson.endTime}
                    </span>
                    <Badge variant="neutral">{item.subjectName}</Badge>

                    {isScheduled ? (
                      <Badge variant="primary" icon={<Clock className="h-4 w-4" />}>
                        Aula de Hoje (Agendada)
                      </Badge>
                    ) : item.presence === 'presente' ? (
                      <Badge variant="success" icon={<CheckCircle2 className="h-4 w-4" />}>
                        Você esteve presente
                      </Badge>
                    ) : item.presence === 'justificada' ? (
                      <Badge variant="warning" icon={<Info className="h-4 w-4" />}>
                        Falta justificada
                      </Badge>
                    ) : (
                      <Badge variant="danger" icon={<XCircle className="h-4 w-4" />}>
                        Ausência registrada
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {item.lesson.topic}
                  </h3>

                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {item.teacherName} • {studentClassRoom.roomLabel}
                  </p>
                </div>

                <div className="shrink-0">
                  <Button
                    variant="ghost"
                    onClick={() => openHistoryItemInModal(item)}
                    leftIcon={<BookOpen className="h-4 w-4" />}
                  >
                    Ver Conteúdo da Aula
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* MODAL DE DETALHES DA AULA (Conteúdo Programático + Professor + Link Externo ou Aviso Claro) */}
      <Modal
        isOpen={Boolean(selectedLessonModal)}
        onClose={() => setSelectedLessonModal(null)}
        title={
          selectedLessonModal
            ? `${selectedLessonModal.subjectName} — Detalhes da Aula`
            : 'Detalhes da Aula'
        }
        description={
          selectedLessonModal
            ? `${selectedLessonModal.dayOfWeek}-feira, das ${selectedLessonModal.startTime} às ${selectedLessonModal.endTime}`
            : undefined
        }
        footer={
          <Button variant="ghost" onClick={() => setSelectedLessonModal(null)}>
            Fechar detalhes
          </Button>
        }
      >
        {selectedLessonModal && (
          <div className="space-y-5">
            {/* Professor Voluntário e Sala */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <User className="h-5 w-5 text-primary-700 dark:text-primary-400 shrink-0" aria-hidden="true" />
                <div>
                  <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Professor(a) Voluntário(a)
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedLessonModal.teacherName}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <MapPin className="h-5 w-5 text-primary-700 dark:text-primary-400 shrink-0" aria-hidden="true" />
                <div>
                  <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Local do Encontro
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedLessonModal.roomLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Conteúdo Programático para o ENEM */}
            <div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
                Conteúdo Programático (Foco ENEM)
              </h4>
              <ul className="space-y-2 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                {selectedLessonModal.syllabusTopics.map((topic, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-sm text-slate-800 dark:text-slate-200"
                  >
                    <CheckCircle2
                      className="h-4 w-4 text-primary-700 dark:text-primary-400 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Orientação de Estudo */}
            <div className="rounded-xl bg-primary-50/70 border border-primary-200 p-4 dark:bg-primary-950/40 dark:border-primary-800">
              <p className="text-xs font-extrabold uppercase tracking-wider text-primary-900 dark:text-primary-200">
                Dica de Estudo do(a) Professor(a)
              </p>
              <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
                {selectedLessonModal.studyGuideNotes}
              </p>
            </div>

            {/* Tratamento cuidadoso do Link Externo (Google Sala de Aula / Vídeo de apoio) */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                Materiais Digitais e Google Sala de Aula
              </h4>

              {selectedLessonModal.externalClassroomUrl ||
              selectedLessonModal.supportVideoUrl ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  {selectedLessonModal.externalClassroomUrl && (
                    <a
                      href={selectedLessonModal.externalClassroomUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 py-2.5 text-base font-bold text-white shadow-xs hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-500 transition-colors"
                    >
                      <BookOpen className="h-5 w-5" aria-hidden="true" />
                      <span>Abrir Google Sala de Aula</span>
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  )}

                  {selectedLessonModal.supportVideoUrl && (
                    <a
                      href={selectedLessonModal.supportVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-xl bg-secondary-700 px-4 py-2.5 text-base font-bold text-white shadow-xs hover:bg-secondary-800 dark:bg-secondary-600 dark:hover:bg-secondary-500 transition-colors"
                    >
                      <Video className="h-5 w-5" aria-hidden="true" />
                      <span>Assistir Vídeo de Apoio</span>
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  )}
                </div>
              ) : (
                <CalloutAlert
                  variant="info"
                  title="Esta aula ainda não possui link digital externo cadastrado"
                >
                  O material de apoio desta disciplina é entregue impresso diretamente em sala de
                  aula pelo(a) professor(a) voluntário(a). Se você faltou, retire sua cópia na
                  secretaria comunitária.
                </CalloutAlert>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
