import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCheck,
  Keyboard,
  RotateCcw,
  Save,
} from 'lucide-react';
import {
  Button,
  CalloutAlert,
  Select,
} from '../../components/ui';
import { StudentCard } from '../../components/shared/StudentCard';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import { useToast } from '../../contexts/ToastContext';
import { getDisplayName } from '../../lib/person';
import { Attendance, AttendancePresence } from '../../types';
import { formatDateBR } from '../../utils/formatters';

interface AttendanceDraftPayload {
  savedAt: string; // HH:mm
  presenceMap: Record<string, { presence?: AttendancePresence; justification?: string }>;
}

function getAttendanceDraftStorageKey(lessonId: string): string {
  return `bonsucesso_draft_attendance_${lessonId}`;
}

function formatNowTimeHHMM(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
}

export const TeacherAttendancePage: React.FC = () => {
  const { db, getStudentAttendancePercentage, recordAttendanceBatch } = useMockDatabase();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  // Inicializa turma e aula a partir da URL
  const initialLessonFromUrl = useMemo(() => {
    const lessonIdParam = searchParams.get('lessonId');
    if (lessonIdParam) {
      return db.lessons.find((l) => l.id === lessonIdParam);
    }
    return undefined;
  }, [searchParams, db.lessons]);

  const [selectedClassRoomId, setSelectedClassRoomId] = useState<string>(
    initialLessonFromUrl?.classRoomId ??
      searchParams.get('classRoomId') ??
      'cls-esperanca'
  );

  // Aulas disponíveis para a turma selecionada
  const lessonsForClassRoom = useMemo(() => {
    return db.lessons
      .filter((l) => l.classRoomId === selectedClassRoomId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [db.lessons, selectedClassRoomId]);

  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    initialLessonFromUrl?.id ?? lessonsForClassRoom[0]?.id ?? ''
  );

  useEffect(() => {
    const belongs = lessonsForClassRoom.some((l) => l.id === selectedLessonId);
    if (!belongs && lessonsForClassRoom.length > 0) {
      setSelectedLessonId(lessonsForClassRoom[0].id);
    }
  }, [lessonsForClassRoom, selectedLessonId]);

  // Alunos com matrícula ativa na turma selecionada (ordenados pelo Nome Social / getDisplayName)
  const enrolledStudents = useMemo(() => {
    const activeEnrollments = db.enrollments.filter(
      (e) => e.classRoomId === selectedClassRoomId && e.status === 'ativa'
    );

    return activeEnrollments
      .map((enrollment) => {
        const person = db.persons.find((p) => p.id === enrollment.studentPersonId);
        return person ? { person, enrollment } : null;
      })
      .filter(
        (item): item is {
          person: NonNullable<typeof item>['person'];
          enrollment: NonNullable<typeof item>['enrollment'];
        } => Boolean(item)
      )
      .sort((a, b) =>
        getDisplayName(a.person).localeCompare(getDisplayName(b.person), 'pt-BR')
      );
  }, [db.enrollments, db.persons, selectedClassRoomId]);

  // Estado local da chamada: mapa studentPersonId -> { presence, justification }
  const [draftPresenceMap, setDraftPresenceMap] = useState<
    Record<string, { presence?: AttendancePresence; justification?: string }>
  >({});

  // Controle de Auto-Save (debounce de 600ms)
  const [hasUnsavedDraftChanges, setHasUnsavedDraftChanges] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  // Refs das linhas de aluno para avanço automático via teclado (P / F / J / ↑ / ↓)
  const studentRowRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Flag para destacar visualmente alunos sem marcação caso o professor tente salvar incompleto
  const [highlightMissingAttempt, setHighlightMissingAttempt] = useState(false);

  // Carrega rascunho salvo no localStorage ou registros existentes da store quando a aula muda
  useEffect(() => {
    if (!selectedLessonId) return;

    try {
      const savedDraftRaw = localStorage.getItem(
        getAttendanceDraftStorageKey(selectedLessonId)
      );
      if (savedDraftRaw) {
        const parsed = JSON.parse(savedDraftRaw) as AttendanceDraftPayload;
        if (parsed && parsed.presenceMap) {
          setDraftPresenceMap(parsed.presenceMap);
          setDraftSavedAt(parsed.savedAt);
          setHasUnsavedDraftChanges(false);
          setHighlightMissingAttempt(false);
          return;
        }
      }
    } catch {
      // ignore storage parse error
    }

    const existingRecords = db.attendances.filter(
      (a) => a.lessonId === selectedLessonId
    );
    const initialMap: Record<
      string,
      { presence?: AttendancePresence; justification?: string }
    > = {};

    for (const rec of existingRecords) {
      initialMap[rec.studentPersonId] = {
        presence: rec.presence,
        justification: rec.justification ?? '',
      };
    }

    setDraftPresenceMap(initialMap);
    setDraftSavedAt(null);
    setHasUnsavedDraftChanges(false);
    setHighlightMissingAttempt(false);
  }, [selectedLessonId, db.attendances]);

  // Auto-save com debounce de 600ms no localStorage
  useEffect(() => {
    if (!selectedLessonId || !hasUnsavedDraftChanges) return;

    const timer = window.setTimeout(() => {
      const timeLabel = formatNowTimeHHMM();
      const payload: AttendanceDraftPayload = {
        savedAt: timeLabel,
        presenceMap: draftPresenceMap,
      };
      try {
        localStorage.setItem(
          getAttendanceDraftStorageKey(selectedLessonId),
          JSON.stringify(payload)
        );
        setDraftSavedAt(timeLabel);
        setHasUnsavedDraftChanges(false);
      } catch {
        // ignore storage quota errors
      }
    }, 600);

    return () => window.clearTimeout(timer);
  }, [selectedLessonId, draftPresenceMap, hasUnsavedDraftChanges]);

  const handleSetStudentPresence = (
    studentPersonId: string,
    presence: AttendancePresence
  ) => {
    setDraftPresenceMap((prev) => ({
      ...prev,
      [studentPersonId]: {
        ...prev[studentPersonId],
        presence,
      },
    }));
    setHasUnsavedDraftChanges(true);
  };

  const handleSetStudentJustification = (
    studentPersonId: string,
    justification: string
  ) => {
    setDraftPresenceMap((prev) => ({
      ...prev,
      [studentPersonId]: {
        ...prev[studentPersonId],
        justification,
      },
    }));
    setHasUnsavedDraftChanges(true);
  };

  const focusStudentRow = (targetIndex: number) => {
    const el = studentRowRefs.current[targetIndex];
    if (el) {
      el.focus();
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Ação rápida em lote (Chamada Invertida): "Marcar todos como presentes"
  const handleMarkAllPresent = () => {
    const nextMap: Record<
      string,
      { presence?: AttendancePresence; justification?: string }
    > = { ...draftPresenceMap };

    for (const { person } of enrolledStudents) {
      nextMap[person.id] = {
        presence: 'presente',
        justification: nextMap[person.id]?.justification ?? '',
      };
    }

    setDraftPresenceMap(nextMap);
    setHasUnsavedDraftChanges(true);
    setHighlightMissingAttempt(false);
    showToast({
      variant: 'info',
      title: 'Todos marcados como Presentes',
      description: 'Altere apenas os ausentes (F) ou justificados (J).',
    });
  };

  const handleClearAllMarks = () => {
    setDraftPresenceMap({});
    if (selectedLessonId) {
      try {
        localStorage.removeItem(getAttendanceDraftStorageKey(selectedLessonId));
      } catch {
        // ignore
      }
    }
    setDraftSavedAt(null);
    setHasUnsavedDraftChanges(false);
    setHighlightMissingAttempt(false);
  };

  // Progresso da chamada ("10 de 12 marcados")
  const totalStudentsCount = enrolledStudents.length;
  const markedStudentsCount = enrolledStudents.filter(({ person }) =>
    Boolean(draftPresenceMap[person.id]?.presence)
  ).length;
  const unmarkedStudents = enrolledStudents.filter(
    ({ person }) => !draftPresenceMap[person.id]?.presence
  );

  // Salvar Frequência e limpar rascunho do localStorage
  const handleSaveAttendance = () => {
    if (!selectedLessonId) return;

    if (unmarkedStudents.length > 0) {
      setHighlightMissingAttempt(true);
      showToast({
        variant: 'error',
        title: `Faltam ${unmarkedStudents.length} ${
          unmarkedStudents.length === 1 ? 'aluno' : 'alunos'
        } para marcar`,
        description:
          'Destacamos em vermelho os estudantes pendentes para evitar salvamento incompleto.',
      });
      return;
    }

    const selectedLesson = db.lessons.find((l) => l.id === selectedLessonId);
    const recordedDate = selectedLesson?.date ?? '2026-11-19';

    const batch: Attendance[] = enrolledStudents.map(({ person }) => {
      const entry = draftPresenceMap[person.id];
      return {
        id: `att-${selectedLessonId}-${person.id}`,
        lessonId: selectedLessonId,
        studentPersonId: person.id,
        presence: entry?.presence ?? 'presente',
        justification:
          entry?.presence === 'justificada'
            ? entry.justification?.trim() || 'Falta justificada em aula'
            : undefined,
        recordedAt: recordedDate,
      };
    });

    recordAttendanceBatch(batch, selectedLessonId);
    try {
      localStorage.removeItem(getAttendanceDraftStorageKey(selectedLessonId));
    } catch {
      // ignore
    }
    setDraftSavedAt(null);
    setHasUnsavedDraftChanges(false);
    setHighlightMissingAttempt(false);

    const presentTotal = batch.filter((b) => b.presence === 'presente').length;
    const absentTotal = batch.filter((b) => b.presence === 'falta').length;
    const justifiedTotal = batch.filter((b) => b.presence === 'justificada').length;

    showToast({
      variant: 'success',
      title: 'Frequência salva com sucesso',
      description: `${presentTotal} presentes, ${absentTotal} faltas e ${justifiedTotal} justificadas.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho com Indicador de Auto-Save + Chamada Invertida + CTA Único */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1>Frequência</h1>

          {draftSavedAt && (
            <span
              role="status"
              aria-live="polite"
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink-muted"
            >
              <span
                className="h-2 w-2 rounded-full bg-progress"
                aria-hidden="true"
              />
              <span>
                Rascunho salvo às <strong className="num text-ink">{draftSavedAt}</strong>
              </span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAllMarks}
            leftIcon={<RotateCcw className="h-4 w-4" />}
          >
            Limpar
          </Button>

          <Button
            variant="secondary"
            onClick={handleMarkAllPresent}
            leftIcon={<CheckCheck className="h-4 w-4" />}
          >
            Marcar todos como presentes
          </Button>

          <Button
            variant="primary"
            leftIcon={<Save className="h-4 w-4" />}
            onClick={handleSaveAttendance}
          >
            Salvar Frequência ({markedStudentsCount}/{totalStudentsCount})
          </Button>
        </div>
      </div>

      {/* Barra de Ferramentas: Seleção de Turma e Aula + Legenda Discreta de Atalhos no Rodapé */}
      <div className="rounded-lg border border-line bg-surface p-4 space-y-3">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Turma"
            value={selectedClassRoomId}
            onChange={(e) => setSelectedClassRoomId(e.target.value)}
            options={db.classRooms.map((c) => ({
              value: c.id,
              label: `${c.name} (${c.roomLabel})`,
            }))}
          />

          <Select
            label="Aula"
            value={selectedLessonId}
            onChange={(e) => setSelectedLessonId(e.target.value)}
            options={
              lessonsForClassRoom.length > 0
                ? lessonsForClassRoom.map((lesson) => {
                    const subj = db.subjects.find((s) => s.id === lesson.subjectId);
                    return {
                      value: lesson.id,
                      label: `${formatDateBR(lesson.date)} • ${subj?.name ?? 'Aula'}: ${
                        lesson.topic
                      }`,
                    };
                  })
                : [{ value: '', label: 'Nenhuma aula cadastrada' }]
            }
          />
        </div>

        {/* Legenda discreta dos atalhos de teclado no rodapé da barra de ferramentas */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5 text-xs text-ink-muted">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-medium text-ink">
              <Keyboard className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
              <span>Operação por teclado (foque um aluno):</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="num rounded border border-progress-border bg-progress-bg px-1.5 py-0.5 text-[11px] font-bold text-progress">
                P
              </kbd>
              <span>Presente</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="num rounded border border-critical-border bg-critical-bg px-1.5 py-0.5 text-[11px] font-bold text-critical">
                F
              </kbd>
              <span>Falta</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="num rounded border border-assess-border bg-assess-bg px-1.5 py-0.5 text-[11px] font-bold text-assess-ink">
                J
              </kbd>
              <span>Justificada</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="num rounded border border-line bg-subtle px-1.5 py-0.5 text-[11px] font-semibold text-ink">
                ↑ / ↓
              </kbd>
              <span>Navegar lista</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => focusStudentRow(0)}
            className="text-xs font-medium text-academic hover:underline"
          >
            Focar 1º aluno da lista →
          </button>
        </div>
      </div>

      {/* Lista de Chamada */}
      <div className="space-y-3">
        {highlightMissingAttempt && unmarkedStudents.length > 0 && (
          <CalloutAlert
            variant="error"
            title={`Marque a presença de ${unmarkedStudents.length} ${
              unmarkedStudents.length === 1 ? 'estudante pendente' : 'estudantes pendentes'
            }`}
          >
            Pendentes: {unmarkedStudents.map((u) => getDisplayName(u.person)).join(', ')}.
          </CalloutAlert>
        )}

        <div className="space-y-2.5">
          {enrolledStudents.map(({ person, enrollment }, idx) => {
            const entry = draftPresenceMap[person.id];
            const isMissing = highlightMissingAttempt && !entry?.presence;
            const accumulatedPct = getStudentAttendancePercentage(person.id);

            return (
              <StudentCard
                key={person.id}
                ref={(el) => {
                  studentRowRefs.current[idx] = el;
                }}
                student={person}
                enrollmentCode={enrollment.enrollmentCode}
                accumulatedAttendancePercentage={accumulatedPct}
                selectedPresence={entry?.presence}
                justification={entry?.justification}
                onChangePresence={(presence) =>
                  handleSetStudentPresence(person.id, presence)
                }
                onChangeJustification={(just) =>
                  handleSetStudentJustification(person.id, just)
                }
                isHighlightedAsMissing={isMissing}
                onAdvanceNext={() => {
                  if (idx + 1 < enrolledStudents.length) {
                    focusStudentRow(idx + 1);
                  }
                }}
                onMovePrev={() => {
                  if (idx - 1 >= 0) {
                    focusStudentRow(idx - 1);
                  }
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
