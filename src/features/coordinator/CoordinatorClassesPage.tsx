import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Clock,
  ExternalLink,
  FilePenLine,
  Layers,
  Link2,
  MapPin,
  Plus,
  Save,
  Trash2,
  Users,
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
import { ClassRoom, ClassSubject } from '../../types';
import { getDisplayName } from '../../utils/formatters';
import { validateOptionalExternalUrl } from '../../utils/validators';

interface DraftSubjectAssignment {
  subjectId: string;
  teacherPersonId: string;
  classroomUrl: string;
  weeklySchedule: string;
}

export const CoordinatorClassesPage: React.FC = () => {
  const {
    db,
    addClassRoomWithAssignments,
    updateClassRoomWithAssignments,
  } = useMockDatabase();
  const { showToast } = useToast();

  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<string>('all');

  const activeTeachers = useMemo(
    () =>
      db.persons.filter(
        (p) => p.id.startsWith('per-prof-') && p.status === 'active'
      ),
    [db.persons]
  );

  // Enriquecimento das Turmas com ocupação atual e disciplinas/professores atribuídos
  const enrichedClassRooms = useMemo(() => {
    return db.classRooms
      .filter(
        (c) =>
          selectedPeriodFilter === 'all' || c.periodId === selectedPeriodFilter
      )
      .map((classRoom) => {
        const period = db.academicPeriods.find((p) => p.id === classRoom.periodId);
        const occupiedCount = db.enrollments.filter(
          (e) => e.classRoomId === classRoom.id && e.status === 'ativa'
        ).length;
        const assignments = db.classSubjects
          .filter((cs) => cs.classRoomId === classRoom.id)
          .map((cs) => ({
            classSubject: cs,
            subject: db.subjects.find((s) => s.id === cs.subjectId),
            teacher: db.persons.find((p) => p.id === cs.teacherPersonId),
          }));

        return {
          classRoom,
          periodName: period?.name ?? '2º semestre de 2026',
          occupiedCount,
          assignments,
        };
      });
  }, [
    db.classRooms,
    db.academicPeriods,
    db.enrollments,
    db.classSubjects,
    db.subjects,
    db.persons,
    selectedPeriodFilter,
  ]);

  // Modal de Criação / Edição de Turma + Atribuição Docente (teacher_assignment + classroomUrl)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [periodId, setPeriodId] = useState('per-2026-2');
  const [shift, setShift] = useState<ClassRoom['shift']>('Noite');
  const [roomLabel, setRoomLabel] = useState('Sala 01 — Térreo');
  const [scheduleSummary, setScheduleSummary] = useState(
    'Segunda a Sexta, das 19h00 às 22h15'
  );
  const [capacity, setCapacity] = useState('35');
  const [draftAssignments, setDraftAssignments] = useState<
    DraftSubjectAssignment[]
  >([]);
  const [formError, setFormError] = useState('');

  const handleOpenCreateModal = () => {
    setEditingClassId(null);
    setName('');
    setPeriodId(db.academicPeriods.find((p) => p.isCurrent)?.id ?? 'per-2026-2');
    setShift('Noite');
    setRoomLabel('Sala 03 — 1º andar');
    setScheduleSummary('Segunda a Sexta, das 19h00 às 22h15');
    setCapacity('35');
    setDraftAssignments([
      {
        subjectId: db.subjects[0]?.id ?? 'sub-mat',
        teacherPersonId: activeTeachers[0]?.id ?? 'per-prof-01',
        classroomUrl: 'https://classroom.google.com/c/bonsucesso-nova-turma',
        weeklySchedule: 'Segundas e Quartas, 19h00 às 20h30',
      },
    ]);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: (typeof enrichedClassRooms)[0]) => {
    setEditingClassId(item.classRoom.id);
    setName(item.classRoom.name);
    setPeriodId(item.classRoom.periodId);
    setShift(item.classRoom.shift);
    setRoomLabel(item.classRoom.roomLabel);
    setScheduleSummary(item.classRoom.scheduleSummary);
    setCapacity(String(item.classRoom.capacity));
    setDraftAssignments(
      item.assignments.map((a) => ({
        subjectId: a.classSubject.subjectId,
        teacherPersonId: a.classSubject.teacherPersonId,
        classroomUrl: a.classSubject.classroomUrl,
        weeklySchedule: a.classSubject.weeklySchedule,
      }))
    );
    setFormError('');
    setIsModalOpen(true);
  };

  const handleAddDraftAssignment = () => {
    const usedIds = new Set(draftAssignments.map((d) => d.subjectId));
    const nextSubject =
      db.subjects.find((s) => !usedIds.has(s.id)) ?? db.subjects[0];
    if (!nextSubject) return;

    setDraftAssignments((prev) => [
      ...prev,
      {
        subjectId: nextSubject.id,
        teacherPersonId: activeTeachers[0]?.id ?? 'per-prof-01',
        classroomUrl: `https://classroom.google.com/c/bonsucesso-${nextSubject.id}`,
        weeklySchedule: 'Terças, 19h00 às 20h30',
      },
    ]);
  };

  const handleUpdateDraftAssignment = (
    index: number,
    patch: Partial<DraftSubjectAssignment>
  ) => {
    setDraftAssignments((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item))
    );
  };

  const handleRemoveDraftAssignment = (index: number) => {
    setDraftAssignments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveClassRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (name.trim().length < 4) {
      setFormError('Informe o nome da turma (ex: Turma Paulo Freire • Noite).');
      return;
    }

    const parsedCap = Math.max(5, Number(capacity) || 35);

    // Valida URLs do Google Sala de Aula em todas as disciplinas atribuídas
    for (const assign of draftAssignments) {
      const urlCheck = validateOptionalExternalUrl(assign.classroomUrl);
      if (!urlCheck.isValid) {
        setFormError(
          `Link do Google Sala de Aula inválido em uma das disciplinas: ${urlCheck.errorMessage}`
        );
        return;
      }
    }

    const targetClassId = editingClassId ?? `cls-${Date.now()}`;
    const classPayload: ClassRoom = {
      id: targetClassId,
      periodId,
      name: name.trim(),
      shift,
      roomLabel: roomLabel.trim() || 'Sala 01',
      scheduleSummary: scheduleSummary.trim() || 'Segunda a Sexta',
      capacity: parsedCap,
    };

    const assignmentsPayload: ClassSubject[] = draftAssignments.map(
      (draft, idx) => ({
        id: `cs-${targetClassId}-${draft.subjectId}-${idx}`,
        classRoomId: targetClassId,
        subjectId: draft.subjectId,
        teacherPersonId: draft.teacherPersonId,
        classroomUrl: draft.classroomUrl.trim(),
        weeklySchedule: draft.weeklySchedule.trim() || 'Horário a definir',
      })
    );

    if (editingClassId) {
      updateClassRoomWithAssignments(classPayload, assignmentsPayload);
      showToast({
        variant: 'success',
        title: 'Turma e atribuições docentes atualizadas!',
        description: `"${classPayload.name}" salva com ${assignmentsPayload.length} disciplinas.`,
      });
    } else {
      addClassRoomWithAssignments(classPayload, assignmentsPayload);
      showToast({
        variant: 'success',
        title: 'Nova turma criada com sucesso!',
        description: `"${classPayload.name}" já está disponível para matrículas e aulas.`,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="primary" icon={<Layers className="h-4 w-4" />}>
            Estrutura Acadêmica • Turmas e Atribuição Docente (UC12)
          </Badge>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Gestão de Turmas
          </h1>
          <p className="mt-1 max-w-3xl text-base text-slate-600 dark:text-slate-300">
            Acompanhe a ocupação de cada turma, vincule disciplinas do ENEM aos professores
            voluntários e configure os links do Google Sala de Aula.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          leftIcon={<Plus className="h-5 w-5" />}
          onClick={handleOpenCreateModal}
        >
          Criar Nova Turma
        </Button>
      </div>

      {/* Filtro por Período Letivo */}
      <Card
        as="section"
        title="Filtrar por Período Letivo"
        subtitle="Consulte as turmas oferecidas em cada semestre."
      >
        <div className="max-w-md">
          <Select
            label="Período Letivo"
            value={selectedPeriodFilter}
            onChange={(e) => setSelectedPeriodFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Todos os Períodos Letivos' },
              ...db.academicPeriods.map((p) => ({
                value: p.id,
                label: p.isCurrent ? `${p.name} (2026.2 — Atual)` : p.name,
              })),
            ]}
          />
        </div>
      </Card>

      {/* Cards de Turmas */}
      <div className="grid grid-cols-1 gap-6">
        {enrichedClassRooms.map(
          ({ classRoom, periodName, occupiedCount, assignments }) => {
            const occupancyPct = Math.min(
              100,
              Math.round((occupiedCount / classRoom.capacity) * 100)
            );

            return (
              <Card
                key={classRoom.id}
                className="border-t-4 border-t-primary-700 dark:border-t-primary-500"
                title={classRoom.name}
                subtitle={`Período Letivo: ${periodName} (2026.2) • Turno: ${classRoom.shift}`}
                headerAction={
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="primary" icon={<Users className="h-4 w-4" />}>
                      Ocupação: {occupiedCount} / {classRoom.capacity} alunos ({occupancyPct}%)
                    </Badge>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        handleOpenEditModal({
                          classRoom,
                          periodName,
                          occupiedCount,
                          assignments,
                        })
                      }
                      leftIcon={<FilePenLine className="h-4 w-4" />}
                    >
                      Editar Turma e Professores
                    </Button>
                  </div>
                }
              >
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/50">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <MapPin className="h-4 w-4 text-primary-700 dark:text-primary-400" aria-hidden="true" />
                        <span>Sala / Espaço</span>
                      </span>
                      <p className="mt-1 font-extrabold text-slate-900 dark:text-white">
                        {classRoom.roomLabel}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/50">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Clock className="h-4 w-4 text-primary-700 dark:text-primary-400" aria-hidden="true" />
                        <span>Dias e Horários</span>
                      </span>
                      <p className="mt-1 font-extrabold text-slate-900 dark:text-white">
                        {classRoom.scheduleSummary}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/50">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <BookOpen className="h-4 w-4 text-primary-700 dark:text-primary-400" aria-hidden="true" />
                        <span>Disciplinas Vinculadas</span>
                      </span>
                      <p className="mt-1 font-extrabold text-slate-900 dark:text-white">
                        {assignments.length} disciplinas com Google Sala de Aula
                      </p>
                    </div>
                  </div>

                  {/* Tabela de Disciplinas Oferecidas, Professores e Links do Classroom */}
                  <div>
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2.5">
                      Disciplinas Oferecidas, Professores Atribuídos e Google Sala de Aula
                    </h3>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {assignments.map(({ classSubject, subject, teacher }) => (
                        <div
                          key={classSubject.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-950/40"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <p className="text-base font-extrabold text-slate-900 dark:text-white">
                              {subject?.name ?? 'Disciplina'}
                            </p>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Docente: {getDisplayName(teacher)}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {classSubject.weeklySchedule}
                            </p>
                          </div>

                          {classSubject.classroomUrl && (
                            <a
                              href={classSubject.classroomUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-primary-300 bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-900 hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-950 dark:text-primary-200"
                            >
                              <span>Classroom</span>
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
          }
        )}
      </div>

      {/* MODAL PARA CRIAR / EDITAR TURMA E ATRIBUIR PROFESSORES + CLASSROOM URL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="lg"
        title={
          editingClassId
            ? 'Editar Turma e Atribuições Docentes'
            : 'Criar Nova Turma (UC12)'
        }
        description="Associe o período letivo, capacidade, disciplinas oferecidas, professores voluntários e links do Google Sala de Aula."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveClassRoom}
              leftIcon={<Save className="h-4 w-4" />}
            >
              {editingClassId ? 'Salvar Alterações da Turma' : 'Criar Turma'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveClassRoom} className="space-y-6" noValidate>
          {formError && (
            <CalloutAlert variant="error" title="Verifique os dados da turma">
              {formError}
            </CalloutAlert>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nome da Turma"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Turma Esperança • Noite"
            />

            <Select
              label="Período Letivo"
              required
              value={periodId}
              onChange={(e) => setPeriodId(e.target.value)}
              options={db.academicPeriods.map((p) => ({
                value: p.id,
                label: `${p.name} (2026.${p.id.endsWith('2') ? '2' : '1'})`,
              }))}
            />

            <Select
              label="Turno"
              required
              value={shift}
              onChange={(e) => setShift(e.target.value as ClassRoom['shift'])}
              options={[
                { value: 'Manhã', label: 'Manhã' },
                { value: 'Tarde', label: 'Tarde' },
                { value: 'Noite', label: 'Noite' },
                { value: 'Sábado', label: 'Sábado Intensivo' },
              ]}
            />

            <Input
              label="Capacidade Máxima de Alunos"
              type="number"
              min={5}
              max={100}
              required
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />

            <Input
              label="Sala / Localização"
              required
              value={roomLabel}
              onChange={(e) => setRoomLabel(e.target.value)}
              placeholder="Ex: Sala 01 — Térreo"
            />

            <Input
              label="Resumo de Dias e Horários"
              required
              value={scheduleSummary}
              onChange={(e) => setScheduleSummary(e.target.value)}
              placeholder="Ex: Segunda a Sexta, das 19h00 às 22h15"
            />
          </div>

          {/* Bloco de Disciplinas Oferecidas, Professor Atribuído e Link do Google Sala de Aula */}
          <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                Disciplinas Oferecidas, Professores e Google Sala de Aula
              </h4>
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddDraftAssignment}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Adicionar Disciplina à Turma
              </Button>
            </div>

            <div className="space-y-4">
              {draftAssignments.map((assign, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-primary-900 dark:text-primary-300">
                      Disciplina #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDraftAssignment(idx)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-danger-700 hover:underline dark:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Remover</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Select
                      label="Disciplina"
                      value={assign.subjectId}
                      onChange={(e) =>
                        handleUpdateDraftAssignment(idx, {
                          subjectId: e.target.value,
                        })
                      }
                      options={db.subjects.map((s) => ({
                        value: s.id,
                        label: `${s.name} (${s.area})`,
                      }))}
                    />

                    <Select
                      label="Professor(a) Voluntário(a) Atribuído(a)"
                      value={assign.teacherPersonId}
                      onChange={(e) =>
                        handleUpdateDraftAssignment(idx, {
                          teacherPersonId: e.target.value,
                        })
                      }
                      options={activeTeachers.map((t) => ({
                        value: t.id,
                        label: getDisplayName(t),
                      }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input
                      label="Horário Semanal da Disciplina"
                      value={assign.weeklySchedule}
                      onChange={(e) =>
                        handleUpdateDraftAssignment(idx, {
                          weeklySchedule: e.target.value,
                        })
                      }
                      placeholder="Ex: Segundas e Quartas, 19h00 às 20h30"
                    />

                    <Input
                      label="Link do Google Sala de Aula (classroomUrl)"
                      value={assign.classroomUrl}
                      onChange={(e) =>
                        handleUpdateDraftAssignment(idx, {
                          classroomUrl: e.target.value,
                        })
                      }
                      leftIcon={<Link2 className="h-4 w-4" />}
                      placeholder="https://classroom.google.com/c/..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
