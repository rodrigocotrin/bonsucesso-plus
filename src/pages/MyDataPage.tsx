import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserCircle,
} from 'lucide-react';
import {
  Badge,
  Button,
  CalloutAlert,
  Card,
  Input,
} from '../components/ui';
import { useSession } from '../contexts/SessionContext';
import { useMockDatabase } from '../contexts/MockDatabaseContext';
import { useToast } from '../contexts/ToastContext';
import {
  formatDateBR,
  getDisplayName,
  getRoleDisplayLabel,
} from '../utils/formatters';

/**
 * Página compartilhada "Meus Dados" para todos os perfis.
 * Exibe informações da entidade central Person e permite atualizar Nome Social, Telefone e E-mail.
 */
export const MyDataPage: React.FC = () => {
  const { currentAccount, currentPerson, linkedStudentsForGuardian } = useSession();
  const { updatePerson } = useMockDatabase();
  const { showToast } = useToast();

  const [socialName, setSocialName] = useState(currentPerson?.socialName ?? '');
  const [phone, setPhone] = useState(currentPerson?.phone ?? '');
  const [email, setEmail] = useState(currentPerson?.email ?? '');

  if (!currentAccount || !currentPerson) return null;

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    updatePerson({
      ...currentPerson,
      socialName: socialName.trim() || undefined,
      phone: phone.trim() || currentPerson.phone,
      email: email.trim() || currentPerson.email,
    });
    showToast({
      variant: 'success',
      title: 'Seus dados foram atualizados!',
      description: 'As alterações foram salvas no seu cadastro com sucesso.',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary" icon={<UserCircle className="h-4 w-4" />}>
            Meus Dados Cadastrais
          </Badge>
          <Badge variant="neutral">{getRoleDisplayLabel(currentAccount.role)}</Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Meus Dados Pessoais
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300">
          Confira suas informações cadastradas no Cursinho Comunitário Bonsucesso e mantenha seu
          telefone e nome social sempre atualizados.
        </p>
      </header>

      {/* Identificação Cadastral (Somente Leitura para campos oficiais) */}
      <Card
        as="section"
        title="Identificação Oficial"
        subtitle="Para corrigir CPF, RG ou data de nascimento, procure a secretaria do cursinho."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Nome Completo
            </span>
            <p className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
              {currentPerson.fullName}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Como você aparece no portal
            </span>
            <p className="mt-1 text-base font-extrabold text-primary-800 dark:text-primary-300">
              {getDisplayName(currentPerson)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              CPF e RG
            </span>
            <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
              CPF: {currentPerson.cpf} • RG: {currentPerson.rg}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Data de Nascimento e Situação</span>
            </span>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-base font-bold text-slate-900 dark:text-white">
                {formatDateBR(currentPerson.birthDate)}
              </span>
              <Badge variant="success" icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
                Cadastro Ativo
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Edição Simples de Contato e Nome Social */}
      <Card
        as="section"
        title="Atualizar Nome Social e Contatos"
        subtitle="Esses dados ajudam a coordenação e os professores a se comunicarem com você."
      >
        <form onSubmit={handleSaveContact} className="space-y-5">
          <Input
            label="Nome Social ou Como Prefere Ser Chamado(a)"
            optionalText="Opcional"
            value={socialName}
            onChange={(e) => setSocialName(e.target.value)}
            placeholder="Ex: Dona Helena, Lari Rocha..."
            helperText="Se preenchido, o portal usará este nome nas saudações e no menu."
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="Telefone / WhatsApp"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone className="h-5 w-5" />}
              helperText="Usado para avisos urgentes da coordenação."
            />

            <Input
              label="E-mail de Acesso"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-5 w-5" />}
              helperText="Utilizado para entrar no portal e recuperar senha."
            />
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" size="lg" leftIcon={<Save className="h-5 w-5" />}>
              Salvar Alterações nos Meus Dados
            </Button>
          </div>
        </form>
      </Card>

      {/* Se for Responsável, mostra os estudantes vinculados */}
      {currentAccount.role === 'guardian' && linkedStudentsForGuardian.length > 0 && (
        <Card
          as="section"
          title="Estudantes Vinculados ao Seu Cadastro"
          subtitle="Relação de jovens sob o seu acompanhamento familiar no cursinho."
        >
          <div className="space-y-3">
            {linkedStudentsForGuardian.map((student) => (
              <div
                key={student.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50"
              >
                <div>
                  <p className="text-base font-extrabold text-slate-900 dark:text-white">
                    {getDisplayName(student)}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    CPF: {student.cpf} • Telefone: {student.phone}
                  </p>
                </div>
                <Badge variant="success" icon={<ShieldCheck className="h-4 w-4" />}>
                  Vínculo Ativo
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <CalloutAlert variant="info" title="Proteção dos seus dados pessoais">
        Suas informações são usadas exclusivamente pela equipe do Cursinho Comunitário Bonsucesso
        para acompanhamento pedagógico e contato com as famílias.
      </CalloutAlert>
    </div>
  );
};
