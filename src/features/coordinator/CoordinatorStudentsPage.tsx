import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  CalendarCheck,
  CheckCircle2,
  Eye,
  FilePenLine,
  FileText,
  GraduationCap,
  History,
  Power,
  RotateCcw,
  Save,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  Badge,
  Button,
  CalloutAlert,
  Card,
  ConfirmDialog,
  Input,
  Modal,
  ProgressBarGroup,
  Select,
} from '../../components/ui';
import { DataTable, DataTableColumn } from '../../components/shared/DataTable';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import { useToast } from '../../contexts/ToastContext';
import {
  Enrollment,
  Person,
  RaceDeclaration,
  Responsibility,
  UserAccount,
} from '../../types';
import {
  calculateSimpleEnemAverage,
  formatDateBR,
  formatEnemScore,
  getDisplayName,
} from '../../utils/formatters';
import {
  calculateAgeYears,
  validateCpfField,
  validateEmailField,
  validatePhoneField,
} from '../../utils/validators';

interface EnrichedStudentRow {
  person: Person;
  enrollment?: Enrollment;
  classRoomId: string;
  classRoomName: string;
  attendancePct: number;
  enemAvg: number;
  guardian?: Person;
  relationship?: Responsibility['relationship'];
}

type StudentProfileTab =
  | 'dados_pessoais'
  | 'matriculas'
  | 'frequencia'
  | 'boletim_simulados'
  | 'historico_ocorrencias';

const RACE_OPTIONS: Array<{ value: RaceDeclaration; label: string }> = [
  { value: 'Parda', label: 'Parda' },
  { value: 'Preta', label: 'Preta' },
  { value: 'Branca', label: 'Branca' },
  { value: 'Indígena', label: 'Indígena' },
  { value: 'Amarela', label: 'Amarela' },
  { value: 'Prefiro não declarar', label: 'Prefiro não declarar' },
];

