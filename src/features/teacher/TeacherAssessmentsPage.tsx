import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  GraduationCap,
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
import { Assessment, AssessmentType, Grade } from '../../types';
import { formatDateBR, getDisplayName } from '../../utils/formatters';
import { validateGradeScore } from '../../utils/validators';

interface DraftGradeRow {
  scoreText: string;
  feedback: string;
  errorMessage?: string;
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

  // Alunos matriculados na turma selecionada
  const enrolledStudents = useMemo(() => {
    return db.enrollments
      .filter((e) => e.classRoomId === selectedClassRoomId && e.status === 'ativa')
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

  // Estado local da grade de lançamento em lote
  const [draftGrades, setDraftGrades] = useState<Record<string, DraftGradeRow>>({});

  // Refs para navegação rápida via Enter entre as linhas da coluna de Nota
  const scoreInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!currentAssessment) return;
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
  }, [currentAssessment, enrolledStudents, db.grades]);

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
  };

  const handleScoreKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextInput = scoreInputRefs.current[rowIndex + 1];
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
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
        title: 'Corrija as notas fora do intervalo permitido!',
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

      // Mantém areaScores proporcionais se for um simulado ENEM (0-1000)
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
    showToast({
      variant: 'success',
      title: 'Notas salvas em lote com sucesso!',
      description: `${gradesToSave.length} ${
        gradesToSave.length === 1 ? 'nota lançada' : 'notas lançadas'
      } em "${currentAssessment.title}". O portal do Aluno e do Responsável já foi atualizado!`,
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
      title: 'Nova avaliação criada!',
      description: `"${created.title}" (escala de 0 a ${created.maxScore} pts) pronta para lançamento de notas.`,
    });
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="primary" icon={<GraduationCap className="h-4 w-4" />}>
            Avaliações e Lançamento em Lote (UC19)
          </Badge>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Avaliações e Lançamento de Notas
          </h1>
          <p className="mt-1 max-w-3xl text-base text-slate-600 dark:text-slate-300">
            Selecione uma avaliação existente ou crie uma nova (escala ENEM de 0 a 1.000 ou lista de
            0 a 10) para lançar notas em lote com navegação rápida por teclado.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          leftIcon={<Plus className="h-5 w-5" />}
          onClick={() => setIsNewModalOpen(true)}
        >
          Nova Avaliação / Simulado
        </Button>
      </div>

      {/* 1. SELEÇÃO DE TURMA E AVALIAÇÃO */}
      <Card
        as="section"
        title="1. Selecionar Turma e Avaliação"
        subtitle="Escolha a turma e o simulado/atividade para carregar a grade de notas."
      >
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
            label="Avaliação ou Simulado"
            value={selectedAssessmentId}
            onChange={(e) => setSelectedAssessmentId(e.target.value)}
            options={availableAssessments.map((a) => ({
              value: a.id,
              label: `${a.title} (0 a ${a.maxScore} pts • ${formatDateBR(a.date)})`,
            }))}
          />
        </div>
      </Card>

      {/* 2. GRADE DE LANÇAMENTO RÁPIDO EM LOTE */}
      {currentAssessment && (
        <Card
          as="section"
          title={`2. Grade de Lançamento em Lote — ${currentAssessment.title}`}
          subtitle={`Intervalo permitido: de 0 até ${currentAssessment.maxScore} pontos. Pressione Tab ou Enter para avançar rapidamente para o próximo aluno.`}
          headerAction={
            <Badge variant="secondary" icon={<Keyboard className="h-4 w-4" />}>
              Escala: 0 a {currentAssessment.maxScore} pts
            </Badge>
          }
        >
          <div className="space-y-6">
            {hasValidationErrors && (
              <CalloutAlert
                variant="error"
                title="Há notas fora do intervalo permitido na lista abaixo"
              >
                Por favor, corrija os campos destacados em vermelho antes de salvar. Nenhuma nota
                pode ser negativa ou ultrapassar <strong>{maxScore} pontos</strong>.
              </CalloutAlert>
            )}

            <div className="space-y-4">
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
                    className={`rounded-2xl border-2 p-4 transition-all ${
                      hasRowError
                        ? 'border-danger-600 bg-danger-50/50 dark:border-red-500 dark:bg-danger-950/30'
                        : 'border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/50'
                    }`}
                  >
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
                      {/* Identificação do Estudante (4 cols) */}
                      <div className="lg:col-span-4 space-y-1">
                        <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                          #{idx + 1} • Matrícula {enrollment.enrollmentCode}
                        </span>
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                          {displayName}
                        </h3>
                        {person.socialName && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Reg. civil: {person.fullName}
                          </p>
                        )}
                      </div>

                      {/* Campo de Nota com Validação em Tempo Real (3 cols) */}
                      <div className="lg:col-span-3">
                        <label
                          htmlFor={`grade-input-${person.id}`}
                          className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1"
                        >
                          Nota (0 a {maxScore})
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
                          className={`w-full min-h-[44px] rounded-xl border-2 px-3.5 py-2 text-base font-extrabold transition-colors bg-white text-slate-900 dark:bg-slate-900 dark:text-white ${
                            hasRowError
                              ? 'border-danger-700 dark:border-red-500'
                              : 'border-slate-300 dark:border-slate-700 focus-visible:border-primary-700'
                          }`}
                        />
                        {hasRowError && (
                          <p
                            role="alert"
                            className="mt-1 flex items-start gap-1 text-xs font-bold text-danger-700 dark:text-red-300"
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
                          className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1"
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
                          placeholder="Ex: Ótima evolução na Competência 5; revisar funções..."
                          className="w-full min-h-[44px] rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Dica: Você pode deixar em branco os alunos que faltaram no dia do simulado e lançar
                a nota deles depois.
              </p>

              <Button
                variant="primary"
                size="lg"
                disabled={hasValidationErrors}
                leftIcon={<Save className="h-5 w-5" />}
                onClick={handleSaveBatchGrades}
              >
                Salvar Notas em Lote
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* MODAL PARA CRIAR NOVA AVALIAÇÃO / SIMULADO */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Criar Nova Avaliação ou Simulado"
        description="Defina o título, o tipo de atividade e a pontuação máxima (ex: 1000 para padrão ENEM ou 10 para lista de exercícios)."
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
