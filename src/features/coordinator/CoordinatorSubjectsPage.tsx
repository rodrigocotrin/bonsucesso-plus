import React, { useMemo, useState } from 'react';
import {
  FilePenLine,
  Plus,
  Power,
  RotateCcw,
  Save,
} from 'lucide-react';
import {
  Badge,
  Button,
  CalloutAlert,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  Modal,
  Select,
} from '../../components/ui';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import { useToast } from '../../contexts/ToastContext';
import { EnemArea, Subject } from '../../types';
import { getDisplayName } from '../../utils/formatters';

const ENEM_AREAS: EnemArea[] = [
  'Linguagens',
  'Ciências Humanas',
  'Ciências da Natureza',
  'Matemática',
  'Redação',
];

export const CoordinatorSubjectsPage: React.FC = () => {
  const { db, addSubject, updateSubject } = useMockDatabase();
  const { showToast } = useToast();

  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Enriquecimento das disciplinas com professores associados e total de aulas no mês
  const enrichedSubjects = useMemo(() => {
    return db.subjects.map((subject) => {
      const status = subject.status ?? 'active';
      const classSubjectsForThis = db.classSubjects.filter(
        (cs) => cs.subjectId === subject.id
      );
      const teacherIds = Array.from(
        new Set(classSubjectsForThis.map((cs) => cs.teacherPersonId))
      );
      const associatedTeachers = teacherIds
        .map((tid) => db.persons.find((p) => p.id === tid))
        .filter((p): p is NonNullable<typeof p> => Boolean(p));

      const lessonsInMonthCount = db.lessons.filter(
        (l) => l.subjectId === subject.id
      ).length;

      return {
        subject: { ...subject, status },
        associatedTeachers,
        lessonsInMonthCount: lessonsInMonthCount > 0 ? lessonsInMonthCount : 4,
      };
    });
  }, [db.subjects, db.classSubjects, db.persons, db.lessons]);

  const filteredSubjects = useMemo(() => {
    return enrichedSubjects.filter((item) => {
      const matchesArea =
        selectedAreaFilter === 'all' || item.subject.area === selectedAreaFilter;
      const matchesStatus =
        selectedStatusFilter === 'all' || item.subject.status === selectedStatusFilter;
      return matchesArea && matchesStatus;
    });
  }, [enrichedSubjects, selectedAreaFilter, selectedStatusFilter]);

  // Modal de Cadastro / Edição de Disciplina
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [area, setArea] = useState<EnemArea>('Ciências da Natureza');
  const [workloadHours, setWorkloadHours] = useState('50');
  const [nameError, setNameError] = useState('');

  // ConfirmDialog para Inativar / Reativar Disciplina
  const [statusTarget, setStatusTarget] = useState<Subject | null>(null);

  const handleOpenCreateModal = () => {
    setEditingSubjectId(null);
    setName('');
    setArea('Linguagens');
    setWorkloadHours('50');
    setNameError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (subj: Subject) => {
    setEditingSubjectId(subj.id);
    setName(subj.name);
    setArea(subj.area);
    setWorkloadHours(String(subj.workloadHours));
    setNameError('');
    setIsModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length < 3) {
      setNameError('Informe o nome da disciplina (mínimo 3 caracteres).');
      return;
    }

    // Verificação de duplicidade pelo nome da disciplina (case-insensitive)
    const duplicate = db.subjects.find(
      (s) =>
        s.id !== editingSubjectId &&
        s.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      setNameError(
        `Já existe uma disciplina cadastrada com o nome "${duplicate.name}".`
      );
      return;
    }

    const parsedWorkload = Math.max(10, Number(workloadHours) || 50);

    if (editingSubjectId) {
      const existing = db.subjects.find((s) => s.id === editingSubjectId);
      if (!existing) return;

      updateSubject({
        ...existing,
        name: trimmedName,
        area,
        workloadHours: parsedWorkload,
      });

      showToast({
        variant: 'success',
        title: 'Disciplina atualizada com sucesso!',
        description: `"${trimmedName}" (${area}) foi atualizada.`,
      });
    } else {
      const created: Subject = {
        id: `sub-${Date.now()}`,
        name: trimmedName,
        area,
        workloadHours: parsedWorkload,
        colorTag: 'teal',
        status: 'active',
      };
      addSubject(created);

      showToast({
        variant: 'success',
        title: 'Nova disciplina cadastrada!',
        description: `"${trimmedName}" foi adicionada à matriz do ENEM.`,
      });
    }

    setIsModalOpen(false);
  };

  const handleConfirmToggleStatus = () => {
    if (!statusTarget) return;
    const currentStatus = statusTarget.status ?? 'active';
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';

    updateSubject({
      ...statusTarget,
      status: nextStatus,
    });

    showToast({
      variant: nextStatus === 'active' ? 'success' : 'warning',
      title:
        nextStatus === 'active'
          ? 'Disciplina reativada!'
          : 'Disciplina inativada (Histórico preservado)',
      description: `O status de "${statusTarget.name}" foi alterado para ${
        nextStatus === 'active' ? 'Ativa' : 'Inativa'
      }.`,
    });
    setStatusTarget(null);
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho enxuto (Regra 2) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1>Disciplinas</h1>

        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={handleOpenCreateModal}
        >
          Nova Disciplina
        </Button>
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Área do ENEM"
            value={selectedAreaFilter}
            onChange={(e) => setSelectedAreaFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Todas as Áreas' },
              ...ENEM_AREAS.map((a) => ({ value: a, label: a })),
            ]}
          />

          <Select
            label="Situação"
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Todas' },
              { value: 'active', label: 'Ativas' },
              { value: 'inactive', label: 'Inativas' },
            ]}
          />
        </div>
      </Card>

      {filteredSubjects.length === 0 && (
        <EmptyState
          title="Nenhuma disciplina encontrada"
          description="Altere os filtros para visualizar as disciplinas cadastradas."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedAreaFilter('all');
                setSelectedStatusFilter('all');
              }}
            >
              Limpar filtros
            </Button>
          }
        />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSubjects.map(({ subject, associatedTeachers, lessonsInMonthCount }) => {
          const isActive = subject.status === 'active';
          return (
            <Card
              key={subject.id}
              className={!isActive ? 'opacity-75' : undefined}
              footer={
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEditModal(subject)}
                    leftIcon={<FilePenLine className="h-4 w-4" />}
                  >
                    Editar
                  </Button>

                  <Button
                    variant={isActive ? 'danger' : 'secondary'}
                    size="sm"
                    onClick={() => setStatusTarget(subject)}
                    leftIcon={
                      isActive ? (
                        <Power className="h-4 w-4" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )
                    }
                  >
                    {isActive ? 'Inativar' : 'Reativar'}
                  </Button>
                </div>
              }
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="academic">{subject.area}</Badge>
                    <h2 className="mt-1.5 text-base font-semibold text-ink">
                      {subject.name}
                    </h2>
                  </div>

                  <Badge variant={isActive ? 'progress' : 'neutral'}>
                    {isActive ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>

                <p className="text-xs text-ink-muted">
                  <span className="font-mono font-semibold text-ink tabular-nums">
                    {lessonsInMonthCount}
                  </span>{' '}
                  aulas/mês •{' '}
                  <span className="font-mono font-semibold text-ink tabular-nums">
                    {subject.workloadHours}h
                  </span>{' '}
                  no semestre
                </p>

                <div className="pt-1">
                  {associatedTeachers.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {associatedTeachers.map((teacher) => (
                        <Badge key={teacher.id} variant="neutral">
                          {getDisplayName(teacher)}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-ink-muted">Sem docente vinculado</p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO DE DISCIPLINA */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingSubjectId
            ? 'Editar Disciplina'
            : 'Nova Disciplina'
        }
        description="O sistema verifica automaticamente se já existe uma disciplina com o mesmo nome."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveSubject}
              leftIcon={<Save className="h-4 w-4" />}
            >
              {editingSubjectId ? 'Salvar Alterações' : 'Cadastrar Disciplina'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveSubject} className="space-y-4" noValidate>
          <Input
            label="Nome da Disciplina"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameError('');
            }}
            errorText={nameError}
            placeholder="Ex: Literatura Brasileira, Atualidades, Filosofia e Sociologia..."
          />

          <Select
            label="Área de Conhecimento do ENEM"
            required
            value={area}
            onChange={(e) => setArea(e.target.value as EnemArea)}
            options={ENEM_AREAS.map((a) => ({ value: a, label: a }))}
          />

          <Input
            label="Carga Horária Estimada no Semestre (Horas)"
            type="number"
            min={10}
            max={200}
            required
            value={workloadHours}
            onChange={(e) => setWorkloadHours(e.target.value)}
          />

          {nameError && (
            <CalloutAlert variant="error" title="Nome de disciplina duplicado ou inválido">
              {nameError}
            </CalloutAlert>
          )}
        </form>
      </Modal>

      {/* CONFIRM DIALOG PARA INATIVAR / REATIVAR DISCIPLINA */}
      <ConfirmDialog
        isOpen={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleConfirmToggleStatus}
        variant={(statusTarget?.status ?? 'active') === 'active' ? 'danger' : 'primary'}
        title={
          (statusTarget?.status ?? 'active') === 'active'
            ? `Inativar a disciplina "${statusTarget?.name}"?`
            : `Reativar a disciplina "${statusTarget?.name}"?`
        }
        description="A inativação suspende novas alocações desta disciplina, mantendo todas as aulas e frequências históricas intactas."
        confirmLabel={
          (statusTarget?.status ?? 'active') === 'active'
            ? 'Sim, inativar disciplina'
            : 'Sim, reativar disciplina'
        }
        cancelLabel="Cancelar"
      />
    </div>
  );
};
