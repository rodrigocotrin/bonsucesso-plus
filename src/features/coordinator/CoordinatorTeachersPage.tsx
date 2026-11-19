import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Calendar,
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
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="primary" icon={<BookOpen className="h-4 w-4" />}>
            Corpo Docente Comunitário (UC07, UC08)
          </Badge>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Gestão de Professores Voluntários
          </h1>
          <p className="mt-1 max-w-3xl text-base text-slate-600 dark:text-slate-300">
            Cadastre e acompanhe os educadores voluntários do cursinho. Inativar um(a) professor(a)
            preserva todas as aulas e chamadas já registradas no diário.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          leftIcon={<UserPlus className="h-5 w-5" />}
          onClick={handleOpenCreateModal}
        >
          Cadastrar Professor(a)
        </Button>
      </div>

      {/* Barra de Busca e Filtros */}
      <Card
        as="section"
        title="Buscar e Filtrar Corpo Docente"
        subtitle="Localize rapidamente por nome, e-mail, disciplina do ENEM ou status."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 items-end">
          <div className="md:col-span-6">
            <SearchBar
              label="Buscar por nome, nome social, e-mail ou disciplina"
              value={searchQuery}
              onValueChange={setSearchQuery}
              placeholder="Ex: Carlos, Beatriz, Matemática, Redação..."
            />
          </div>

          <div className="md:col-span-3">
            <Select
              label="Filtrar por Disciplina"
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
              label="Status do Voluntário"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'all', label: 'Todos (Ativos e Inativos)' },
                { value: 'active', label: 'Somente Ativos' },
                { value: 'inactive', label: 'Somente Inativos' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Grade de Cards de Professores */}
      {filteredTeachers.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeachers.map((item) => {
            const displayName = getDisplayName(item.person);
            const isActive = item.person.status === 'active';

            return (
              <Card
                key={item.person.id}
                className={`flex flex-col justify-between ${
                  isActive
                    ? 'border-t-4 border-t-primary-700 dark:border-t-primary-500'
                    : 'opacity-80 border-t-4 border-t-slate-400'
                }`}
                footer={
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => handleOpenEditModal(item.person)}
                      leftIcon={<FilePenLine className="h-4 w-4" />}
                    >
                      Editar
                    </Button>

                    <Button
                      variant={isActive ? 'danger' : 'primary'}
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
                <div className="space-y-4">
                  {/* Topo do Card: Avatar + Nome + Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-base font-extrabold text-primary-900 dark:bg-primary-950 dark:text-primary-200"
                        aria-hidden="true"
                      >
                        {getInitials(displayName)}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white truncate">
                          {displayName}
                        </h2>
                        {item.person.socialName && (
                          <p className="text-xs text-slate-500 truncate">
                            Reg. civil: {item.person.fullName}
                          </p>
                        )}
                      </div>
                    </div>

                    <Badge variant={isActive ? 'success' : 'neutral'}>
                      {isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  {/* Disciplinas Atribuídas */}
                  <div className="flex flex-wrap gap-1.5">
                    {item.assignedSubjectNames.map((subjName) => (
                      <Badge key={subjName} variant="primary">
                        {subjName}
                      </Badge>
                    ))}
                  </div>

                  {/* Métricas e Contato */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs space-y-1.5 dark:border-slate-800 dark:bg-slate-950/50">
                    <p className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                      <Calendar className="h-3.5 w-3.5 text-primary-700 dark:text-primary-400" aria-hidden="true" />
                      <span>
                        {item.assignedClassesCount}{' '}
                        {item.assignedClassesCount === 1 ? 'turma' : 'turmas'} •{' '}
                        {item.lessonsCount} aulas registradas
                      </span>
                    </p>
                    <p className="flex items-center gap-2 text-slate-700 dark:text-slate-300 truncate">
                      <Mail className="h-3.5 w-3.5 text-primary-700 dark:text-primary-400 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.person.email}</span>
                    </p>
                    <p className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Phone className="h-3.5 w-3.5 text-primary-700 dark:text-primary-400 shrink-0" aria-hidden="true" />
                      <span>{item.person.phone}</span>
                    </p>
                  </div>

                  {item.person.generalNotes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.person.generalNotes}
                    </p>
                  )}
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
