import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  FilePenLine,
  Plus,
  Power,
  RotateCcw,
  Save,
  Users,
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
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="primary" icon={<BookOpen className="h-4 w-4" />}>
            Matriz Curricular ENEM (UC11)
          </Badge>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Gestão de Disciplinas
          </h1>
          <p className="mt-1 max-w-3xl text-base text-slate-600 dark:text-slate-300">
            Organize as disciplinas oferecidas pelo cursinho alinhadas às áreas de conhecimento do
            ENEM, confira os professores voluntários associados e gerencie o status de oferta.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          leftIcon={<Plus className="h-5 w-5" />}
          onClick={handleOpenCreateModal}
        >
          Cadastrar Disciplina
        </Button>
      </div>

      {/* Filtros por Área do ENEM e Status */}
      <Card
        as="section"
        title="Filtrar Disciplinas por Área do ENEM"
        subtitle="Selecione uma área de conhecimento ou status para filtrar os cartões abaixo."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Área de Conhecimento do ENEM"
            value={selectedAreaFilter}
            onChange={(e) => setSelectedAreaFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Todas as Áreas do ENEM' },
              ...ENEM_AREAS.map((a) => ({ value: a, label: a })),
            ]}
          />

          <Select
            label="Status da Disciplina"
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Todas (Ativas e Inativas)' },
              { value: 'active', label: 'Somente Ativas' },
              { value: 'inactive', label: 'Somente Inativas' },
            ]}
          />
        </div>
      </Card>

      {/* Grade de Cards de Disciplinas ou EmptyState */}
      {filteredSubjects.length === 0 && (
        <EmptyState
          title="Nenhuma disciplina encontrada para este filtro"
          description="Altere o filtro de área do ENEM ou de status para visualizar as disciplinas cadastradas."
          action={
            <Button
              variant="primary"
              onClick={() => {
                setSelectedAreaFilter('all');
                setSelectedStatusFilter('all');
              }}
            >
              Mostrar Todas as Disciplinas
            </Button>
          }
        />
      )}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredSubjects.map(({ subject, associatedTeachers, lessonsInMonthCount }) => {
          const isActive = subject.status === 'active';
          return (
            <Card
              key={subject.id}
              className={`flex flex-col justify-between ${
                isActive
                  ? 'border-t-4 border-t-primary-700 dark:border-t-primary-500'
                  : 'opacity-80 border-t-4 border-t-slate-400'
              }`}
              footer={
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => handleOpenEditModal(subject)}
                    leftIcon={<FilePenLine className="h-4 w-4" />}
                  >
                    Editar
                  </Button>

                  <Button
                    variant={isActive ? 'danger' : 'primary'}
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
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="secondary">{subject.area}</Badge>
                    <h2 className="mt-2 text-xl font-extrabold text-slate-900 dark:text-white">
                      {subject.name}
                    </h2>
                  </div>

                  <Badge variant={isActive ? 'success' : 'neutral'}>
                    {isActive ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                    <span className="flex items-center gap-1 font-bold text-slate-500">
                      <Calendar className="h-3.5 w-3.5 text-primary-700 dark:text-primary-400" aria-hidden="true" />
                      <span>Aulas no Mês</span>
                    </span>
                    <p className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
                      {lessonsInMonthCount} aulas
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                    <span className="flex items-center gap-1 font-bold text-slate-500">
                      <Clock className="h-3.5 w-3.5 text-primary-700 dark:text-primary-400" aria-hidden="true" />
                      <span>Carga Semestral</span>
                    </span>
                    <p className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
                      {subject.workloadHours}h
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    <Users className="h-3.5 w-3.5 text-primary-700 dark:text-primary-400" aria-hidden="true" />
                    <span>Professores Voluntários Associados:</span>
                  </span>

                  {associatedTeachers.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {associatedTeachers.map((teacher) => (
                        <Badge key={teacher.id} variant="neutral">
                          {getDisplayName(teacher)}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      Aguardando atribuição em turma
                    </p>
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
            ? 'Editar Disciplina do ENEM'
            : 'Cadastrar Nova Disciplina (UC11)'
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
