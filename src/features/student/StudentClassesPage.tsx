import React, { useMemo, useState } from 'react';
import {
  BookOpen,
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
      {/* Cabeçalho enxuto (Regra 2) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1>Minhas Aulas</h1>
          <p className="text-xs text-ink-muted">
            {studentClassRoom.name} • {studentClassRoom.scheduleSummary}
          </p>
        </div>
      </div>

      {/* 1. GRADE SEMANAL DA TURMA */}
      <Card as="section" title="Grade Semanal">
        {/* Seletor de Dia Mobile: Segmented Control Suave (sem pills pretas) */}
        <div
          role="tablist"
          aria-label="Escolher dia da semana"
          className="mb-4 flex gap-1 overflow-x-auto rounded-md bg-track p-1 lg:hidden"
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
                className={`h-8 shrink-0 rounded px-3 text-xs transition-colors ${
                  isSelected
                    ? 'bg-surface font-semibold text-ink shadow-xs'
                    : 'font-medium text-ink-muted hover:text-ink'
                }`}
              >
                {day}
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
                className="w-full text-left rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-4 hover:border-primary-600 hover:bg-white transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-primary-800">
                    {slot.startTime} às {slot.endTime}
                  </span>
                  <Badge variant={slot.externalClassroomUrl ? 'primary' : 'neutral'}>
                    {slot.externalClassroomUrl ? 'Com link Classroom' : 'Presencial'}
                  </Badge>
                </div>
                <h3 className="mt-1 text-lg font-extrabold text-slate-900">
                  {slot.subjectName}
                </h3>
                <p className="text-sm text-slate-600 mt-0.5">
                  {slot.teacherName} • {slot.roomLabel}
                </p>
                <p className="mt-3 text-xs font-bold text-primary-800">
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
                className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/50 p-3"
              >
                <div className="mb-3 border-b border-slate-200 pb-2 text-center">
                  <span className="text-base font-extrabold text-slate-900">
                    {day}-feira
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {slotsForDay.map((slot, index) => (
                    <React.Fragment key={slot.id}>
                      {index === 1 && (
                        <div className="rounded-lg border border-dashed border-amber-400/70 bg-amber-50/70 px-2 py-1.5 text-center text-xs font-bold text-amber-900">
                          20:30 - 20:45 • Intervalo e Lanche
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedLessonModal(slot)}
                        className="w-full text-left rounded-xl border-2 border-slate-200 bg-white p-3.5 shadow-2xs transition-all hover:border-primary-600 hover:shadow-md"
                      >
                        <span className="block text-xs font-extrabold text-primary-800">
                          {slot.startTime} às {slot.endTime}
                        </span>
                        <h4 className="mt-1 text-base font-extrabold text-slate-900">
                          {slot.subjectName}
                        </h4>
                        <p className="mt-1 text-xs font-medium text-slate-600">
                          {slot.teacherName}
                        </p>
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-primary-800">
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
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-extrabold text-primary-900">
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

                  <h3 className="text-base font-bold text-slate-900">
                    {item.lesson.topic}
                  </h3>

                  <p className="text-sm text-slate-600">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2.5">
                <User className="h-5 w-5 text-primary-700 shrink-0" aria-hidden="true" />
                <div>
                  <span className="block text-xs font-semibold text-slate-500">
                    Professor(a) Voluntário(a)
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {selectedLessonModal.teacherName}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <MapPin className="h-5 w-5 text-primary-700 shrink-0" aria-hidden="true" />
                <div>
                  <span className="block text-xs font-semibold text-slate-500">
                    Local do Encontro
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {selectedLessonModal.roomLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Conteúdo Programático para o ENEM */}
            <div>
              <h4 className="text-base font-extrabold text-slate-900 mb-2">
                Conteúdo Programático (Foco ENEM)
              </h4>
              <ul className="space-y-2 rounded-xl border border-slate-200 p-4">
                {selectedLessonModal.syllabusTopics.map((topic, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-sm text-slate-800"
                  >
                    <CheckCircle2
                      className="h-4 w-4 text-primary-700 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Orientação de Estudo */}
            <div className="rounded-xl bg-primary-50/70 border border-primary-200 p-4">
              <p className="text-xs font-extrabold uppercase tracking-wider text-primary-900">
                Dica de Estudo do(a) Professor(a)
              </p>
              <p className="mt-1 text-sm text-slate-800">
                {selectedLessonModal.studyGuideNotes}
              </p>
            </div>

            {/* Tratamento cuidadoso do Link Externo (Google Sala de Aula / Vídeo de apoio) */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <h4 className="text-base font-extrabold text-slate-900">
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
                      className="inline-flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 py-2.5 text-base font-bold text-white shadow-xs hover:bg-primary-800 transition-colors"
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
                      className="inline-flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-xl bg-secondary-700 px-4 py-2.5 text-base font-bold text-white shadow-xs hover:bg-secondary-800 transition-colors"
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
