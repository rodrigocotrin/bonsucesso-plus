import React, { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import {
  Button,
  CalloutAlert,
  Input,
  Modal,
  Select,
} from '../../../components/ui';
import { useMockDatabase } from '../../../contexts/MockDatabaseContext';
import { useToast } from '../../../contexts/ToastContext';
import {
  Enrollment,
  Person,
  RaceDeclaration,
  Responsibility,
  UserAccount,
} from '../../../types';
import { getDisplayName } from '../../../utils/formatters';
import {
  calculateAgeYears,
  validateCpfField,
  validateEmailField,
  validatePhoneField,
} from '../../../utils/validators';
import { EnrichedStudentRow } from './StudentProfileTabsView';

const RACE_OPTIONS: Array<{ value: RaceDeclaration; label: string }> = [
  { value: 'Parda', label: 'Parda' },
  { value: 'Preta', label: 'Preta' },
  { value: 'Branca', label: 'Branca' },
  { value: 'Indígena', label: 'Indígena' },
  { value: 'Amarela', label: 'Amarela' },
  { value: 'Prefiro não declarar', label: 'Prefiro não declarar' },
];

export interface StudentRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRow: EnrichedStudentRow | null;
}

/**
 * Subcomponente coeso (SRP): Modal de Cadastro / Edição de Aluno dividido em 4 seções lógicas (RF04).
 */
export const StudentRegistrationModal: React.FC<StudentRegistrationModalProps> = ({
  isOpen,
  onClose,
  editingRow,
}) => {
  const { db, addPersonWithAccount, updatePerson } = useMockDatabase();
  const { showToast } = useToast();

  const availableGuardians = useMemo(
    () => db.persons.filter((p) => p.id.startsWith('per-resp-')),
    [db.persons]
  );

  // Seção 1: Dados Pessoais
  const [fullName, setFullName] = useState('');
  const [socialName, setSocialName] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [birthDate, setBirthDate] = useState('2009-04-15');
  const [race, setRace] = useState<RaceDeclaration>('Parda');
  const [classRoomId, setClassRoomId] = useState('cls-esperanca');

  // Seção 2: Contato
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Seção 3: Dados de Responsável (Obrigatório / Sugerido automaticamente se < 18 anos)
  const [selectedGuardianId, setSelectedGuardianId] = useState('');
  const [guardianRelationship, setGuardianRelationship] =
    useState<Responsibility['relationship']>('Mãe');

  // Seção 4: Informações Gerais e Acolhimento
  const [generalNotes, setGeneralNotes] = useState('');

  // Erros específicos por campo
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    if (editingRow) {
      setFullName(editingRow.person.fullName);
      setSocialName(editingRow.person.socialName ?? '');
      setCpf(editingRow.person.cpf);
      setRg(editingRow.person.rg);
      setBirthDate(editingRow.person.birthDate);
      setRace(editingRow.person.race);
      setClassRoomId(editingRow.classRoomId);
      setPhone(editingRow.person.phone);
      setEmail(editingRow.person.email);
      setSelectedGuardianId(editingRow.guardian?.id ?? '');
      setGuardianRelationship(editingRow.relationship ?? 'Mãe');
      setGeneralNotes(editingRow.person.generalNotes ?? '');
    } else {
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
    }
    setErrors({});
  }, [isOpen, editingRow, availableGuardians]);

  const studentAge = useMemo(() => calculateAgeYears(birthDate), [birthDate]);
  const isMinorUnder18 = studentAge < 18;
  const editingStudentId = editingRow?.person.id ?? null;

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

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        editingStudentId
          ? 'Editar Cadastro do(a) Estudante'
          : 'Cadastrar Novo(a) Estudante (RF04)'
      }
      description="Formulário organizado em 4 seções claras para facilitar o preenchimento pela secretaria ou coordenação."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
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

        {/* Seção 3: Dados de Responsável */}
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
  );
};
