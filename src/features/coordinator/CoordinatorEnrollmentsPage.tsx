import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  FileCheck,
  FilePenLine,
  History,
  Plus,
  Save,
} from 'lucide-react';
import {
  Badge,
  BadgeVariant,
  Button,
  CalloutAlert,
  Card,
  Input,
  Modal,
  Select,
} from '../../components/ui';
import { DataTable, DataTableColumn } from '../../components/shared/DataTable';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import { useSession } from '../../contexts/SessionContext';
import { useToast } from '../../contexts/ToastContext';
import { Enrollment, EnrollmentStatus, Person } from '../../types';
import { formatDateBR, getDisplayName } from '../../utils/formatters';

interface EnrichedEnrollmentRow {
  enrollment: Enrollment;
  student?: Person;
  classRoomName: string;
  periodName: string;
}

const STATUS_BADGE_MAP: Record<
  EnrollmentStatus,
  { label: string; variant: BadgeVariant }
> = {
  ativa: { label: 'Ativa', variant: 'success' },
  trancada: { label: 'Trancada', variant: 'warning' },
  cancelada: { label: 'Cancelada', variant: 'danger' },
  concluída: { label: 'Concluída', variant: 'secondary' },
};

export const CoordinatorEnrollmentsPage: React.FC = () => {
  const { currentPerson } = useSession();
  const { db, addEnrollment, updateEnrollment } = useMockDatabase();
  const { showToast } = useToast();

  // Enriquecimento das matrículas
  const enrollmentRows = useMemo<EnrichedEnrollmentRow[]>(() => {
    return db.enrollments.map((enrollment) => {
      const student = db.persons.find((p) => p.id === enrollment.studentPersonId);
      const classRoom = db.classRooms.find((c) => c.id === enrollment.classRoomId);
      const period = db.academicPeriods.find((p) => p.id === enrollment.periodId);

      return {
        enrollment,
        student,
        classRoomName: classRoom?.name ?? 'Turma Esperança',
        periodName: period?.name ?? '2º semestre de 2026',
      };
    });
  }, [db.enrollments, db.persons, db.classRooms, db.academicPeriods]);

  const allStudents = useMemo(
    () => db.persons.filter((p) => p.id.startsWith('per-est-')),
    [db.persons]
  );

  // Modal 1: Fluxo Guiado "Nova Matrícula" (impede matrícula duplicada ativa na mesma turma)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newStudentId, setNewStudentId] = useState(allStudents[0]?.id ?? '');
  const [newClassRoomId, setNewClassRoomId] = useState(
    db.classRooms[0]?.id ?? 'cls-esperanca'
  );
  const [newNotes, setNewNotes] = useState('');
  const [newError, setNewError] = useState('');

  const handleOpenNewEnrollment = () => {
    setNewStudentId(allStudents[0]?.id ?? '');
    setNewClassRoomId(db.classRooms[0]?.id ?? 'cls-esperanca');
    setNewNotes('');
    setNewError('');
    setIsNewModalOpen(true);
  };

  const handleCreateEnrollment = (e: React.FormEvent) => {
    e.preventDefault();
    setNewError('');

    if (!newStudentId || !newClassRoomId) {
      setNewError('Selecione o(a) estudante e a turma desejada.');
      return;
    }

    // Verifica se já existe matrícula ATIVA do mesmo aluno na mesma turma
    const duplicateActive = db.enrollments.find(
      (enr) =>
        enr.studentPersonId === newStudentId &&
        enr.classRoomId === newClassRoomId &&
        enr.status === 'ativa'
    );

    if (duplicateActive) {
      const studentName = getDisplayName(
        db.persons.find((p) => p.id === newStudentId)
      );
      const className =
        db.classRooms.find((c) => c.id === newClassRoomId)?.name ?? 'Turma';
      setNewError(
        `Matrícula duplicada impedida: ${studentName} já possui uma matrícula ATIVA (${duplicateActive.enrollmentCode}) na ${className}.`
      );
      return;
    }

    const todayIso = new Date().toISOString().slice(0, 10);
    const targetClass = db.classRooms.find((c) => c.id === newClassRoomId);
    const nextCode = `BS-2026-${String(db.enrollments.length + 1).padStart(
      3,
      '0'
    )}`;

    const created: Enrollment = {
      id: `enr-${Date.now()}`,
      studentPersonId: newStudentId,
      classRoomId: newClassRoomId,
      periodId: targetClass?.periodId ?? 'per-2026-2',
      enrollmentCode: nextCode,
      status: 'ativa',
      enrolledAt: todayIso,
      statusHistory: [
        {
          status: 'ativa',
          changedAt: todayIso,
          changedByPersonId: currentPerson?.id ?? 'per-coord-01',
          reason:
            newNotes.trim() ||
            'Nova matrícula realizada via fluxo guiado da coordenação.',
        },
      ],
    };

    addEnrollment(created);
    setIsNewModalOpen(false);
    showToast({
      variant: 'success',
      title: 'Nova matrícula efetivada com sucesso!',
      description: `Código gerado: ${created.enrollmentCode}.`,
    });
  };

  // Modal 2: "Alterar Situação da Matrícula" + Linha do Tempo Auditável (enrollment_status_history)
  const [statusModalTarget, setStatusModalTarget] =
    useState<EnrichedEnrollmentRow | null>(null);
  const [nextStatusChoice, setNextStatusChoice] =
    useState<EnrollmentStatus>('trancada');
  const [statusChangeReason, setStatusChangeReason] = useState('');

  // Modal 3: Visualização da Linha do Tempo Completa de Histórico de Status
  const [historyModalTarget, setHistoryModalTarget] =
    useState<EnrichedEnrollmentRow | null>(null);

  const handleOpenStatusChangeModal = (row: EnrichedEnrollmentRow) => {
    setStatusModalTarget(row);
    setNextStatusChoice(
      row.enrollment.status === 'ativa' ? 'trancada' : 'ativa'
    );
    setStatusChangeReason('');
  };

  const handleConfirmStatusChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalTarget) return;

    const todayIso = new Date().toISOString().slice(0, 10);
    const updated: Enrollment = {
      ...statusModalTarget.enrollment,
      status: nextStatusChoice,
      statusHistory: [
        ...statusModalTarget.enrollment.statusHistory,
        {
          status: nextStatusChoice,
          changedAt: todayIso,
          changedByPersonId: currentPerson?.id ?? 'per-coord-01',
          reason:
            statusChangeReason.trim() ||
            `Situação alterada para "${nextStatusChoice.toUpperCase()}" pela coordenação.`,
        },
      ],
    };

    updateEnrollment(updated);
    setStatusModalTarget(null);
    showToast({
      variant: 'success',
      title: 'Situação da matrícula atualizada!',
      description: `Registro auditável gravado na linha do tempo de ${getDisplayName(
        statusModalTarget.student
      )}.`,
    });
  };

  const columns = useMemo<Array<DataTableColumn<EnrichedEnrollmentRow>>>(
    () => [
      {
        id: 'code',
        header: 'Código / Data',
        sortAccessor: (r) => r.enrollment.enrollmentCode,
        renderCell: (row) => (
          <div>
            <span className="font-mono text-sm font-extrabold text-primary-900 dark:text-primary-300">
              {row.enrollment.enrollmentCode}
            </span>
            <span className="block text-xs text-slate-500">
              Em {formatDateBR(row.enrollment.enrolledAt)}
            </span>
          </div>
        ),
      },
      {
        id: 'student',
        header: 'Estudante',
        sortAccessor: (r) => getDisplayName(r.student),
        renderCell: (row) => (
          <div>
            <p className="text-base font-extrabold text-slate-900 dark:text-white">
              {getDisplayName(row.student)}
            </p>
            <span className="text-xs text-slate-500">
              CPF: {row.student?.cpf ?? '—'}
            </span>
          </div>
        ),
      },
      {
        id: 'classRoom',
        header: 'Turma e Período',
        sortAccessor: (r) => r.classRoomName,
        renderCell: (row) => (
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-200">
              {row.classRoomName}
            </p>
            <span className="text-xs text-slate-500">{row.periodName}</span>
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Situação Atual',
        sortAccessor: (r) => r.enrollment.status,
        renderCell: (row) => {
          const cfg = STATUS_BADGE_MAP[row.enrollment.status];
          return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
        },
      },
      {
        id: 'actions',
        header: 'Ações e Auditoria',
        renderCell: (row) => (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => handleOpenStatusChangeModal(row)}
              leftIcon={<FilePenLine className="h-4 w-4" />}
            >
              Alterar Situação
            </Button>

            <Button
              variant="ghost"
              onClick={() => setHistoryModalTarget(row)}
              leftIcon={<History className="h-4 w-4" />}
            >
              Histórico ({row.enrollment.statusHistory.length})
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="primary" icon={<FileCheck className="h-4 w-4" />}>
            Controle de Matrículas & Histórico Auditável (UC13, UC14)
          </Badge>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Gestão de Matrículas
          </h1>
          <p className="mt-1 max-w-3xl text-base text-slate-600 dark:text-slate-300">
            Realize novas matrículas com prevenção de duplicidade e registre alterações de situação
            (Ativa, Trancada, Cancelada, Concluída) com linha do tempo auditável.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          leftIcon={<Plus className="h-5 w-5" />}
          onClick={handleOpenNewEnrollment}
        >
          Nova Matrícula
        </Button>
      </div>

      {/* DataTable de Matrículas */}
      <Card
        title="Relação de Matrículas do Cursinho"
        subtitle="Filtre por turma ou situação e clique em 'Histórico' para inspecionar a linha do tempo de auditoria."
      >
        <DataTable
          data={enrollmentRows}
          columns={columns}
          getRowKey={(r) => r.enrollment.id}
          searchLabel="Buscar por Código de Matrícula, Nome do Aluno ou CPF"
          searchPlaceholder="Ex: BS-2026-001, Mariana, Bruno..."
          searchPredicate={(row, q) =>
            row.enrollment.enrollmentCode.toLowerCase().includes(q) ||
            getDisplayName(row.student).toLowerCase().includes(q) ||
            (row.student?.cpf.toLowerCase().includes(q) ?? false)
          }
          filters={[
            {
              id: 'classRoom',
              label: 'Filtrar por Turma',
              options: [
                { value: 'all', label: 'Todas as Turmas' },
                ...db.classRooms.map((c) => ({ value: c.id, label: c.name })),
              ],
              predicate: (row, val) => row.enrollment.classRoomId === val,
            },
            {
              id: 'status',
              label: 'Situação da Matrícula',
              options: [
                { value: 'all', label: 'Todas as Situações' },
                { value: 'ativa', label: 'Ativa' },
                { value: 'trancada', label: 'Trancada' },
                { value: 'cancelada', label: 'Cancelada' },
                { value: 'concluída', label: 'Concluída' },
              ],
              predicate: (row, val) => row.enrollment.status === val,
            },
          ]}
        />
      </Card>

      {/* MODAL 1: FLUXO GUIADO "NOVA MATRÍCULA" (Impede duplicidade ativa na mesma turma) */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Fluxo Guiado — Nova Matrícula (UC13)"
        description="Selecione um estudante já cadastrado e a turma desejada. O sistema impede matrícula duplicada ativa na mesma turma."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsNewModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateEnrollment}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Confirmar Nova Matrícula
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateEnrollment} className="space-y-4" noValidate>
          {newError && (
            <CalloutAlert
              variant="error"
              title="Matrícula duplicada na mesma turma bloqueada"
            >
              {newError}
            </CalloutAlert>
          )}

          <Select
            label="1. Selecionar Estudante Cadastrado"
            required
            value={newStudentId}
            onChange={(e) => {
              setNewStudentId(e.target.value);
              setNewError('');
            }}
            options={allStudents.map((s) => ({
              value: s.id,
              label: `${getDisplayName(s)} (CPF: ${s.cpf})`,
            }))}
          />

          <Select
            label="2. Selecionar Turma Disponível (2º Semestre de 2026)"
            required
            value={newClassRoomId}
            onChange={(e) => {
              setNewClassRoomId(e.target.value);
              setNewError('');
            }}
            options={db.classRooms.map((c) => {
              const occupied = db.enrollments.filter(
                (e) => e.classRoomId === c.id && e.status === 'ativa'
              ).length;
              return {
                value: c.id,
                label: `${c.name} — Vagas ocupadas: ${occupied}/${c.capacity}`,
              };
            })}
          />

          <Input
            label="3. Observação Inicial da Matrícula"
            optionalText="Opcional"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Ex: Transferência de turno ou ingresso via lista de espera."
          />
        </form>
      </Modal>

      {/* MODAL 2: "ALTERAR SITUAÇÃO DA MATRÍCULA" (Grava em enrollment_status_history) */}
      <Modal
        isOpen={Boolean(statusModalTarget)}
        onClose={() => setStatusModalTarget(null)}
        title={
          statusModalTarget
            ? `Alterar Situação — ${getDisplayName(statusModalTarget.student)}`
            : 'Alterar Situação da Matrícula'
        }
        description="Escolha o novo status e informe a justificativa. Um registro auditável será gravado na linha do tempo da matrícula."
        footer={
          <>
            <Button variant="ghost" onClick={() => setStatusModalTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmStatusChange}
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
            >
              Salvar Nova Situação
            </Button>
          </>
        }
      >
        {statusModalTarget && (
          <form onSubmit={handleConfirmStatusChange} className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm dark:border-slate-800 dark:bg-slate-950">
              <p>
                <strong>Matrícula:</strong>{' '}
                {statusModalTarget.enrollment.enrollmentCode} •{' '}
                <strong>Turma:</strong> {statusModalTarget.classRoomName}
              </p>
              <p className="mt-1">
                <strong>Situação Atual:</strong>{' '}
                {statusModalTarget.enrollment.status.toUpperCase()}
              </p>
            </div>

            <Select
              label="Nova Situação da Matrícula"
              required
              value={nextStatusChoice}
              onChange={(e) =>
                setNextStatusChoice(e.target.value as EnrollmentStatus)
              }
              options={[
                { value: 'ativa', label: 'Ativa (Frequentando regularmente)' },
                { value: 'trancada', label: 'Trancada (Pausa temporária com vaga preservada)' },
                { value: 'cancelada', label: 'Cancelada (Desistência definitiva)' },
                { value: 'concluída', label: 'Concluída (Ciclo preparatório finalizado)' },
              ]}
            />

            <Input
              label="Justificativa / Motivo da Alteração"
              optionalText="Opcional, recomendada para auditoria"
              value={statusChangeReason}
              onChange={(e) => setStatusChangeReason(e.target.value)}
              placeholder="Ex: Trancamento solicitado por mudança de horário no trabalho."
            />
          </form>
        )}
      </Modal>

      {/* MODAL 3: DETALHE DA LINHA DO TEMPO DE HISTÓRICO DE STATUS (enrollment_status_history) */}
      <Modal
        isOpen={Boolean(historyModalTarget)}
        onClose={() => setHistoryModalTarget(null)}
        title={
          historyModalTarget
            ? `Histórico da Matrícula ${historyModalTarget.enrollment.enrollmentCode}`
            : 'Histórico da Matrícula'
        }
        description={
          historyModalTarget
            ? `Estudante: ${getDisplayName(historyModalTarget.student)} • ${
                historyModalTarget.classRoomName
              }`
            : undefined
        }
        footer={
          <Button variant="ghost" onClick={() => setHistoryModalTarget(null)}>
            Fechar Histórico
          </Button>
        }
      >
        {historyModalTarget && (
          <ol className="relative border-l-4 border-primary-300 dark:border-primary-700 ml-3 space-y-4">
            {historyModalTarget.enrollment.statusHistory.map((entry, idx) => {
              const cfg = STATUS_BADGE_MAP[entry.status];
              const author = db.persons.find(
                (p) => p.id === entry.changedByPersonId
              );
              return (
                <li key={idx} className="ml-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400">
                      Data: {formatDateBR(entry.changedAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                    {entry.reason}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Registrado por: {getDisplayName(author)}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </Modal>
    </div>
  );
};
