import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookHeart,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  HeartHandshake,
  KeyRound,
  Lock,
  LogIn,
  Mail,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  Badge,
  Button,
  CalloutAlert,
  Card,
  Input,
  Modal,
} from '../../components/ui';
import { useSession } from '../../contexts/SessionContext';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import { useToast } from '../../contexts/ToastContext';
import { UserRole } from '../../types';
import { getDefaultRouteForRole } from '../../utils/formatters';

interface QuickRoleCardConfig {
  role: UserRole;
  title: string;
  personName: string;
  subtitle: string;
  emailHint: string;
  icon: React.ReactNode;
  accentClass: string;
}

const QUICK_DEMO_CARDS: QuickRoleCardConfig[] = [
  {
    role: 'student',
    title: 'Entrar como Aluno(a)',
    personName: 'Mariana Oliveira Santos',
    subtitle: 'Turma Esperança • Noite (Frequência em alerta < 75%)',
    emailHint: 'mariana.estudante@bonsucesso.org.br',
    icon: <GraduationCap className="h-6 w-6 text-primary-700 dark:text-primary-400" />,
    accentClass: 'hover:border-primary-600 dark:hover:border-primary-400',
  },
  {
    role: 'guardian',
    title: 'Entrar como Responsável',
    personName: 'Dona Helena Oliveira',
    subtitle: 'Mãe vinculada a 2 alunos (Mariana e Lucas)',
    emailHint: 'helena.oliveira@comunidade.org.br',
    icon: <HeartHandshake className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />,
    accentClass: 'hover:border-emerald-600 dark:hover:border-emerald-400',
  },
  {
    role: 'teacher',
    title: 'Entrar como Professor(a)',
    personName: 'Prof. Carlos Eduardo Lima',
    subtitle: 'Voluntário de Matemática (Turma Esperança e Turma A)',
    emailHint: 'carlos.mat@bonsucesso.org.br',
    icon: <Users className="h-6 w-6 text-secondary-700 dark:text-secondary-400" />,
    accentClass: 'hover:border-secondary-600 dark:hover:border-secondary-400',
  },
  {
    role: 'coordinator',
    title: 'Entrar como Coordenador(a)',
    personName: 'Ana Paula Ribeiro',
    subtitle: 'Gestão acadêmica, matrículas, copa/merenda e doações',
    emailHint: 'coordenacao@bonsucesso.org.br',
    icon: <ShieldCheck className="h-6 w-6 text-amber-700 dark:text-amber-400" />,
    accentClass: 'hover:border-amber-600 dark:hover:border-amber-400',
  },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithCredentials, quickLoginAsRole } = useSession();
  const { resetDemoData } = useMockDatabase();
  const { showToast } = useToast();

  // Estado do formulário de login
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<{
    type: 'invalid_credentials' | 'inactive_user';
    message: string;
  } | null>(null);

  // Estado do fluxo "Esqueci minha senha"
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('482910');
  const [newPasswordDemo, setNewPasswordDemo] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError(null);

    const result = loginWithCredentials(identifier, password);
    if (!result.success || !result.role) {
      setLoginError({
        type: result.errorType ?? 'invalid_credentials',
        message: result.message ?? 'Não foi possível entrar. Verifique seus dados.',
      });
      return;
    }

    showToast({
      variant: 'success',
      title: 'Bem-vindo(a) ao IntegraCurso!',
      description: 'Acesso realizado com sucesso.',
    });
    navigate(getDefaultRouteForRole(result.role), { replace: true });
  };

  const handleQuickDemoLogin = (role: UserRole, personName: string) => {
    setLoginError(null);
    const result = quickLoginAsRole(role);
    if (result.success && result.role) {
      showToast({
        variant: 'info',
        title: `Acesso Rápido: ${personName}`,
        description: 'Sessão de demonstração iniciada.',
      });
      navigate(getDefaultRouteForRole(result.role), { replace: true });
    }
  };

  const handleOpenForgotModal = () => {
    setRecoveryIdentifier(identifier);
    setForgotStep(1);
    setRecoveryError('');
    setNewPasswordDemo('');
    setIsForgotOpen(true);
  };

  const handleNextForgotStep = () => {
    setRecoveryError('');
    if (forgotStep === 1) {
      if (!recoveryIdentifier.trim()) {
        setRecoveryError('Informe seu e-mail ou CPF cadastrado na secretaria do cursinho.');
        return;
      }
      setForgotStep(2);
      return;
    }

    if (forgotStep === 2) {
      if (recoveryCode.trim().length < 4) {
        setRecoveryError('Digite o código de 6 números enviado para você.');
        return;
      }
      if (newPasswordDemo.trim().length < 6) {
        setRecoveryError('Escolha uma nova senha com pelo menos 6 caracteres.');
        return;
      }
      setForgotStep(3);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Barra superior limpa com acesso aos controles de acessibilidade logo na entrada */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-700 text-white shadow-xs dark:bg-primary-600"
              aria-hidden="true"
            >
              <BookHeart className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-primary-900 dark:text-primary-200">
                IntegraCurso
              </span>
              <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                Cursinho Comunitário Bonsucesso • Educação que transforma
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* Coluna Esquerda: Formulário Principal de Login */}
          <div className="lg:col-span-6">
            <Card
              title="Entrar no Portal do Cursinho"
              subtitle="Acompanhe suas aulas, presença, simulados do ENEM e avisos da coordenação."
            >
              <form onSubmit={handleFormSubmit} className="space-y-5" noValidate>
                {loginError && (
                  <CalloutAlert
                    variant={loginError.type === 'inactive_user' ? 'warning' : 'error'}
                    title={
                      loginError.type === 'inactive_user'
                        ? 'Cadastro com matrícula trancada ou inativa'
                        : 'Não foi possível entrar'
                    }
                  >
                    {loginError.message}
                  </CalloutAlert>
                )}

                <Input
                  label="Seu E-mail ou CPF"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Ex: mariana.estudante@bonsucesso.org.br ou 401.501.601-01"
                  helperText="Você pode digitar o CPF com ou sem pontos e traço."
                  leftIcon={<Mail className="h-5 w-5" />}
                  autoComplete="username"
                />

                <div className="space-y-2">
                  <Input
                    label="Sua Senha"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha de acesso"
                    helperText="No modo demonstração, a senha padrão de todas as contas é 123456."
                    leftIcon={<Lock className="h-5 w-5" />}
                    autoComplete="current-password"
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-pressed={showPassword}
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        {showPassword ? (
                          <>
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                            <span>Ocultar senha</span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" aria-hidden="true" />
                            <span>Mostrar senha</span>
                          </>
                        )}
                      </button>
                    }
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleOpenForgotModal}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-2 text-sm font-bold text-primary-800 underline underline-offset-4 hover:text-primary-950 dark:text-primary-300 dark:hover:text-primary-100"
                    >
                      <KeyRound className="h-4 w-4" aria-hidden="true" />
                      <span>Esqueci minha senha</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIdentifier('inativo@bonsucesso.org.br');
                        setPassword('123456');
                      }}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      <span>Testar conta inativa</span>
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  leftIcon={<LogIn className="h-5 w-5" />}
                >
                  Entrar no IntegraCurso
                </Button>
              </form>
            </Card>
          </div>

          {/* Coluna Direita: Bloco de Acesso Rápido para Demonstração */}
          <div className="lg:col-span-6 space-y-4">
            <Card
              title="Acesso Rápido para Demonstração (Protótipo MVP)"
              subtitle="Clique em um dos 4 perfis abaixo para entrar imediatamente sem precisar digitar senha."
              headerAction={
                <Badge variant="secondary" icon={<Sparkles className="h-4 w-4" />}>
                  4 Perfis Oficiais
                </Badge>
              }
              footer={
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Os dados alterados ficam salvos no seu navegador (localStorage).
                  </span>
                  <Button
                    variant="ghost"
                    leftIcon={<RotateCcw className="h-4 w-4" />}
                    onClick={() => {
                      resetDemoData();
                      showToast({
                        variant: 'success',
                        title: 'Dados de demonstração restaurados!',
                        description: 'A base do Cursinho Comunitário Bonsucesso voltou ao estado original.',
                      });
                    }}
                  >
                    Resetar dados de demonstração
                  </Button>
                </div>
              }
            >
              <div className="grid grid-cols-1 gap-3.5">
                {QUICK_DEMO_CARDS.map((card) => (
                  <button
                    key={card.role}
                    type="button"
                    onClick={() => handleQuickDemoLogin(card.role, card.personName)}
                    className={`w-full text-left rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-4 transition-all hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-950/50 dark:hover:bg-slate-900 ${card.accentClass}`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-xs border border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                        aria-hidden="true"
                      >
                        {card.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-base font-extrabold text-slate-900 dark:text-white">
                            {card.title}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-primary-800 dark:text-primary-300">
                            <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Entrar agora</span>
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {card.personName}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          {card.subtitle}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Modal Simulado Passo a Passo de "Esqueci minha senha" */}
      <Modal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        title="Recuperação de Senha — Passo a Passo"
        description="Vamos ajudar você a criar uma nova senha de forma simples e segura."
        footer={
          forgotStep < 3 ? (
            <>
              <Button variant="ghost" onClick={() => setIsForgotOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleNextForgotStep}
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
              >
                {forgotStep === 1 ? 'Enviar código de verificação' : 'Salvar nova senha'}
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                setIsForgotOpen(false);
                showToast({
                  variant: 'success',
                  title: 'Sua senha foi atualizada!',
                  description: 'Você já pode entrar usando sua nova senha.',
                });
              }}
              leftIcon={<CheckCircle2 className="h-5 w-5" />}
            >
              Concluir e voltar para o Login
            </Button>
          )
        }
      >
        <div className="space-y-4">
          {/* Indicador visual de etapas */}
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-800 dark:text-primary-300">
            <span>Etapa {forgotStep} de 3</span>
          </div>

          {recoveryError && (
            <CalloutAlert variant="error" title="Confira os dados abaixo">
              {recoveryError}
            </CalloutAlert>
          )}

          {forgotStep === 1 && (
            <div className="space-y-4">
              <p className="text-base text-slate-700 dark:text-slate-200">
                Digite seu <strong>e-mail</strong> ou <strong>CPF</strong> cadastrado no Cursinho Bonsucesso.
                Enviaremos um código de 6 números para confirmar que é você.
              </p>
              <Input
                label="Seu E-mail ou CPF"
                required
                value={recoveryIdentifier}
                onChange={(e) => setRecoveryIdentifier(e.target.value)}
                placeholder="Ex: mariana.estudante@bonsucesso.org.br ou 401.501.601-01"
              />
            </div>
          )}

          {forgotStep === 2 && (
            <div className="space-y-4">
              <CalloutAlert variant="info" title="Código enviado com sucesso!">
                Simulação do protótipo: enviamos o código <strong>482910</strong> para{' '}
                <strong>{recoveryIdentifier}</strong>.
              </CalloutAlert>

              <Input
                label="Código de 6 números recebido"
                required
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                helperText="Já preenchemos o código de demonstração 482910 para facilitar seu teste."
              />

              <Input
                label="Escolha sua nova senha"
                type="password"
                required
                value={newPasswordDemo}
                onChange={(e) => setNewPasswordDemo(e.target.value)}
                placeholder="Mínimo de 6 caracteres"
                helperText="Use uma senha fácil de lembrar por você."
              />
            </div>
          )}

          {forgotStep === 3 && (
            <CalloutAlert variant="success" title="Tudo pronto! Senha redefinida com sucesso">
              Sua nova senha foi registrada para o cadastro <strong>{recoveryIdentifier}</strong>.
              Clique no botão abaixo para voltar à tela inicial e entrar no portal.
            </CalloutAlert>
          )}
        </div>
      </Modal>
    </div>
  );
};
