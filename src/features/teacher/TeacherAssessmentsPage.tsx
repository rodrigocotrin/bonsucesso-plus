import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Keyboard,
  Plus,
  Save,
} from 'lucide-react';
import {
  Badge,
  Button,
  CalloutAlert,
  Card,
  Input,
  Modal,
  Select,
} from '../../components/ui';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import { useToast } from '../../contexts/ToastContext';
import { getDisplayName } from '../../lib/person';
import { Assessment, AssessmentType, Grade } from '../../types';
import { formatDateBR } from '../../utils/formatters';
import { validateGradeScore } from '../../utils/validators';

interface DraftGradeRow {
  scoreText: string;
  feedback: string;
  errorMessage?: string;
}

interface GradesDraftPayload {
  savedAt: string; // HH:mm
  rows: Record<string, DraftGradeRow>;
}

function getGradesDraftStorageKey(assessmentId: string, classRoomId: string): string {
  return `bonsucesso_draft_grades_${assessmentId}_${classRoomId}`;
}

function formatNowTimeHHMM(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
}

export const TeacherAssessmentsPage: React.FC = () => {
  const { db, addAssessment, saveGradeBatch } = useMockDatabase();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [selectedClassRoomId, setSelectedClassRoomId] = useState<string>(
    searchParams.get('classRoomId') ?? 'cls-esperanca'
  );

  // Avaliações disponíveis para a turma selecionada (ou simulados gerais 'all')
  const availableAssessments = useMemo(() => {
    return db.assessments.filter(
      (a) => a.classRoomId === 'all' || a.classRoomId === selectedClassRoomId
    );
  }, [db.assessments, selectedClassRoomId]);

  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(
    searchParams.get('assessmentId') ??
      availableAssessments[availableAssessments.length - 1]?.id ??
      ''
  );

  useEffect(() => {
    const exists = availableAssessments.some((a) => a.id === selectedAssessmentId);
    if (!exists && availableAssessments.length > 0) {
      setSelectedAssessmentId(
        availableAssessments[availableAssessments.length - 1].id
      );
    }
  }, [availableAssessments, selectedAssessmentId]);

  const currentAssessment = useMemo(
    () => db.assessments.find((a) => a.id === selectedAssessmentId),
    [db.assessments, selectedAssessmentId]
  );

  // Alunos matriculados na turma selecionada (ordenados por Nome Social / getDisplayName)
  const enrolledStudents = useMemo(() => {
    return db.enrollments
      .filter((e) => e.classRoomId === selectedClassRoomId && e.status === 'ativa')
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

  // Estado local da grade de lançamento em lote + Auto-Save (600ms debounce)
  const [draftGrades, setDraftGrades] = useState<Record<string, DraftGradeRow>>({});
  const [hasUnsavedDraftChanges, setHasUnsavedDraftChanges] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  // Refs para navegação rápida via Enter / ↑ / ↓ entre as linhas da coluna de Nota
  const scoreInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!currentAssessment) return;

    try {
      const savedRaw = localStorage.getItem(
        getGradesDraftStorageKey(currentAssessment.id, selectedClassRoomId)
      );
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw) as GradesDraftPayload;
        if (parsed && parsed.rows) {
          setDraftGrades(parsed.rows);
          setDraftSavedAt(parsed.savedAt);
          setHasUnsavedDraftChanges(false);
          return;
        }
      }
    } catch {
      // ignore storage error
    }

    const map: Record<string, DraftGradeRow> = {};

    for (const { person } of enrolledStudents) {
      const existing = db.grades.find(
        (g) =>
          g.assessmentId === currentAssessment.id &&
          g.studentPersonId === person.id
      );
      map[person.id] = {
        scoreText: existing ? String(existing.score) : '',
        feedback: existing?.feedback ?? '',
      };
    }

    setDraftGrades(map);
    setDraftSavedAt(null);
    setHasUnsavedDraftChanges(false);
  }, [currentAssessment, selectedClassRoomId, enrolledStudents, db.grades]);

  // Auto-save com debounce de 600ms no localStorage
  useEffect(() => {
    if (!currentAssessment || !hasUnsavedDraftChanges) return;

    const timer = window.setTimeout(() => {
      const timeLabel = formatNowTimeHHMM();
      const payload: GradesDraftPayload = {
        savedAt: timeLabel,
        rows: draftGrades,
      };
      try {
        localStorage.setItem(
          getGradesDraftStorageKey(currentAssessment.id, selectedClassRoomId),
          JSON.stringify(payload)
        );
        setDraftSavedAt(timeLabel);
        setHasUnsavedDraftChanges(false);
      } catch {
        // ignore quota errors
      }
    }, 600);

    return () => window.clearTimeout(timer);
  }, [currentAssessment, selectedClassRoomId, draftGrades, hasUnsavedDraftChanges]);

  const maxScore = currentAssessment?.maxScore ?? 1000;

  const handleScoreChange = (studentPersonId: string, rawText: string) => {
    const validation = validateGradeScore(rawText, maxScore);
    setDraftGrades((prev) => ({
      ...prev,
      [studentPersonId]: {
        scoreText: rawText,
        feedback: prev[studentPersonId]?.feedback ?? '',
        errorMessage: validation.isValid ? undefined : validation.errorMessage,
      },
    }));
    setHasUnsavedDraftChanges(true);
  };

  const handleFeedbackChange = (studentPersonId: string, feedback: string) => {
    setDraftGrades((prev) => ({
      ...prev,
      [studentPersonId]: {
        ...prev[studentPersonId],
        scoreText: prev[studentPersonId]?.scoreText ?? '',
        feedback,
      },
    }));
    setHasUnsavedDraftChanges(true);
  };

  const handleScoreKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number
  ) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextInput = scoreInputRefs.current[rowIndex + 1];
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = scoreInputRefs.current[rowIndex - 1];
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  };

  const hasValidationErrors = useMemo(() => {
    return Object.values(draftGrades).some((row) => Boolean(row.errorMessage));
  }, [draftGrades]);

  const handleSaveBatchGrades = () => {
    if (!currentAssessment) return;

    if (hasValidationErrors) {
      showToast({
        variant: 'error',
        title: 'Corrija as notas fora do intervalo permitido',
        description: `As notas devem estar entre 0 e ${maxScore} pontos.`,
      });
      return;
    }

    const gradesToSave: Grade[] = [];
    for (const { person } of enrolledStudents) {
      const row = draftGrades[person.id];
      if (!row || row.scoreText.trim() === '') continue;

      const check = validateGradeScore(row.scoreText, maxScore);
      if (!check.isValid || check.numericValue === null) continue;

      const existing = db.grades.find(
        (g) =>
          g.assessmentId === currentAssessment.id &&
          g.studentPersonId === person.id
      );

      const val = check.numericValue;
      const areaScores =
        currentAssessment.maxScore === 1000
          ? existing?.areaScores ?? {
              linguagens: Math.max(0, Math.min(1000, Math.round(val - 20))),
              matematica: Math.max(0, Math.min(1000, Math.round(val - 30))),
              natureza: Math.max(0, Math.min(1000, Math.round(val - 15))),
              humanas: Math.max(0, Math.min(1000, Math.round(val + 15))),
              redacao: Math.max(0, Math.min(1000, Math.round(val + 50))),
            }
          : undefined;

      gradesToSave.push({
        id: existing?.id ?? `grd-${currentAssessment.id}-${person.id}`,
        assessmentId: currentAssessment.id,
        studentPersonId: person.id,
        score: val,
        areaScores,
        feedback: row.feedback.trim() || undefined,
        recordedAt: new Date().toISOString().slice(0, 10),
      });
    }

    if (gradesToSave.length === 0) {
      showToast({
        variant: 'warning',
        title: 'Nenhuma nota preenchida para salvar',
        description: 'Digite a nota de pelo menos um estudante antes de salvar o lote.',
      });
      return;
    }

    saveGradeBatch(gradesToSave);
    try {
      localStorage.removeItem(
        getGradesDraftStorageKey(currentAssessment.id, selectedClassRoomId)
      );
    } catch {
      // ignore
    }
    setDraftSavedAt(null);
    setHasUnsavedDraftChanges(false);

    showToast({
      variant: 'success',
      title: 'Notas salvas em lote com sucesso',
      description: `${gradesToSave.length} ${
        gradesToSave.length === 1 ? 'nota lançada' : 'notas lançadas'
      } em "${currentAssessment.title}".`,
    });
  };

  // Modal de Criar Nova Avaliação / Simulado
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<AssessmentType>('simulado_enem');
  const [newDate, setNewDate] = useState('2026-11-28');
  const [newMaxScore, setNewMaxScore] = useState('1000');
  const [newDescription, setNewDescription] = useState('');
  const [newTitleError, setNewTitleError] = useState('');

  const handleCreateAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim().length < 4) {
      setNewTitleError('Informe um título claro para a avaliação (mínimo 4 caracteres).');
      return;
    }

    const parsedMax = Number(newMaxScore) || 1000;
    const created: Assessment = {
      id: `ass-${Date.now()}`,
      periodId: 'per-2026-2',
      classRoomId: selectedClassRoomId,
      title: newTitle.trim(),
      type: newType,
      date: newDate,
      maxScore: parsedMax,
      description:
        newDescription.trim() ||
        'Avaliação pedagógica cadastrada pelo professor voluntário.',
    };

    addAssessment(created);
    setSelectedAssessmentId(created.id);
    setIsNewModalOpen(false);
    setNewTitle('');
    setNewDescription('');
    setNewTitleError('');

    showToast({
      variant: 'success',
      title: 'Nova avaliação criada',
      description: `"${created.title}" (0 a ${created.maxScore} pts) pronta para lançamento.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho com Indicador de Auto-Save + CTA Único */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1>Avaliações</h1>

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
            variant="secondary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsNewModalOpen(true)}
          >
            Nova Avaliação
          </Button>

          <Button
            variant="primary"
            disabled={hasValidationErrors}
            leftIcon={<Save className="h-4 w-4" />}
            onClick={handleSaveBatchGrades}
          >
            Salvar Notas
          </Button>
        </div>
      </div>

      {/* Seleção de Turma e Avaliação + Legenda de Atalhos */}
      <div className="rounded-lg border border-line bg-surface p-4 space-y-3">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Turma"
            value={selectedClassRoomId}
            onChange={(e) => setSelectedClassRoomId(e.target.value)}
            options={db.classRooms.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
          />

          <Select
            label="Avaliação"
            value={selectedAssessmentId}
            onChange={(e) => setSelectedAssessmentId(e.target.value)}
            options={availableAssessments.map((a) => ({
              value: a.id,
              label: `${a.title} (0–${a.maxScore} pts • ${formatDateBR(a.date)})`,
            }))}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5 text-xs text-ink-muted">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-medium text-ink">
              <Keyboard className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
              <span>Atalhos na coluna de nota:</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="num rounded border border-line bg-subtle px-1.5 py-0.5 text-[11px] font-semibold text-ink">
                Enter
              </kbd>
              <span>Próximo aluno</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="num rounded border border-line bg-subtle px-1.5 py-0.5 text-[11px] font-semibold text-ink">
                ↑ / ↓
              </kbd>
              <span>Subir / descer linha</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => scoreInputRefs.current[0]?.focus()}
            className="text-xs font-medium text-academic hover:underline"
          >
            Focar 1ª nota →
          </button>
        </div>
      </div>

      {/* GRADE DE LANÇAMENTO RÁPIDO EM LOTE */}
      {currentAssessment && (
        <Card
          as="section"
          title={currentAssessment.title}
          headerAction={
            <Badge variant="academic">
              Escala: 0 a {currentAssessment.maxScore} pts
            </Badge>
          }
        >
          <div className="space-y-4">
            {hasValidationErrors && (
              <CalloutAlert
                variant="error"
                title="Há notas fora do intervalo permitido"
              >
                Corrija os campos destacados em vermelho antes de salvar (0 a{' '}
                <strong className="num">{maxScore}</strong> pontos).
              </CalloutAlert>
            )}

            <div className="divide-y divide-line">
              {enrolledStudents.map(({ person, enrollment }, idx) => {
                const row = draftGrades[person.id] ?? {
                  scoreText: '',
                  feedback: '',
                };
                const hasRowError = Boolean(row.errorMessage);
                const displayName = getDisplayName(person);

                return (
                  <div
                    key={person.id}
                    className={`py-3.5 first:pt-0 last:pb-0 ${
                      hasRowError ? 'rounded-md bg-critical-bg px-3' : ''
                    }`}
                  >
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-center">
                      {/* Identificação do Estudante (Prioridade total ao Nome Social — 4 cols) */}
                      <div className="lg:col-span-4">
                        <span className="num text-xs font-medium text-ink-muted">
                          #{idx + 1} • {enrollment.enrollmentCode}
                        </span>
                        <h3 className="text-sm font-semibold text-ink">
                          {displayName}
                        </h3>
                      </div>

                      {/* Campo de Nota com Validação em Tempo Real (3 cols) */}
                      <div className="lg:col-span-3">
                        <label
                          htmlFor={`grade-input-${person.id}`}
                          className="mb-1 block text-xs font-medium text-ink-muted"
                        >
                          Nota (0 a <span className="num">{maxScore}</span>)
                        </label>
                        <input
                          ref={(el) => {
                            scoreInputRefs.current[idx] = el;
                          }}
                          id={`grade-input-${person.id}`}
                          type="number"
                          min={0}
                          max={maxScore}
                          step={maxScore === 1000 ? 10 : 0.5}
                          value={row.scoreText}
                          onChange={(e) =>
                            handleScoreChange(person.id, e.target.value)
                          }
                          onKeyDown={(e) => handleScoreKeyDown(e, idx)}
                          placeholder={`0 a ${maxScore}`}
                          aria-invalid={hasRowError}
                          className={`num h-10 w-full rounded-md border px-3 text-sm font-semibold transition-colors bg-surface text-ink ${
                            hasRowError
                              ? 'border-critical'
                              : 'border-line focus-visible:border-ink'
                          }`}
                        />
                        {hasRowError && (
                          <p
                            role="alert"
                            className="mt-1 flex items-start gap-1 text-xs font-medium text-critical"
                          >
                            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{row.errorMessage}</span>
                          </p>
                        )}
                      </div>

                      {/* Campo Opcional de Observação Pedagógica (5 cols) */}
                      <div className="lg:col-span-5">
                        <label
                          htmlFor={`feedback-input-${person.id}`}
                          className="mb-1 block text-xs font-medium text-ink-muted"
                        >
                          Observação Pedagógica (Opcional)
                        </label>
                        <input
                          id={`feedback-input-${person.id}`}
                          type="text"
                          value={row.feedback}
                          onChange={(e) =>
                            handleFeedbackChange(person.id, e.target.value)
                          }
                          placeholder="Ex: Boa evolução na Competência 5; revisar funções..."
                          className="h-10 w-full rounded-md border border-line bg-surface px-3 text-xs text-ink"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* MODAL PARA CRIAR NOVA AVALIAÇÃO / SIMULADO */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        isDirty={Boolean(newTitle.trim() || newDescription.trim())}
        title="Criar Nova Avaliação ou Simulado"
        description="Defina o título, o tipo de atividade e a pontuação máxima."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsNewModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateAssessment}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Criar Avaliação
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateAssessment} className="space-y-4" noValidate>
          <Input
            label="Título da Avaliação ou Simulado"
            required
            value={newTitle}
            onChange={(e) => {
              setNewTitle(e.target.value);
              if (e.target.value.trim().length >= 4) setNewTitleError('');
            }}
            errorText={newTitleError}
            placeholder="Ex: 4º Simulado Geral ENEM ou Lista Avaliativa de Funções"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Tipo de Avaliação"
              required
              value={newType}
              onChange={(e) => {
                const t = e.target.value as AssessmentType;
                setNewType(t);
                setNewMaxScore(t === 'atividade' ? '10' : '1000');
              }}
              options={[
                { value: 'simulado_enem', label: 'Simulado Padrão ENEM (0 a 1000)' },
                { value: 'redacao_enem', label: 'Redação Modelo ENEM (0 a 1000)' },
                { value: 'atividade', label: 'Lista de Exercícios / Atividade (0 a 10)' },
              ]}
            />

            <Select
              label="Pontuação Máxima Permitida"
              required
              value={newMaxScore}
              onChange={(e) => setNewMaxScore(e.target.value)}
              options={[
                { value: '1000', label: '1.000 pontos (Escala Oficial ENEM)' },
                { value: '100', label: '100 pontos (Escala Percentual)' },
                { value: '10', label: '10 pontos (Lista / Atividade de Sala)' },
              ]}
            />
          </div>

          <Input
            label="Data de Aplicação"
            type="date"
            required
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />

          <Input
            label="Descrição ou Critérios de Correção"
            optionalText="Opcional"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Ex: Resolução de 15 questões contextualizadas de Matemática."
          />
        </form>
      </Modal>
    </div>
  );
};
