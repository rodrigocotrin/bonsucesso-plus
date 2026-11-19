import React, { useMemo, useState } from 'react';
import {
  FilePenLine,
  Mail,
  Phone,
  Power,
  RefreshCw,
  RotateCcw,
  Save,
  UserPlus,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  Modal,
  SearchBar,
  Select,
} from '../../components/ui';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import { useToast } from '../../contexts/ToastContext';
import { Person, RaceDeclaration, UserAccount } from '../../types';
import { getDisplayName, getInitials } from '../../utils/formatters';
import {
  validateCpfField,
  validateEmailField,
  validatePhoneField,
} from '../../utils/validators';

export const CoordinatorTeachersPage: React.FC = () => {
  const { db, addPersonWithAccount, updatePerson, togglePersonStatus } =
    useMockDatabase();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Enriquecimento dos professores voluntários
  const enrichedTeachers = useMemo(() => {
    const teacherPersons = db.persons.filter((p) => p.id.startsWith('per-prof-'));
    return teacherPersons.map((person) => {
      const assignedClassSubjects = db.classSubjects.filter(
        (cs) => cs.teacherPersonId === person.id
      );
      const assignedSubjectIds = Array.from(
        new Set(assignedClassSubjects.map((cs) => cs.subjectId))
      );
      const assignedSubjectNames = assignedSubjectIds
        .map((sid) => db.subjects.find((s) => s.id === sid)?.name)
        .filter((n): n is NonNullable<typeof n> => Boolean(n));

      const lessonsCount = db.lessons.filter(
        (l) => l.teacherPersonId === person.id
      ).length;

      return {
        person,
        assignedSubjectIds,
        assignedSubjectNames:
          assignedSubjectNames.length > 0
            ? assignedSubjectNames
            : ['Plantão / Monitoria Geral'],
        assignedClassesCount: assignedClassSubjects.length,
        lessonsCount,
      };
    });
  }, [db.persons, db.classSubjects, db.subjects, db.lessons]);

  const filteredTeachers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedTeachers.filter((t) => {
      const matchesSearch =
        !q ||
        t.person.fullName.toLowerCase().includes(q) ||
        (t.person.socialName?.toLowerCase().includes(q) ?? false) ||
        t.person.email.toLowerCase().includes(q) ||
        t.assignedSubjectNames.some((s) => s.toLowerCase().includes(q));

      const matchesSubject =
        filterSubjectId === 'all' ||
        t.assignedSubjectIds.includes(filterSubjectId);

      const matchesStatus =
        filterStatus === 'all' || t.person.status === filterStatus;

      return matchesSearch && matchesSubject && matchesStatus;
    });
  }, [enrichedTeachers, searchQuery, filterSubjectId, filterStatus]);

  // Modal de Cadastro / Edição de Professor Voluntário
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [socialName, setSocialName] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [birthDate, setBirthDate] = useState('1991-05-15');
  const [race, setRace] = useState<RaceDeclaration>('Parda');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ConfirmDialog para Inativar / Reativar Professor preservando histórico
  const [statusTarget, setStatusTarget] = useState<Person | null>(null);

  const handleOpenCreateModal = () => {
    setEditingTeacherId(null);
    setFullName('');
    setSocialName('');
    setCpf('');
    setRg('');
    setBirthDate('1992-03-10');
    setRace('Parda');
    setPhone('');
    setEmail('');
    setGeneralNotes('');
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (person: Person) => {
    setEditingTeacherId(person.id);
    setFullName(person.fullName);
    setSocialName(person.socialName ?? '');
    setCpf(person.cpf);
    setRg(person.rg);
    setBirthDate(person.birthDate);
    setRace(person.race);
    setPhone(person.phone);
    setEmail(person.email);
    setGeneralNotes(person.generalNotes ?? '');
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (fullName.trim().length < 5) {
      newErrors.fullName = 'Informe o nome completo do(a) professor(a) voluntário(a).';
    }

    const cpfCheck = validateCpfField(cpf, db.persons, editingTeacherId);
    if (!cpfCheck.isValid) {
      newErrors.cpf = cpfCheck.errorMessage ?? 'CPF inválido.';
    }

    if (rg.trim().length < 5) {
      newErrors.rg = 'Informe o documento de identidade (RG).';
    }

    const phoneCheck = validatePhoneField(phone);
    if (!phoneCheck.isValid) {
      newErrors.phone = phoneCheck.errorMessage ?? 'Telefone inválido.';
    }

    const emailCheck = validateEmailField(email, db.persons, editingTeacherId);
    if (!emailCheck.isValid) {
      newErrors.email = emailCheck.errorMessage ?? 'E-mail inválido.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast({
        variant: 'error',
        title: 'Verifique os campos destacados no cadastro',
        description: 'Corrija as informações inválidas ou duplicadas.',
      });
      return;
    }

    const todayIso = new Date().toISOString().slice(0, 10);

    if (editingTeacherId) {
      const existing = db.persons.find((p) => p.id === editingTeacherId);
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
        title: 'Dados do(a) professor(a) atualizados!',
        description: `${fullName.trim()} salvo(a) com sucesso.`,
      });
    } else {
      const newPersonId = `per-prof-${Date.now()}`;
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
        generalNotes:
          generalNotes.trim() || 'Docente voluntário(a) do Cursinho Comunitário Bonsucesso.',
        status: 'active',
        createdAt: todayIso,
      };

      const newAccount: UserAccount = {
        id: `acc-prof-${Date.now()}`,
        personId: newPersonId,
        role: 'teacher',
        roleLabel: 'Professor(a) Voluntário(a)',
        passwordPlainDemo: '123456',
        status: 'active',
      };

      addPersonWithAccount(newPerson, newAccount);
      showToast({
        variant: 'success',
        title: 'Novo(a) professor(a) voluntário(a) cadastrado(a)!',
        description: `${newPerson.fullName} já pode acessar o portal docente.`,
      });
    }

    setIsModalOpen(false);
  };

  const handleConfirmToggleStatus = () => {
    if (!statusTarget) return;
    const nextStatus = statusTarget.status === 'active' ? 'inactive' : 'active';
    togglePersonStatus(statusTarget.id, nextStatus);
    showToast({
      variant: nextStatus === 'active' ? 'success' : 'warning',
      title:
        nextStatus === 'active'
          ? 'Professor(a) reativado(a) com sucesso!'
          : 'Professor(a) inativado(a) (Histórico de aulas preservado)',
      description: `Status de ${getDisplayName(statusTarget)} atualizado sem excluir nenhuma aula ministrada.`,
    });
    setStatusTarget(null);
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho enxuto (Regra 2) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1>Professores Voluntários</h1>

        <Button
          variant="primary"
          leftIcon={<UserPlus className="h-4 w-4" />}
          onClick={handleOpenCreateModal}
        >
          Novo Professor
        </Button>
      </div>

      {/* Barra de Busca e Filtros */}
      <Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 items-end">
          <div className="md:col-span-6">
            <SearchBar
              label="Pesquisar"
              value={searchQuery}
              onValueChange={setSearchQuery}
              placeholder="Nome, e-mail ou disciplina..."
            />
          </div>

          <div className="md:col-span-3">
            <Select
              label="Disciplina"
              value={filterSubjectId}
              onChange={(e) => setFilterSubjectId(e.target.value)}
              options={[
                { value: 'all', label: 'Todas as Disciplinas' },
                ...db.subjects.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
          </div>

          <div className="md:col-span-3">
            <Select
              label="Situação"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'active', label: 'Ativos' },
                { value: 'inactive', label: 'Inativos' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Grade de Cards Limpos de Professores (Sem box-ception e sem múltiplos botões pretos/vermelhos) */}
      {filteredTeachers.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeachers.map((item) => {
            const displayName = getDisplayName(item.person);
            const isActive = item.person.status === 'active';

            return (
              <Card
                key={item.person.id}
                className={!isActive ? 'opacity-75' : undefined}
                footer={
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditModal(item.person)}
                      leftIcon={<FilePenLine className="h-4 w-4" />}
                    >
                      Editar
                    </Button>

                    <Button
                      variant={isActive ? 'danger' : 'secondary'}
                      size="sm"
                      onClick={() => setStatusTarget(item.person)}
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
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="font-mono flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-subtle text-xs font-semibold text-ink"
                        aria-hidden="true"
                      >
                        {getInitials(displayName)}
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-ink">
                          {displayName}
                        </h2>
                        <p className="text-xs text-ink-muted">
                          <span className="font-mono tabular-nums">{item.assignedClassesCount}</span>{' '}
                          {item.assignedClassesCount === 1 ? 'turma' : 'turmas'} •{' '}
                          <span className="font-mono tabular-nums">{item.lessonsCount}</span> aulas
                        </p>
                      </div>
                    </div>

                    <Badge variant={isActive ? 'progress' : 'neutral'}>
                      {isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {item.assignedSubjectNames.map((subjName) => (
                      <Badge key={subjName} variant="academic">
                        {subjName}
                      </Badge>
                    ))}
                  </div>

                  <div className="space-y-1 pt-1 text-xs text-ink-muted">
                    <p className="flex items-center gap-2 truncate">
                      <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.person.email}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="font-mono tabular-nums">{item.person.phone}</span>
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Nenhum(a) professor(a) encontrado(a)"
          description="Tente limpar os filtros ou cadastre um novo educador voluntário."
          action={
            <Button
              variant="primary"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => {
                setSearchQuery('');
                setFilterSubjectId('all');
                setFilterStatus('all');
              }}
            >
              Limpar Filtros
            </Button>
          }
        />
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO DE PROFESSOR VOLUNTÁRIO (Valida duplicidade de CPF/e-mail) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="lg"
        title={
          editingTeacherId
            ? 'Editar Professor(a) Voluntário(a)'
            : 'Cadastrar Novo(a) Professor(a) Voluntário(a)'
        }
        description="O sistema valida automaticamente se o CPF ou o E-mail já estão cadastrados na entidade central Person."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveTeacher}
              leftIcon={<Save className="h-4 w-4" />}
            >
              {editingTeacherId ? 'Salvar Alterações' : 'Cadastrar Professor(a)'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveTeacher} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nome Completo"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              errorText={errors.fullName}
              placeholder="Ex: Prof. Carlos Eduardo Lima"
            />

            <Input
              label="Nome Social / Como Prefere Ser Chamado(a)"
              optionalText="Opcional"
              value={socialName}
              onChange={(e) => setSocialName(e.target.value)}
              placeholder="Ex: Profa. Nanda Moraes"
            />

            <Input
              label="CPF (11 números — Verifica duplicidade)"
              required
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              errorText={errors.cpf}
              placeholder="Ex: 211.322.433-55"
            />

            <Input
              label="RG / Identidade"
              required
              value={rg}
              onChange={(e) => setRg(e.target.value)}
              errorText={errors.rg}
              placeholder="Ex: 31.400.112-3"
            />

            <Input
              label="Celular / WhatsApp com DDD"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              errorText={errors.phone}
              placeholder="Ex: (21) 98765-1001"
            />

            <Input
              label="E-mail Institucional (Verifica duplicidade)"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              errorText={errors.email}
              placeholder="Ex: nome.disciplina@bonsucesso.org.br"
            />
          </div>

          <Input
            label="Formação Acadêmica, Disciplinas de Atuação e Disponibilidade"
            optionalText="Opcional"
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            placeholder="Ex: Licenciado em Matemática; disponibilidade às segundas e quartas à noite."
          />
        </form>
      </Modal>

      {/* CONFIRM DIALOG PARA INATIVAR / REATIVAR PROFESSOR */}
      <ConfirmDialog
        isOpen={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleConfirmToggleStatus}
        variant={statusTarget?.status === 'active' ? 'danger' : 'primary'}
        title={
          statusTarget?.status === 'active'
            ? `Inativar cadastro de ${getDisplayName(statusTarget)}?`
            : `Reativar cadastro de ${getDisplayName(statusTarget)}?`
        }
        description={
          statusTarget?.status === 'active'
            ? 'O(A) professor(a) voluntário(a) ficará com acesso pausado ao portal.'
            : 'O(A) professor(a) voltará ao status Ativo.'
        }
        consequenceNote="Todas as aulas ministradas, conteúdos lançados e chamadas realizadas por este(a) educador(a) permanecem 100% preservados no histórico das turmas."
        confirmLabel={
          statusTarget?.status === 'active'
            ? 'Sim, inativar preservando histórico'
            : 'Sim, reativar professor(a)'
        }
        cancelLabel="Cancelar"
      />
    </div>
  );
};
