import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCheck,
  ClipboardCheck,
  RotateCcw,
  Save,
  Users,
} from 'lucide-react';
import {
  Badge,
  Button,
  CalloutAlert,
  Card,
  Select,
} from '../../components/ui';
import { StudentCard } from '../../components/shared/StudentCard';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import { useToast } from '../../contexts/ToastContext';
import { Attendance, AttendancePresence } from '../../types';
import { formatDateBR, getDisplayName } from '../../utils/formatters';

export const TeacherAttendancePage: React.FC = () => {
  const { db, getStudentAttendancePercentage, recordAttendanceBatch } = useMockDatabase();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  // Inicializa turma e aula a partir da URL (quando clicado em "Fazer chamada agora")
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

  // Atualiza aula selecionada caso a turma mude e a aula atual não pertença a ela
  useEffect(() => {
    const belongs = lessonsForClassRoom.some((l) => l.id === selectedLessonId);
    if (!belongs && lessonsForClassRoom.length > 0) {
      setSelectedLessonId(lessonsForClassRoom[0].id);
    }
  }, [lessonsForClassRoom, selectedLessonId]);

  // Alunos com matrícula ativa na turma selecionada
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
        (item): item is { person: NonNullable<typeof item>['person']; enrollment: NonNullable<typeof item>['enrollment'] } =>
          Boolean(item)
      )
      .sort((a, b) =>
        getDisplayName(a.person).localeCompare(getDisplayName(b.person), 'pt-BR')
      );
  }, [db.enrollments, db.persons, selectedClassRoomId]);

  // Estado local da chamada: mapa studentPersonId -> { presence, justification }
  const [draftPresenceMap, setDraftPresenceMap] = useState<
    Record<string, { presence?: AttendancePresence; justification?: string }>
  >({});

  // Flag para destacar visualmente alunos sem marcação caso o professor tente salvar incompleto
  const [highlightMissingAttempt, setHighlightMissingAttempt] = useState(false);

  // Carrega registros existentes da store quando a aula selecionada muda
  useEffect(() => {
    if (!selectedLessonId) return;
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
    setHighlightMissingAttempt(false);
  }, [selectedLessonId, db.attendances]);

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
  };

  // Ação rápida em lote: "Marcar todos como presentes"
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
    setHighlightMissingAttempt(false);
    showToast({
      variant: 'info',
      title: 'Todos marcados como Presentes!',
      description: 'Agora basta alterar apenas quem faltou ou teve falta justificada.',
    });
  };

  const handleClearAllMarks = () => {
    setDraftPresenceMap({});
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
  const progressPercentage =
    totalStudentsCount > 0
      ? Math.round((markedStudentsCount / totalStudentsCount) * 100)
      : 0;

  // Validação obrigatória ao clicar em "Salvar Frequência" (Heurística de Prevenção de Erros)
  const handleSaveAttendance = () => {
    if (!selectedLessonId) return;

    if (unmarkedStudents.length > 0) {
      setHighlightMissingAttempt(true);
      showToast({
        variant: 'error',
        title: `Faltam ${unmarkedStudents.length} ${
          unmarkedStudents.length === 1 ? 'aluno' : 'alunos'
        } para marcar!`,
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
    setHighlightMissingAttempt(false);

    const presentTotal = batch.filter((b) => b.presence === 'presente').length;
    const absentTotal = batch.filter((b) => b.presence === 'falta').length;
    const justifiedTotal = batch.filter((b) => b.presence === 'justificada').length;

    showToast({
      variant: 'success',
      title: 'Frequência da turma salva com sucesso!',
      description: `Registrados: ${presentTotal} presentes, ${absentTotal} faltas e ${justifiedTotal} justificadas. O portal do Aluno e do Responsável já foi atualizado.`,
    });
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <Badge variant="primary" icon={<ClipboardCheck className="h-4 w-4" />}>
          Diário de Classe Ágil • Sincronizado em Tempo Real (UC17)
        </Badge>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Chamada e Registro de Frequência
        </h1>
        <p className="mt-1 max-w-3xl text-base text-slate-600 dark:text-slate-300">
          Use o botão <strong>"Marcar todos como presentes"</strong> para ganhar tempo em sala e
          toque apenas nos estudantes ausentes.
        </p>
      </div>

      {/* 1. SELEÇÃO DA TURMA E DA AULA */}
      <Card
        as="section"
        title="1. Selecionar Turma e Aula"
        subtitle="Escolha a turma e o encontro para carregar a lista de estudantes matriculados."
      >
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
            label="Aula do Plano de Ensino"
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
                : [{ value: '', label: 'Nenhuma aula cadastrada para esta turma' }]
            }
          />
        </div>
      </Card>

      {/* 2. BARRA DE PROGRESSO DA CHAMADA + AÇÃO RÁPIDA EM LOTE */}
      <Card
        as="section"
        title="2. Registro de Presença dos Estudantes"
        subtitle="Todos os estudantes da turma precisam ter uma opção marcada antes de salvar."
        headerAction={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              onClick={handleClearAllMarks}
              leftIcon={<RotateCcw className="h-4 w-4" />}
            >
              Limpar marcações
            </Button>

            <Button
              variant="secondary"
              onClick={handleMarkAllPresent}
              leftIcon={<CheckCheck className="h-5 w-5" />}
            >
              Marcar todos como presentes
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Barra de Progresso ("10 de 12 marcados") */}
          <div className="rounded-2xl border-2 border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
                <Users className="h-5 w-5 text-primary-700 dark:text-primary-400" aria-hidden="true" />
                <span>
                  Progresso da chamada: {markedStudentsCount} de {totalStudentsCount}{' '}
                  {totalStudentsCount === 1 ? 'aluno marcado' : 'alunos marcados'}
                </span>
              </span>

              <Badge
                variant={
                  markedStudentsCount === totalStudentsCount ? 'success' : 'warning'
                }
              >
                {markedStudentsCount === totalStudentsCount
                  ? '100% pronto para salvar'
                  : `Faltam ${totalStudentsCount - markedStudentsCount} para marcar`}
              </Badge>
            </div>

            <div
              role="progressbar"
              aria-label="Progresso de preenchimento da lista de chamada"
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-3.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  markedStudentsCount === totalStudentsCount
                    ? 'bg-emerald-700 dark:bg-emerald-500'
                    : 'bg-primary-700 dark:bg-primary-500'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Alerta de Prevenção de Erros caso o professor tenha tentado salvar incompleto */}
          {highlightMissingAttempt && unmarkedStudents.length > 0 && (
            <CalloutAlert
              variant="error"
              title={`Não foi possível salvar: há ${unmarkedStudents.length} ${
                unmarkedStudents.length === 1
                  ? 'estudante sem marcação'
                  : 'estudantes sem marcação'
              }`}
            >
              Para evitar erros no histórico de frequência, marque{' '}
              <strong>Presente</strong>, <strong>Falta</strong> ou{' '}
              <strong>Justificada</strong> para:{' '}
              <strong>
                {unmarkedStudents.map((u) => getDisplayName(u.person)).join(', ')}
              </strong>
              .
            </CalloutAlert>
          )}

          {/* Lista de Estudantes usando o componente reutilizável StudentCard */}
          <div className="space-y-3">
            {enrolledStudents.map(({ person, enrollment }) => {
              const entry = draftPresenceMap[person.id];
              const isMissing =
                highlightMissingAttempt && !entry?.presence;
              const accumulatedPct = getStudentAttendancePercentage(person.id);

              return (
                <StudentCard
                  key={person.id}
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
                />
              );
            })}
          </div>

          {/* Rodapé de Ação Principal */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Ao salvar, a porcentagem de presença de cada estudante é recalculada
              automaticamente.
            </p>

            <Button
              variant="primary"
              size="lg"
              leftIcon={<Save className="h-5 w-5" />}
              onClick={handleSaveAttendance}
            >
              Salvar Frequência da Turma ({markedStudentsCount}/{totalStudentsCount})
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