export const CoordinatorStudentsPage: React.FC = () => {
  const {
    db,
    getStudentAttendancePercentage,
    addPersonWithAccount,
    updatePerson,
    togglePersonStatus,
  } = useMockDatabase();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Estado de visualização de Ficha Detalhada em Abas (SUAP-style)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    searchParams.get('studentId')
  );
  const [activeTab, setActiveTab] = useState<StudentProfileTab>('dados_pessoais');

  useEffect(() => {
    const paramId = searchParams.get('studentId');
    if (paramId) {
      setSelectedStudentId(paramId);
    }
  }, [searchParams]);

  const handleOpenStudentDetail = (personId: string) => {
    setSelectedStudentId(personId);
    setActiveTab('dados_pessoais');
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

  // Estado para ConfirmDialog de Inativação/Reativação preservando histórico
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

  // Estado do Modal de Cadastro / Edição de Aluno (RF04 dividido em 4 seções lógicas)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  // Seção 1: Dados Pessoais
  const [fullName, setFullName] = useState('');
  const [socialName, setSocialName] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [birthDate, setBirthDate] = useState('2008-05-10');
  const [race, setRace] = useState<RaceDeclaration>('Parda');
  const [classRoomId, setClassRoomId] = useState('cls-esperanca');

  // Seção 2: Contato
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Seção 3: Dados de Responsável (Obrigatório/Sugerido automaticamente se < 18 anos)
  const [selectedGuardianId, setSelectedGuardianId] = useState('');
  const [guardianRelationship, setGuardianRelationship] =
    useState<Responsibility['relationship']>('Mãe');

  // Seção 4: Informações Gerais e Acolhimento
  const [generalNotes, setGeneralNotes] = useState('');

  // Erros específicos por campo
  const [errors, setErrors] = useState<Record<string, string>>({});

  const studentAge = useMemo(() => calculateAgeYears(birthDate), [birthDate]);
  const isMinorUnder18 = studentAge < 18;

  const availableGuardians = useMemo(
    () => db.persons.filter((p) => p.id.startsWith('per-resp-')),
    [db.persons]
  );

  const handleOpenCreateModal = () => {
    setEditingStudentId(null);
    setFullName('');
    setSocialName('');
    setCpf('');
    setRg('');
    setBirthDate('2009-04-15');
    setRace('Parda');
    setClassRoomId('cls-esperanca');
    setPhone('');
    setEmail('');
    setSelectedGuardianId(availableGuardians[0]?.id ?? '');
    setGuardianRelationship('Mãe');
    setGeneralNotes('');
    setErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (row: EnrichedStudentRow) => {
    setEditingStudentId(row.person.id);
    setFullName(row.person.fullName);
    setSocialName(row.person.socialName ?? '');
    setCpf(row.person.cpf);
    setRg(row.person.rg);
    setBirthDate(row.person.birthDate);
    setRace(row.person.race);
    setClassRoomId(row.classRoomId);
    setPhone(row.person.phone);
    setEmail(row.person.email);
    setSelectedGuardianId(row.guardian?.id ?? '');
    setGuardianRelationship(row.relationship ?? 'Mãe');
    setGeneralNotes(row.person.generalNotes ?? '');
    setErrors({});
    setIsFormModalOpen(true);
  };

  const handleSaveStudentForm = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (fullName.trim().length < 5) {
      newErrors.fullName = 'Informe o nome completo do(a) estudante (mínimo 5 caracteres).';
    }

    const cpfCheck = validateCpfField(cpf, db.persons, editingStudentId);
    if (!cpfCheck.isValid) {
      newErrors.cpf = cpfCheck.errorMessage ?? 'CPF inválido.';
    }

    if (rg.trim().length < 5) {
      newErrors.rg = 'Informe o número do documento de identidade (RG).';
    }

    if (!birthDate) {
      newErrors.birthDate = 'Informe a data de nascimento.';
    }

    const phoneCheck = validatePhoneField(phone);
    if (!phoneCheck.isValid) {
      newErrors.phone = phoneCheck.errorMessage ?? 'Telefone inválido.';
    }

    const emailCheck = validateEmailField(email, db.persons, editingStudentId);
    if (!emailCheck.isValid) {
      newErrors.email = emailCheck.errorMessage ?? 'E-mail inválido.';
    }

    if (isMinorUnder18 && !selectedGuardianId) {
      newErrors.guardian =
        'Como o(a) estudante é menor de 18 anos, é obrigatório selecionar um responsável familiar.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast({
        variant: 'error',
        title: 'Verifique os campos destacados no formulário',
        description: 'Corrija as mensagens indicadas abaixo de cada campo.',
      });
      return;
    }

    const todayIso = new Date().toISOString().slice(0, 10);

    if (editingStudentId) {
      const existing = db.persons.find((p) => p.id === editingStudentId);
      if (!existing) return;

      updatePerson({
        ...existing,
        fullName: fullName.trim(),
        socialName: socialName.trim() || undefined,
        cpf: cpfCheck.formatted,
        rg: rg.trim(),
        birthDate,
        race,
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        generalNotes: generalNotes.trim() || undefined,
      });

      showToast({
        variant: 'success',
        title: 'Cadastro do(a) estudante atualizado!',
        description: `Os dados de ${fullName.trim()} foram salvos com sucesso.`,
      });
    } else {
      const newPersonId = `per-est-${Date.now()}`;
      const newPerson: Person = {
        id: newPersonId,
        fullName: fullName.trim(),
        socialName: socialName.trim() || undefined,
        cpf: cpfCheck.formatted,
        rg: rg.trim(),
        birthDate,
        race,
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        generalNotes: generalNotes.trim() || undefined,
        status: 'active',
        createdAt: todayIso,
      };

      const newAccount: UserAccount = {
        id: `acc-est-${Date.now()}`,
        personId: newPersonId,
        role: 'student',
        roleLabel: 'Estudante',
        passwordPlainDemo: '123456',
        status: 'active',
      };

      const nextCodeNum = String(db.enrollments.length + 1).padStart(3, '0');
      const newEnrollment: Enrollment = {
        id: `enr-${Date.now()}`,
        studentPersonId: newPersonId,
        classRoomId,
        periodId: 'per-2026-2',
        enrollmentCode: `BS-2026-${nextCodeNum}`,
        status: 'ativa',
        enrolledAt: todayIso,
        statusHistory: [
          {
            status: 'ativa',
            changedAt: todayIso,
            changedByPersonId: 'per-coord-01',
            reason: 'Matrícula realizada pela coordenação pedagógica.',
          },
        ],
      };

      const newResponsibility: Responsibility | undefined = selectedGuardianId
        ? {
            id: `resp-rel-${Date.now()}`,
            guardianPersonId: selectedGuardianId,
            studentPersonId: newPersonId,
            relationship: guardianRelationship,
            isPrimaryContact: true,
            receivesAcademicInfo: true,
          }
        : undefined;

      addPersonWithAccount(newPerson, newAccount, newEnrollment, newResponsibility);

      showToast({
        variant: 'success',
        title: 'Novo(a) estudante matriculado(a)!',
        description: `${newPerson.fullName} foi cadastrado(a) com matrícula ${newEnrollment.enrollmentCode}.`,
      });
    }

    setIsFormModalOpen(false);
  };

  // Colunas do DataTable para Listagem de Alunos
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
              className="text-left text-base font-extrabold text-primary-900 hover:underline dark:text-primary-300"
            >
              {getDisplayName(row.person)}
            </button>
            {row.person.socialName && (
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Nome civil: {row.person.fullName}
              </span>
            )}
            <span className="block text-xs font-mono text-slate-600 dark:text-slate-400">
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
          <span className="font-semibold text-slate-800 dark:text-slate-200">
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
              <span className="text-base font-extrabold text-slate-900 dark:text-white">
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
          <span className="font-extrabold text-secondary-800 dark:text-secondary-300">
            {row.enemAvg > 0 ? formatEnemScore(row.enemAvg) : 'Sem nota'}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
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

  return (
    <div className="space-y-8">
      {/* =====================================================================
          MODO 1: FICHA DETALHADA DO ALUNO EM ABAS (Inspirada no SUAP)
         ===================================================================== */}
      {selectedStudentRow ? (
        <div className="space-y-6">
          {/* Topo da Ficha: Voltar + Identificação + Ações de Editar e Inativar/Reativar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={handleBackToList}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Voltar para a Lista de Alunos
            </Button>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="ghost"
                onClick={() => handleOpenEditModal(selectedStudentRow)}
                leftIcon={<FilePenLine className="h-4 w-4" />}
              >
                Editar Cadastro
              </Button>

              <Button
                variant={
                  selectedStudentRow.person.status === 'active' ? 'danger' : 'primary'
                }
                onClick={() => setStatusDialogTarget(selectedStudentRow.person)}
                leftIcon={
                  selectedStudentRow.person.status === 'active' ? (
                    <Power className="h-4 w-4" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )
                }
              >
                {selectedStudentRow.person.status === 'active'
                  ? 'Inativar Aluno (Preservar Histórico)'
                  : 'Reativar Cadastro do Aluno'}
              </Button>
            </div>
          </div>

          {/* Cabeçalho Estilo SUAP do Perfil Acadêmico */}
          <Card className="border-t-4 border-t-primary-700 dark:border-t-primary-500">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      selectedStudentRow.person.status === 'active'
                        ? 'success'
                        : 'neutral'
                    }
                  >
                    {selectedStudentRow.person.status === 'active'
                      ? 'Cadastro Ativo'
                      : 'Cadastro Inativo / Trancado'}
                  </Badge>
                  <Badge variant="primary">{selectedStudentRow.classRoomName}</Badge>
                  <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                    Matrícula: {selectedStudentRow.enrollment?.enrollmentCode ?? 'BS-2026'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {getDisplayName(selectedStudentRow.person)}
                </h1>

                {selectedStudentRow.person.socialName && (
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Nome de registro civil: <strong>{selectedStudentRow.person.fullName}</strong>
                  </p>
                )}

                <p className="text-sm text-slate-600 dark:text-slate-300">
                  CPF: <strong>{selectedStudentRow.person.cpf}</strong> • Telefone:{' '}
                  <strong>{selectedStudentRow.person.phone}</strong> • E-mail:{' '}
                  <strong>{selectedStudentRow.person.email}</strong>
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center dark:border-slate-800 dark:bg-slate-950">
                  <span className="block text-xs font-bold text-slate-500">Frequência</span>
                  <span
                    className={`text-xl font-extrabold ${
                      selectedStudentRow.attendancePct < 75
                        ? 'text-danger-700 dark:text-red-400'
                        : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {selectedStudentRow.attendancePct}%
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center dark:border-slate-800 dark:bg-slate-950">
                  <span className="block text-xs font-bold text-slate-500">Média ENEM</span>
                  <span className="text-xl font-extrabold text-secondary-800 dark:text-secondary-300">
                    {selectedStudentRow.enemAvg > 0
                      ? formatEnemScore(selectedStudentRow.enemAvg)
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Barra de Abas do Perfil Acadêmico (5 Abas) */}
            <div
              role="tablist"
              aria-label="Abas da ficha acadêmica do estudante"
              className="mt-6 flex flex-wrap gap-2 border-t border-slate-200 pt-4 dark:border-slate-800"
            >
              {(
                [
                  {
                    id: 'dados_pessoais',
                    label: '1. Dados Pessoais',
                    icon: <Users className="h-4 w-4" />,
                  },
                  {
                    id: 'matriculas',
                    label: '2. Matrículas',
                    icon: <FileText className="h-4 w-4" />,
                  },
                  {
                    id: 'frequencia',
                    label: '3. Frequência',
                    icon: <CalendarCheck className="h-4 w-4" />,
                  },
                  {
                    id: 'boletim_simulados',
                    label: '4. Boletim / Simulados',
                    icon: <GraduationCap className="h-4 w-4" />,
                  },
                  {
                    id: 'historico_ocorrencias',
                    label: '5. Histórico / Ocorrências',
                    icon: <History className="h-4 w-4" />,
                  },
                ] as const
              ).map((tab) => {
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setActiveTab(tab.id)}
                    className={`min-h-[44px] inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold transition-all ${
                      isSelected
                        ? 'bg-primary-700 text-white shadow-xs dark:bg-primary-600'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span aria-hidden="true">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* CONTEÚDO DA ABA 1: DADOS PESSOAIS */}
          {activeTab === 'dados_pessoais' && (
            <Card
              title="Dados Pessoais, Contato e Vínculo Familiar"
              subtitle="Informações cadastrais completas compartilhadas na entidade central Person."
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-500">Nome Completo</span>
                  <p className="mt-1 font-extrabold text-slate-900 dark:text-white">
                    {selectedStudentRow.person.fullName}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-500">Nome Social</span>
                  <p className="mt-1 font-bold text-slate-900 dark:text-white">
                    {selectedStudentRow.person.socialName || 'Não informado'}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-500">
                    Data de Nascimento e Idade
                  </span>
                  <p className="mt-1 font-bold text-slate-900 dark:text-white">
                    {formatDateBR(selectedStudentRow.person.birthDate)} (
                    {calculateAgeYears(selectedStudentRow.person.birthDate)} anos)
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-500">CPF e RG</span>
                  <p className="mt-1 font-bold text-slate-900 dark:text-white">
                    CPF: {selectedStudentRow.person.cpf} • RG: {selectedStudentRow.person.rg}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-500">Autodeclaração Racial</span>
                  <p className="mt-1 font-bold text-slate-900 dark:text-white">
                    {selectedStudentRow.person.race}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-500">Responsável Familiar</span>
                  <p className="mt-1 font-bold text-slate-900 dark:text-white">
                    {selectedStudentRow.guardian
                      ? `${getDisplayName(selectedStudentRow.guardian)} (${
                          selectedStudentRow.relationship
                        }) • ${selectedStudentRow.guardian.phone}`
                      : 'Sem responsável vinculado'}
                  </p>
                </div>
              </div>

              {selectedStudentRow.person.generalNotes && (
                <div className="mt-4 rounded-xl border border-primary-200 bg-primary-50/50 p-4 dark:border-primary-800 dark:bg-primary-950/30">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-primary-900 dark:text-primary-300">
                    Informações Gerais e Observações de Acolhimento
                  </span>
                  <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
                    {selectedStudentRow.person.generalNotes}
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* CONTEÚDO DA ABA 2: MATRÍCULAS */}
          {activeTab === 'matriculas' && (
            <Card
              title="Vínculo de Matrícula e Histórico de Status"
              subtitle="Registro completo de ingresso, turma atribuída e alterações de status."
            >
              {selectedStudentRow.enrollment ? (
                <div className="space-y-4">
                  <div className="rounded-xl border-2 border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        Código: {selectedStudentRow.enrollment.enrollmentCode}
                      </span>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                        {selectedStudentRow.classRoomName} — 2º semestre de 2026
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Data de matrícula: {formatDateBR(selectedStudentRow.enrollment.enrolledAt)}
                      </p>
                    </div>

                    <Badge
                      variant={
                        selectedStudentRow.enrollment.status === 'ativa'
                          ? 'success'
                          : 'warning'
                      }
                    >
                      Status da Matrícula: {selectedStudentRow.enrollment.status.toUpperCase()}
                    </Badge>
                  </div>

                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Linha do Tempo de Status da Matrícula
                  </h4>
                  <div className="space-y-2.5">
                    {selectedStudentRow.enrollment.statusHistory.map((hist, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 p-3.5 text-sm dark:border-slate-800"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Badge variant="neutral">{hist.status.toUpperCase()}</Badge>
                          <span className="text-xs font-bold text-slate-500">
                            Em {formatDateBR(hist.changedAt)}
                          </span>
                        </div>
                        <p className="mt-1.5 text-slate-800 dark:text-slate-200">
                          {hist.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-600">Nenhuma matrícula localizada.</p>
              )}
            </Card>
          )}

          {/* CONTEÚDO DA ABA 3: FREQUÊNCIA */}
          {activeTab === 'frequencia' && (
            <Card
              title="Histórico de Presença nas Aulas"
              subtitle={`Frequência acumulada atual: ${selectedStudentRow.attendancePct}% (Meta mínima: 75%).`}
            >
              <div className="space-y-4">
                <ProgressBarGroup
                  items={[
                    {
                      id: selectedStudentRow.person.id,
                      label: `Assiduidade Geral de ${getDisplayName(selectedStudentRow.person)}`,
                      sublabel: selectedStudentRow.classRoomName,
                      value: selectedStudentRow.attendancePct,
                      max: 100,
                      unit: '%',
                      thresholdPercentage: 75,
                    },
                  ]}
                />

                <div className="space-y-2.5 pt-2">
                  {db.attendances
                    .filter((a) => a.studentPersonId === selectedStudentRow.person.id)
                    .map((att) => {
                      const lesson = db.lessons.find((l) => l.id === att.lessonId);
                      const subject = db.subjects.find((s) => s.id === lesson?.subjectId);
                      return (
                        <div
                          key={att.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3.5 dark:border-slate-800"
                        >
                          <div>
                            <span className="text-xs font-bold text-primary-800 dark:text-primary-300">
                              {formatDateBR(lesson?.date ?? att.recordedAt)} •{' '}
                              {subject?.name ?? 'Aula'}
                            </span>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {lesson?.topic ?? 'Encontro regular'}
                            </p>
                            {att.justification && (
                              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                                Justificativa: {att.justification}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant={
                              att.presence === 'presente'
                                ? 'success'
                                : att.presence === 'justificada'
                                ? 'warning'
                                : 'danger'
                            }
                          >
                            {att.presence.toUpperCase()}
                          </Badge>
                        </div>
                      );
                    })}
                </div>
              </div>
            </Card>
          )}

          {/* CONTEÚDO DA ABA 4: BOLETIM / SIMULADOS */}
          {activeTab === 'boletim_simulados' && (
            <Card
              title="Boletim de Simulados ENEM (Escala 0 a 1.000)"
              subtitle="Resultados alcançados pelo(a) estudante nas avaliações do cursinho."
            >
              <div className="space-y-4">
                {db.grades
                  .filter((g) => g.studentPersonId === selectedStudentRow.person.id)
                  .map((grade) => {
                    const assessment = db.assessments.find(
                      (a) => a.id === grade.assessmentId
                    );
                    return (
                      <div
                        key={grade.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                            {assessment?.title ?? 'Simulado ENEM'}
                          </h4>
                          <Badge variant="secondary" icon={<Award className="h-4 w-4" />}>
                            Média Geral: {formatEnemScore(grade.score)}
                          </Badge>
                        </div>

                        {grade.areaScores && (
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 pt-2 text-xs">
                            <div className="rounded-lg bg-white p-2 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                              <span className="block text-slate-500">Redação</span>
                              <strong className="text-sm">{grade.areaScores.redacao} pts</strong>
                            </div>
                            <div className="rounded-lg bg-white p-2 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                              <span className="block text-slate-500">Humanas</span>
                              <strong className="text-sm">{grade.areaScores.humanas} pts</strong>
                            </div>
                            <div className="rounded-lg bg-white p-2 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                              <span className="block text-slate-500">Linguagens</span>
                              <strong className="text-sm">{grade.areaScores.linguagens} pts</strong>
                            </div>
                            <div className="rounded-lg bg-white p-2 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                              <span className="block text-slate-500">Natureza</span>
                              <strong className="text-sm">{grade.areaScores.natureza} pts</strong>
                            </div>
                            <div className="rounded-lg bg-white p-2 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                              <span className="block text-slate-500">Matemática</span>
                              <strong className="text-sm">{grade.areaScores.matematica} pts</strong>
                            </div>
                          </div>
                        )}

                        {grade.feedback && (
                          <p className="text-xs italic text-slate-700 dark:text-slate-300 pt-1">
                            Devolutiva docente: "{grade.feedback}"
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </Card>
          )}

          {/* CONTEÚDO DA ABA 5: HISTÓRICO / OCORRÊNCIAS PEDAGÓGICAS */}
          {activeTab === 'historico_ocorrencias' && (
            <Card
              title="Histórico de Acolhimento e Ocorrências Pedagógicas"
              subtitle="Registros internos da coordenação sobre acompanhamento individual e familiar."
            >
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                  <span className="text-xs font-bold text-primary-800 dark:text-primary-300">
                    Observação Cadastral Permanente
                  </span>
                  <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
                    {selectedStudentRow.person.generalNotes ||
                      'Nenhuma observação especial registrada até o momento.'}
                  </p>
                </div>

                {selectedStudentRow.attendancePct < 75 && (
                  <CalloutAlert
                    variant="warning"
                    title="Registro Automático de Acompanhamento de Assiduidade"
                  >
                    Estudante encontra-se com presença acumulada de{' '}
                    <strong>{selectedStudentRow.attendancePct}%</strong>. Recomendado contato via
                    WhatsApp ({selectedStudentRow.person.phone}) para oferecer listas de revisão.
                  </CalloutAlert>
                )}
              </div>
            </Card>
          )}
        </div>
      ) : (
        /* =====================================================================
            MODO 2: LISTAGEM GERAL DE ALUNOS COM DATATABLE
           ===================================================================== */
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge variant="primary" icon={<GraduationCap className="h-4 w-4" />}>
                Gestão Acadêmica • Alunos e Matrículas (UC03 a UC06, UC23)
              </Badge>
              <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Gestão de Alunos
              </h1>
              <p className="mt-1 max-w-3xl text-base text-slate-600 dark:text-slate-300">
                Consulte todos os estudantes do cursinho, filtre por turma ou status e clique sobre
                qualquer nome para abrir a ficha acadêmica completa em abas.
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              leftIcon={<UserPlus className="h-5 w-5" />}
              onClick={handleOpenCreateModal}
            >
              Cadastrar Aluno
            </Button>
          </div>

          <Card
            title="Relação de Estudantes do Cursinho Comunitário Bonsucesso"
            subtitle="Clique nos títulos das colunas para ordenar por Nome, Turma, Frequência ou Média ENEM."
          >
            <DataTable
              data={studentRows}
              columns={columns}
              getRowKey={(r) => r.person.id}
              searchLabel="Buscar aluno por Nome, Nome Social, Matrícula ou CPF"
              searchPlaceholder="Ex: Mariana, BS-2026-001, 401.501..."
              searchPredicate={(row, q) =>
                row.person.fullName.toLowerCase().includes(q) ||
                (row.person.socialName?.toLowerCase().includes(q) ?? false) ||
                row.person.cpf.toLowerCase().includes(q) ||
                (row.enrollment?.enrollmentCode.toLowerCase().includes(q) ?? false)
              }
              filters={[
                {
                  id: 'classRoom',
                  label: 'Filtrar por Turma',
                  options: [
                    { value: 'all', label: 'Todas as Turmas' },
                    ...db.classRooms.map((c) => ({ value: c.id, label: c.name })),
                  ],
                  predicate: (row, val) => row.classRoomId === val,
                },
                {
                  id: 'status',
                  label: 'Status do Aluno',
                  options: [
                    { value: 'all', label: 'Todos (Ativos e Inativos)' },
                    { value: 'active', label: 'Somente Ativos' },
                    { value: 'inactive', label: 'Somente Inativos / Trancados' },
                  ],
                  predicate: (row, val) => row.person.status === val,
                },
              ]}
            />
          </Card>
        </>
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO DE ALUNO (Dividido em 4 Seções Lógicas — RF04) */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        size="lg"
        title={
          editingStudentId
            ? 'Editar Cadastro do(a) Estudante'
            : 'Cadastrar Novo(a) Estudante (RF04)'
        }
        description="Formulário organizado em seções claras para facilitar o preenchimento pela secretaria ou coordenação."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsFormModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveStudentForm}
              leftIcon={<Save className="h-4 w-4" />}
            >
              {editingStudentId ? 'Salvar Alterações' : 'Concluir Cadastro e Matrícula'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveStudentForm} className="space-y-6" noValidate>
          {/* Seção 1: Dados Pessoais */}
          <fieldset className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <legend className="px-2 text-sm font-extrabold uppercase tracking-wider text-primary-900 dark:text-primary-300">
              Seção 1 • Dados Pessoais e Turma
            </legend>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Nome Completo (Registro Civil)"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                errorText={errors.fullName}
                placeholder="Ex: Mariana Oliveira Santos"
              />

              <Input
                label="Nome Social"
                optionalText="Opcional"
                value={socialName}
                onChange={(e) => setSocialName(e.target.value)}
                placeholder="Como prefere ser chamado(a)"
              />

              <Input
                label="CPF (11 números)"
                required
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                errorText={errors.cpf}
                placeholder="Ex: 401.501.601-01"
              />

              <Input
                label="RG / Identidade"
                required
                value={rg}
                onChange={(e) => setRg(e.target.value)}
                errorText={errors.rg}
                placeholder="Ex: 41.001.101-1"
              />

              <Input
                label="Data de Nascimento"
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                errorText={errors.birthDate}
                helperText={`Idade calculada automaticamente: ${studentAge} anos.`}
              />

              <Select
                label="Autodeclaração Racial"
                required
                value={race}
                onChange={(e) => setRace(e.target.value as RaceDeclaration)}
                options={RACE_OPTIONS}
              />
            </div>

            {!editingStudentId && (
              <Select
                label="Turma de Ingresso (2º Semestre de 2026)"
                required
                value={classRoomId}
                onChange={(e) => setClassRoomId(e.target.value)}
                options={db.classRooms.map((c) => ({
                  value: c.id,
                  label: `${c.name} (${c.scheduleSummary})`,
                }))}
              />
            )}
          </fieldset>

          {/* Seção 2: Contato */}
          <fieldset className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <legend className="px-2 text-sm font-extrabold uppercase tracking-wider text-primary-900 dark:text-primary-300">
              Seção 2 • Contato do(a) Estudante
            </legend>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Celular / WhatsApp com DDD"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                errorText={errors.phone}
                placeholder="Ex: (21) 99201-0001"
              />

              <Input
                label="E-mail de Acesso ao Portal"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                errorText={errors.email}
                placeholder="Ex: nome.estudante@bonsucesso.org.br"
              />
            </div>
          </fieldset>

          {/* Seção 3: Dados de Responsável (Obrigatório / Sugerido automaticamente se menor de 18 anos) */}
          <fieldset className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <legend className="px-2 text-sm font-extrabold uppercase tracking-wider text-primary-900 dark:text-primary-300">
              Seção 3 • Vínculo com Pai, Mãe ou Responsável
            </legend>

            {isMinorUnder18 && (
              <CalloutAlert
                variant="warning"
                title={`Estudante menor de 18 anos (${studentAge} anos) — Vínculo Familiar Obrigatório`}
              >
                Pela data de nascimento informada, este(a) jovem tem menos de 18 anos. Selecione
                abaixo o responsável familiar para acompanhamento de frequência.
              </CalloutAlert>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label={
                  isMinorUnder18
                    ? 'Responsável Familiar (Obrigatório)'
                    : 'Responsável Familiar (Opcional para maiores de 18 anos)'
                }
                required={isMinorUnder18}
                value={selectedGuardianId}
                onChange={(e) => setSelectedGuardianId(e.target.value)}
                errorText={errors.guardian}
                options={[
                  { value: '', label: 'Sem responsável vinculado' },
                  ...availableGuardians.map((g) => ({
                    value: g.id,
                    label: `${getDisplayName(g)} (${g.phone})`,
                  })),
                ]}
              />

              <Select
                label="Grau de Parentesco"
                value={guardianRelationship}
                onChange={(e) =>
                  setGuardianRelationship(
                    e.target.value as Responsibility['relationship']
                  )
                }
                options={[
                  { value: 'Mãe', label: 'Mãe' },
                  { value: 'Pai', label: 'Pai' },
                  { value: 'Avó/Avô', label: 'Avó / Avô' },
                  { value: 'Tia/Tio', label: 'Tia / Tio' },
                  { value: 'Responsável Legal', label: 'Responsável Legal' },
                ]}
              />
            </div>
          </fieldset>

          {/* Seção 4: Informações Gerais */}
          <fieldset className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <legend className="px-2 text-sm font-extrabold uppercase tracking-wider text-primary-900 dark:text-primary-300">
              Seção 4 • Informações Gerais e Acolhimento
            </legend>

            <Input
              label="Observações Pedagógicas, Curso Pretendido ou Necessidades de Transporte"
              optionalText="Opcional"
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Ex: Pretende cursar Enfermagem; trabalha até as 18h30."
            />
          </fieldset>
        </form>
      </Modal>

      {/* CONFIRM DIALOG PARA INATIVAR / REATIVAR ALUNO PRESERVANDO HISTÓRICO */}
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
        consequenceNote="Nenhum histórico de presença, notas de simulados ou ocorrências será apagado (Preservação integral de histórico acadêmico)."
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
