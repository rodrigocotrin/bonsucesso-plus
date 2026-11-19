import React, { useMemo, useState } from 'react';
import {
  FilePenLine,
  HeartHandshake,
  Link2,
  Mail,
  Phone,
  Plus,
  Save,
  Trash2,
  UserPlus,
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
import { DataTable, DataTableColumn } from '../../components/shared/DataTable';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import { useToast } from '../../contexts/ToastContext';
import {
  Person,
  RaceDeclaration,
  Responsibility,
  UserAccount,
} from '../../types';
import { getDisplayName } from '../../utils/formatters';
import {
  validateCpfField,
  validateEmailField,
  validatePhoneField,
} from '../../utils/validators';

interface EnrichedGuardianRow {
  person: Person;
  links: Array<{
    responsibility: Responsibility;
    student?: Person;
  }>;
}

export const CoordinatorGuardiansPage: React.FC = () => {
  const {
    db,
    addPersonWithAccount,
    updatePerson,
    addResponsibility,
    removeResponsibility,
  } = useMockDatabase();
  const { showToast } = useToast();

  // Enriquecimento dos responsáveis e estudantes vinculados
  const guardianRows = useMemo<EnrichedGuardianRow[]>(() => {
    const guardianPersons = db.persons.filter((p) => p.id.startsWith('per-resp-'));
    return guardianPersons.map((person) => {
      const links = db.responsibilities
        .filter((r) => r.guardianPersonId === person.id)
        .map((responsibility) => ({
          responsibility,
          student: db.persons.find((p) => p.id === responsibility.studentPersonId),
        }));

      return {
        person,
        links,
      };
    });
  }, [db.persons, db.responsibilities]);

  // Modal de Cadastro / Edição de Responsável
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingGuardianId, setEditingGuardianId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [socialName, setSocialName] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [birthDate, setBirthDate] = useState('1970-06-15');
  const [race, setRace] = useState<RaceDeclaration>('Parda');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modal de Gerenciar Vínculos Familiares (Vincular / Desvincular Alunos)
  const [linkingGuardian, setLinkingGuardian] = useState<Person | null>(null);
  const [selectedStudentToLinkId, setSelectedStudentToLinkId] = useState('');
  const [relationshipToLink, setRelationshipToLink] =
    useState<Responsibility['relationship']>('Mãe');
  const [isPrimaryContactToLink, setIsPrimaryContactToLink] = useState(true);
  const [receivesAcademicInfoToLink, setReceivesAcademicInfoToLink] = useState(true);

  const allStudents = useMemo(
    () => db.persons.filter((p) => p.id.startsWith('per-est-')),
    [db.persons]
  );

  const handleOpenCreateModal = () => {
    setEditingGuardianId(null);
    setFullName('');
    setSocialName('');
    setCpf('');
    setRg('');
    setBirthDate('1972-04-10');
    setRace('Parda');
    setPhone('');
    setEmail('');
    setGeneralNotes('');
    setErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (person: Person) => {
    setEditingGuardianId(person.id);
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
    setIsFormModalOpen(true);
  };

  const handleSaveGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (fullName.trim().length < 5) {
      newErrors.fullName = 'Informe o nome completo do(a) responsável.';
    }

    const cpfCheck = validateCpfField(cpf, db.persons, editingGuardianId);
    if (!cpfCheck.isValid) {
      newErrors.cpf = cpfCheck.errorMessage ?? 'CPF inválido.';
    }

    if (rg.trim().length < 5) {
      newErrors.rg = 'Informe o número de RG.';
    }

    const phoneCheck = validatePhoneField(phone);
    if (!phoneCheck.isValid) {
      newErrors.phone = phoneCheck.errorMessage ?? 'Telefone inválido.';
    }

    const emailCheck = validateEmailField(email, db.persons, editingGuardianId);
    if (!emailCheck.isValid) {
      newErrors.email = emailCheck.errorMessage ?? 'E-mail inválido.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast({
        variant: 'error',
        title: 'Verifique os campos destacados no cadastro',
        description: 'Corrija as mensagens indicadas abaixo de cada campo.',
      });
      return;
    }

    const todayIso = new Date().toISOString().slice(0, 10);

    if (editingGuardianId) {
      const existing = db.persons.find((p) => p.id === editingGuardianId);
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
        title: 'Cadastro do(a) responsável atualizado!',
        description: `${fullName.trim()} salvo(a) com sucesso.`,
      });
    } else {
      const newPersonId = `per-resp-${Date.now()}`;
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
        id: `acc-resp-${Date.now()}`,
        personId: newPersonId,
        role: 'guardian',
        roleLabel: 'Mãe / Pai / Responsável',
        passwordPlainDemo: '123456',
        status: 'active',
      };

      addPersonWithAccount(newPerson, newAccount);
      showToast({
        variant: 'success',
        title: 'Novo(a) responsável cadastrado(a)!',
        description: `Agora você já pode vincular estudantes ao cadastro de ${newPerson.fullName}.`,
      });
    }

    setIsFormModalOpen(false);
  };

  const handleOpenLinkModal = (guardian: Person) => {
    setLinkingGuardian(guardian);
    const alreadyLinkedIds = db.responsibilities
      .filter((r) => r.guardianPersonId === guardian.id)
      .map((r) => r.studentPersonId);
    const firstUnlinked = allStudents.find((s) => !alreadyLinkedIds.includes(s.id));
    setSelectedStudentToLinkId(firstUnlinked?.id ?? '');
    setRelationshipToLink('Mãe');
    setIsPrimaryContactToLink(true);
    setReceivesAcademicInfoToLink(true);
  };

  const handleAddStudentLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkingGuardian || !selectedStudentToLinkId) return;

    const alreadyExists = db.responsibilities.some(
      (r) =>
        r.guardianPersonId === linkingGuardian.id &&
        r.studentPersonId === selectedStudentToLinkId
    );
    if (alreadyExists) {
      showToast({
        variant: 'warning',
        title: 'Este estudante já está vinculado a este responsável',
      });
      return;
    }

    const newLink: Responsibility = {
      id: `resp-rel-${Date.now()}`,
      guardianPersonId: linkingGuardian.id,
      studentPersonId: selectedStudentToLinkId,
      relationship: relationshipToLink,
      isPrimaryContact: isPrimaryContactToLink,
      receivesAcademicInfo: receivesAcademicInfoToLink,
    };

    addResponsibility(newLink);
    const studentName = getDisplayName(
      db.persons.find((p) => p.id === selectedStudentToLinkId)
    );
    showToast({
      variant: 'success',
      title: 'Estudante vinculado(a) com sucesso!',
      description: `${studentName} agora aparece no Portal da Família de ${getDisplayName(
        linkingGuardian
      )}.`,
    });
  };

  const handleUnlinkStudent = (responsibilityId: string, studentName: string) => {
    removeResponsibility(responsibilityId);
    showToast({
      variant: 'info',
      title: 'Vínculo removido',
      description: `${studentName} foi desvinculado(a) deste responsável.`,
    });
  };

  const columns = useMemo<Array<DataTableColumn<EnrichedGuardianRow>>>(
    () => [
      {
        id: 'guardian',
        header: 'Responsável / CPF',
        sortAccessor: (r) => getDisplayName(r.person),
        renderCell: (row) => (
          <div>
            <p className="text-base font-extrabold text-slate-900 dark:text-white">
              {getDisplayName(row.person)}
            </p>
            {row.person.socialName && (
              <span className="block text-xs text-slate-500">
                Nome civil: {row.person.fullName}
              </span>
            )}
            <span className="block text-xs font-mono text-slate-600 dark:text-slate-400">
              CPF: {row.person.cpf}
            </span>
          </div>
        ),
      },
      {
        id: 'contact',
        header: 'Telefone e E-mail',
        renderCell: (row) => (
          <div className="text-xs sm:text-sm space-y-0.5">
            <p className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <Phone className="h-3.5 w-3.5 text-primary-700 dark:text-primary-400" aria-hidden="true" />
              <span>{row.person.phone}</span>
            </p>
            <p className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Mail className="h-3.5 w-3.5 text-primary-700 dark:text-primary-400" aria-hidden="true" />
              <span>{row.person.email}</span>
            </p>
          </div>
        ),
      },
      {
        id: 'linkedStudents',
        header: 'Estudantes Vinculados',
        sortAccessor: (r) => r.links.length,
        renderCell: (row) =>
          row.links.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {row.links.map(({ responsibility, student }) => (
                <Badge key={responsibility.id} variant="primary">
                  {getDisplayName(student)} ({responsibility.relationship})
                </Badge>
              ))}
            </div>
          ) : (
            <Badge variant="warning">Sem estudante vinculado</Badge>
          ),
      },
      {
        id: 'actions',
        header: 'Ações e Vínculos',
        renderCell: (row) => (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => handleOpenLinkModal(row.person)}
              leftIcon={<Link2 className="h-4 w-4" />}
            >
              Vincular / Gerenciar Alunos ({row.links.length})
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleOpenEditModal(row.person)}
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

  const currentLinkingRow = useMemo(
    () =>
      linkingGuardian
        ? guardianRows.find((g) => g.person.id === linkingGuardian.id) ?? null
        : null,
    [guardianRows, linkingGuardian]
  );

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="primary" icon={<Users className="h-4 w-4" />}>
            Acompanhamento Familiar & Vínculos (UC09)
          </Badge>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Gestão de Pais e Responsáveis
          </h1>
          <p className="mt-1 max-w-3xl text-base text-slate-600 dark:text-slate-300">
            Cadastre pais, mães, avós ou responsáveis legais e gerencie o vínculo com um ou mais
            estudantes do cursinho. As alterações refletem imediatamente no Portal da Família.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          leftIcon={<UserPlus className="h-5 w-5" />}
          onClick={handleOpenCreateModal}
        >
          Cadastrar Responsável
        </Button>
      </div>

      {/* DataTable de Responsáveis */}
      <Card
        title="Relação de Responsáveis Familiares"
        subtitle="Clique em 'Vincular / Gerenciar Alunos' para adicionar ou remover estudantes sob acompanhamento."
      >
        <DataTable
          data={guardianRows}
          columns={columns}
          getRowKey={(r) => r.person.id}
          searchLabel="Buscar responsável por Nome, CPF, Telefone ou Nome do Aluno vinculado"
          searchPlaceholder="Ex: Dona Helena, Sebastião, Mariana, Lucas..."
          searchPredicate={(row, q) =>
            row.person.fullName.toLowerCase().includes(q) ||
            (row.person.socialName?.toLowerCase().includes(q) ?? false) ||
            row.person.cpf.toLowerCase().includes(q) ||
            row.links.some((l) =>
              getDisplayName(l.student).toLowerCase().includes(q)
            )
          }
        />
      </Card>

      {/* MODAL PARA VINCULAR / DESVINCULAR ESTUDANTES A UM RESPONSÁVEL */}
      <Modal
        isOpen={Boolean(linkingGuardian)}
        onClose={() => setLinkingGuardian(null)}
        size="lg"
        title={
          linkingGuardian
            ? `Vínculos Familiares de ${getDisplayName(linkingGuardian)}`
            : 'Gerenciar Vínculos'
        }
        description="Defina quais estudantes este responsável acompanha, o grau de parentesco, se é o contato principal e se recebe boletins acadêmicos."
        footer={
          <Button variant="ghost" onClick={() => setLinkingGuardian(null)}>
            Concluir e Fechar
          </Button>
        }
      >
        {currentLinkingRow && (
          <div className="space-y-6">
            {/* Lista de Estudantes Atualmente Vinculados */}
            <div className="space-y-3">
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                Estudantes Atualmente Vinculados ({currentLinkingRow.links.length})
              </h4>

              {currentLinkingRow.links.length > 0 ? (
                <div className="space-y-2.5">
                  {currentLinkingRow.links.map(({ responsibility, student }) => {
                    const studentName = getDisplayName(student);
                    return (
                      <div
                        key={responsibility.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-extrabold text-slate-900 dark:text-white">
                              {studentName}
                            </span>
                            <Badge variant="primary">
                              Parentesco: {responsibility.relationship}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
                            <span>
                              Contato Principal:{' '}
                              <strong>
                                {responsibility.isPrimaryContact ? 'Sim' : 'Não'}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              Recebe Informações Acadêmicas:{' '}
                              <strong>
                                {responsibility.receivesAcademicInfo !== false
                                  ? 'Sim'
                                  : 'Não'}
                              </strong>
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="danger"
                          onClick={() =>
                            handleUnlinkStudent(responsibility.id, studentName)
                          }
                          leftIcon={<Trash2 className="h-4 w-4" />}
                        >
                          Desvincular
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <CalloutAlert
                  variant="warning"
                  title="Nenhum estudante vinculado a este responsável"
                >
                  Use o formulário abaixo para vincular um ou mais estudantes do cursinho.
                </CalloutAlert>
              )}
            </div>

            {/* Formulário para Adicionar Novo Vínculo */}
            <form
              onSubmit={handleAddStudentLink}
              className="space-y-4 rounded-2xl border-2 border-primary-200 bg-primary-50/40 p-4 dark:border-primary-800 dark:bg-primary-950/30"
            >
              <h4 className="flex items-center gap-2 text-base font-extrabold text-primary-950 dark:text-primary-200">
                <HeartHandshake className="h-5 w-5" aria-hidden="true" />
                <span>Vincular Novo Estudante a {getDisplayName(linkingGuardian)}</span>
              </h4>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="Escolher Estudante Cadastrado"
                  required
                  value={selectedStudentToLinkId}
                  onChange={(e) => setSelectedStudentToLinkId(e.target.value)}
                  options={[
                    { value: '', label: 'Selecione um(a) estudante...' },
                    ...allStudents.map((s) => ({
                      value: s.id,
                      label: `${getDisplayName(s)} (CPF: ${s.cpf})`,
                    })),
                  ]}
                />

                <Select
                  label="Grau de Parentesco"
                  required
                  value={relationshipToLink}
                  onChange={(e) =>
                    setRelationshipToLink(
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

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                  <input
                    type="checkbox"
                    checked={isPrimaryContactToLink}
                    onChange={(e) => setIsPrimaryContactToLink(e.target.checked)}
                    className="h-5 w-5 rounded accent-primary-700"
                  />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    É o responsável principal para emergências
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                  <input
                    type="checkbox"
                    checked={receivesAcademicInfoToLink}
                    onChange={(e) => setReceivesAcademicInfoToLink(e.target.checked)}
                    className="h-5 w-5 rounded accent-primary-700"
                  />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Recebe informações de frequência e simulados
                  </span>
                </label>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={!selectedStudentToLinkId}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Confirmar Vínculo Familiar
              </Button>
            </form>
          </div>
        )}
      </Modal>

      {/* MODAL DE CADASTRO / EDIÇÃO DE RESPONSÁVEL */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        size="lg"
        title={
          editingGuardianId
            ? 'Editar Cadastro do(a) Responsável'
            : 'Cadastrar Novo(a) Responsável Familiar'
        }
        description="Preencha os dados pessoais e de contato do familiar."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsFormModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveGuardian}
              leftIcon={<Save className="h-4 w-4" />}
            >
              {editingGuardianId ? 'Salvar Alterações' : 'Cadastrar Responsável'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveGuardian} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nome Completo"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              errorText={errors.fullName}
              placeholder="Ex: Helena Oliveira Santos"
            />

            <Input
              label="Como Prefere Ser Chamado(a)"
              optionalText="Opcional"
              value={socialName}
              onChange={(e) => setSocialName(e.target.value)}
              placeholder="Ex: Dona Helena Oliveira"
            />

            <Input
              label="CPF (11 números)"
              required
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              errorText={errors.cpf}
              placeholder="Ex: 311.422.533-66"
            />

            <Input
              label="RG / Identidade"
              required
              value={rg}
              onChange={(e) => setRg(e.target.value)}
              errorText={errors.rg}
              placeholder="Ex: 12.334.556-7"
            />

            <Input
              label="Telefone / WhatsApp com DDD"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              errorText={errors.phone}
              placeholder="Ex: (21) 99123-4501"
            />

            <Input
              label="E-mail de Acesso"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              errorText={errors.email}
              placeholder="Ex: helena.oliveira@comunidade.org.br"
            />
          </div>

          <Input
            label="Observações de Atendimento (Ex: Melhor horário para ligar)"
            optionalText="Opcional"
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            placeholder="Ex: Prefere contato via WhatsApp após as 18h."
          />
        </form>
      </Modal>
    </div>
  );
};
