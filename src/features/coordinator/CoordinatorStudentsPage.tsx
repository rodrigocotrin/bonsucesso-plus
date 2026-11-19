import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  FilePenLine,
  Printer,
  UserPlus,
} from 'lucide-react';
import {
  Badge,
  Button,
  ConfirmDialog,
} from '../../components/ui';
import { DataTable, DataTableColumn } from '../../components/shared/DataTable';
import { PrintReportHeader } from '../../components/shared/PrintReportHeader';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import { useToast } from '../../contexts/ToastContext';
import { exportToCsv, triggerPrintReport } from '../../lib/exportCsv';
import { getDisplayName } from '../../lib/person';
import { Person } from '../../types';
import {
  calculateSimpleEnemAverage,
  formatEnemScore,
} from '../../utils/formatters';
import {
  EnrichedStudentRow,
  StudentProfileTabsView,
} from './components/StudentProfileTabsView';
import { StudentRegistrationModal } from './components/StudentRegistrationModal';

export const CoordinatorStudentsPage: React.FC = () => {
  const {
    db,
    getStudentAttendancePercentage,
    togglePersonStatus,
  } = useMockDatabase();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    searchParams.get('studentId')
  );

  useEffect(() => {
    const paramId = searchParams.get('studentId');
    if (paramId) {
      setSelectedStudentId(paramId);
    }
    if (searchParams.get('action') === 'new') {
      setEditingStudentRow(null);
      setIsFormModalOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleOpenStudentDetail = (personId: string) => {
    setSelectedStudentId(personId);
    setSearchParams({ studentId: personId }, { replace: true });
  };

  const handleBackToList = () => {
    setSelectedStudentId(null);
    searchParams.delete('studentId');
    setSearchParams(searchParams, { replace: true });
  };

  // Enriquecimento dos registros de alunos (Ativos e Inativos — preservação total de histórico)
  const studentRows = useMemo<EnrichedStudentRow[]>(() => {
    const studentPersons = db.persons.filter((p) => p.id.startsWith('per-est-'));
    return studentPersons.map((person) => {
      const enrollment = db.enrollments.find((e) => e.studentPersonId === person.id);
      const classRoom = db.classRooms.find((c) => c.id === enrollment?.classRoomId);
      const attendancePct = getStudentAttendancePercentage(person.id);
      const studentGrades = db.grades.filter((g) => g.studentPersonId === person.id);
      const enemAvg = calculateSimpleEnemAverage(studentGrades);
      const responsibility = db.responsibilities.find(
        (r) => r.studentPersonId === person.id
      );
      const guardian = responsibility
        ? db.persons.find((p) => p.id === responsibility.guardianPersonId)
        : undefined;

      return {
        person,
        enrollment,
        classRoomId: classRoom?.id ?? 'cls-esperanca',
        classRoomName: classRoom?.name ?? 'Turma Esperança • Noite',
        attendancePct,
        enemAvg,
        guardian,
        relationship: responsibility?.relationship,
      };
    });
  }, [
    db.persons,
    db.enrollments,
    db.classRooms,
    db.grades,
    db.responsibilities,
    getStudentAttendancePercentage,
  ]);

  const selectedStudentRow = useMemo(
    () => studentRows.find((r) => r.person.id === selectedStudentId) ?? null,
    [studentRows, selectedStudentId]
  );

  // ConfirmDialog de Inativação/Reativação preservando histórico
  const [statusDialogTarget, setStatusDialogTarget] = useState<Person | null>(null);

  const handleConfirmToggleStatus = () => {
    if (!statusDialogTarget) return;
    const nextStatus = statusDialogTarget.status === 'active' ? 'inactive' : 'active';
    togglePersonStatus(statusDialogTarget.id, nextStatus);
    showToast({
      variant: nextStatus === 'active' ? 'success' : 'warning',
      title:
        nextStatus === 'active'
          ? 'Estudante reativado(a) com sucesso!'
          : 'Estudante inativado(a) (Histórico preservado)',
      description: `O status de ${getDisplayName(statusDialogTarget)} foi alterado para ${
        nextStatus === 'active' ? 'Ativo' : 'Inativo'
      } sem excluir nenhum registro acadêmico.`,
    });
    setStatusDialogTarget(null);
  };

  // Modal de Cadastro / Edição
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStudentRow, setEditingStudentRow] =
    useState<EnrichedStudentRow | null>(null);

  const handleOpenCreateModal = () => {
    setEditingStudentRow(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (row: EnrichedStudentRow) => {
    setEditingStudentRow(row);
    setIsFormModalOpen(true);
  };

  const columns = useMemo<Array<DataTableColumn<EnrichedStudentRow>>>(
    () => [
      {
        id: 'student',
        header: 'Estudante / Matrícula',
        sortAccessor: (r) => getDisplayName(r.person),
        renderCell: (row) => (
          <div>
            <button
              type="button"
              onClick={() => handleOpenStudentDetail(row.person.id)}
              className="text-left text-sm font-semibold text-ink hover:underline"
            >
              {getDisplayName(row.person)}
            </button>
            <span className="num block text-xs text-ink-muted">
              Matrícula: {row.enrollment?.enrollmentCode ?? 'BS-2026'} • CPF: {row.person.cpf}
            </span>
          </div>
        ),
      },
      {
        id: 'classRoom',
        header: 'Turma',
        sortAccessor: (r) => r.classRoomName,
        renderCell: (row) => (
          <span className="font-semibold text-slate-800">
            {row.classRoomName}
          </span>
        ),
      },
      {
        id: 'attendance',
        header: 'Frequência',
        sortAccessor: (r) => r.attendancePct,
        renderCell: (row) => {
          const isLow = row.attendancePct < 75;
          return (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-extrabold text-slate-900">
                {row.attendancePct}%
              </span>
              <Badge
                variant={isLow ? 'danger' : 'success'}
                icon={
                  isLow ? (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )
                }
              >
                {isLow ? 'Abaixo de 75%' : 'Regular'}
              </Badge>
            </div>
          );
        },
      },
      {
        id: 'enem',
        header: 'Média Simulados',
        sortAccessor: (r) => r.enemAvg,
        renderCell: (row) => (
          <span className="font-extrabold text-secondary-800">
            {row.enemAvg > 0 ? formatEnemScore(row.enemAvg) : 'Sem nota'}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Situação',
        sortAccessor: (r) => r.person.status,
        renderCell: (row) => (
          <Badge variant={row.person.status === 'active' ? 'success' : 'neutral'}>
            {row.person.status === 'active' ? 'Ativo' : 'Inativo'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Ações',
        renderCell: (row) => (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => handleOpenStudentDetail(row.person.id)}
              leftIcon={<Eye className="h-4 w-4" />}
            >
              Ver Ficha
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleOpenEditModal(row)}
              leftIcon={<FilePenLine className="h-4 w-4" />}
            >
              Editar
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const handleExportStudentsCsv = () => {
    exportToCsv({
      filename: 'bonsucesso-alunos',
      headers: [
        'Matrícula',
        'Estudante (Nome Social / Exibição)',
        'CPF',
        'Turma',
        'Frequência (%)',
        'Média Simulados ENEM',
        'Situação',
        'E-mail',
        'Telefone',
      ],
      rows: studentRows.map((row) => [
        row.enrollment?.enrollmentCode ?? 'BS-2026',
        getDisplayName(row.person),
        row.person.cpf,
        row.classRoomName,
        `${row.attendancePct}%`,
        row.enemAvg > 0 ? row.enemAvg : 'Sem nota',
        row.person.status === 'active' ? 'Ativo' : 'Inativo',
        row.person.email,
        row.person.phone,
      ]),
    });
    showToast({
      variant: 'success',
      title: 'CSV exportado com sucesso',
      description: 'Arquivo bonsucesso-alunos.csv compatível com Excel (UTF-8 BOM).',
    });
  };

  return (
    <div className="space-y-8">
      <PrintReportHeader
        title="Relatório Geral de Alunos, Frequência e Desempenho"
        subtitle={`Total de ${studentRows.length} estudantes registrados`}
      />

      {selectedStudentRow ? (
        <StudentProfileTabsView
          studentRow={selectedStudentRow}
          onBack={handleBackToList}
          onEdit={handleOpenEditModal}
          onToggleStatusRequest={setStatusDialogTarget}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1>Alunos</h1>

            <div className="no-print flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={handleExportStudentsCsv}
              >
                Exportar CSV
              </Button>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Printer className="h-4 w-4" />}
                onClick={triggerPrintReport}
              >
                Imprimir
              </Button>
              <Button
                variant="primary"
                leftIcon={<UserPlus className="h-4 w-4" />}
                onClick={handleOpenCreateModal}
              >
                Novo Aluno
              </Button>
            </div>
          </div>

          <DataTable
            data={studentRows}
            columns={columns}
            getRowKey={(r) => r.person.id}
            onRowClick={(r) => handleOpenStudentDetail(r.person.id)}
            searchLabel="Pesquisar"
            searchPlaceholder="Nome, matrícula ou CPF..."
            searchPredicate={(row, q) =>
              row.person.fullName.toLowerCase().includes(q) ||
              (row.person.socialName?.toLowerCase().includes(q) ?? false) ||
              row.person.cpf.toLowerCase().includes(q) ||
              (row.enrollment?.enrollmentCode.toLowerCase().includes(q) ?? false)
            }
            filters={[
              {
                id: 'classRoom',
                label: 'Turma',
                options: [
                  { value: 'all', label: 'Todas as Turmas' },
                  ...db.classRooms.map((c) => ({ value: c.id, label: c.name })),
                ],
                predicate: (row, val) => row.classRoomId === val,
              },
              {
                id: 'status',
                label: 'Situação',
                options: [
                  { value: 'all', label: 'Todos' },
                  { value: 'active', label: 'Ativos' },
                  { value: 'inactive', label: 'Inativos' },
                ],
                predicate: (row, val) => row.person.status === val,
              },
            ]}
          />
        </>
      )}

      {/* Subcomponente de Cadastro / Edição (RF04) */}
      <StudentRegistrationModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        editingRow={editingStudentRow}
      />

      {/* ConfirmDialog para Inativar / Reativar Aluno preservando histórico */}
      <ConfirmDialog
        isOpen={Boolean(statusDialogTarget)}
        onClose={() => setStatusDialogTarget(null)}
        onConfirm={handleConfirmToggleStatus}
        variant={statusDialogTarget?.status === 'active' ? 'danger' : 'primary'}
        title={
          statusDialogTarget?.status === 'active'
            ? `Inativar cadastro de ${getDisplayName(statusDialogTarget)}?`
            : `Reativar cadastro de ${getDisplayName(statusDialogTarget)}?`
        }
        description={
          statusDialogTarget?.status === 'active'
            ? 'O(A) estudante terá sua matrícula marcada como trancada/inativa e não aparecerá nas chamadas diárias ativas.'
            : 'O(A) estudante voltará ao status Ativo e poderá acessar normalmente o portal e as chamadas da turma.'
        }
        consequenceNote="Nenhum histórico de presença, notas de simulados ou observações será apagado (Preservação integral de histórico acadêmico)."
        confirmLabel={
          statusDialogTarget?.status === 'active'
            ? 'Sim, inativar preservando histórico'
            : 'Sim, reativar estudante'
        }
        cancelLabel="Cancelar"
      />
    </div>
  );
};
