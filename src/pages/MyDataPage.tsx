import React, { useState } from 'react';
import {
  Mail,
  Phone,
  Save,
  ShieldCheck,
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1>Meus Dados</h1>
        <Badge variant="neutral">{getRoleDisplayLabel(currentAccount.role)}</Badge>
      </div>

      {/* Identificação Cadastral (Sem sub-caixas com bordas — Regra 3) */}
      <Card as="section" title="Identificação Oficial">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-ink-muted">Nome Completo</dt>
            <dd className="mt-1 text-sm font-medium text-ink">{currentPerson.fullName}</dd>
          </div>

          <div>
            <dt className="text-xs text-ink-muted">Nome de Exibição</dt>
            <dd className="mt-1 text-sm font-medium text-ink">{getDisplayName(currentPerson)}</dd>
          </div>

          <div>
            <dt className="text-xs text-ink-muted">CPF e RG</dt>
            <dd className="font-mono mt-1 text-sm font-medium text-ink tabular-nums">
              {currentPerson.cpf} • {currentPerson.rg}
            </dd>
          </div>

          <div>
            <dt className="text-xs text-ink-muted">Data de Nascimento</dt>
            <dd className="mt-1 flex items-center gap-2 text-sm font-medium text-ink">
              <span className="font-mono tabular-nums">{formatDateBR(currentPerson.birthDate)}</span>
              <Badge variant="progress">Ativo</Badge>
            </dd>
          </div>
        </dl>
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
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
              >
                <div>
                  <p className="text-base font-extrabold text-slate-900">
                    {getDisplayName(student)}
                  </p>
                  <p className="text-sm text-slate-600">
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
