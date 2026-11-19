import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
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
  Users,
} from 'lucide-react';
import {
  Badge,
  BrandLockup,
  Button,
  CalloutAlert,
  Card,
  Input,
  Modal,
  SemanticTone,
} from '../../components/ui';
import { useSession } from '../../contexts/SessionContext';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import { useToast } from '../../contexts/ToastContext';
import { UserRole } from '../../types';
import { getDefaultRouteForRole } from '../../utils/formatters';

interface QuickRoleCardConfig {
  role: UserRole;
  code: string;
  title: string;
  personName: string;
  subtitle: string;
  emailHint: string;
  tone: SemanticTone;
  icon: React.ReactNode;
}

const QUICK_DEMO_CARDS: QuickRoleCardConfig[] = [
  {
    role: 'coordinator',
    code: 'COORDENADOR',
    title: 'Coordenação Pedagógica',
    personName: 'Ana Paula Ribeiro',
    subtitle: 'Gestão acadêmica, matrículas, copa e doações internas',
    emailHint: 'coordenacao@bonsucesso.org.br',
    tone: 'ink',
    icon: <ShieldCheck className="h-4 w-4 text-ink" />,
  },
  {
    role: 'teacher',
    code: 'PROFESSOR',
    title: 'Professor(a) Voluntário(a)',
    personName: 'Prof. Carlos Eduardo Lima',
    subtitle: 'Chamada rápida, lançamento de notas e Google Classroom',
    emailHint: 'carlos.mat@bonsucesso.org.br',
    tone: 'academic',
    icon: <Users className="h-4 w-4 text-academic" />,
  },
  {
    role: 'student',
    code: 'ALUNO',
    title: 'Estudante',
    personName: 'Mariana Oliveira Santos',
    subtitle: 'Turma Esperança (Noite) • Simulados ENEM e frequência',
    emailHint: 'mariana.estudante@bonsucesso.org.br',
    tone: 'progress',
    icon: <GraduationCap className="h-4 w-4 text-progress" />,
  },
  {
    role: 'guardian',
    code: 'RESPONSAVEL',
    title: 'Responsável Familiar',
    personName: 'Dona Helena Oliveira',
    subtitle: '2 estudantes vinculados (Mariana e Lucas)',
    emailHint: 'helena.oliveira@comunidade.org.br',
    tone: 'assess',
    icon: <HeartHandshake className="h-4 w-4 text-assess-ink" />,
  },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithCredentials, quickLoginAsRole } = useSession();
  const { resetDemoData } = useMockDatabase();
  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<{
    type: 'invalid_credentials' | 'inactive_user';
    message: string;
  } | null>(null);

  const [isForgotOpen, setIsForgotOpen] = useState(
    location.pathname === '/recuperar-senha'
  );
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('482910');
  const [newPasswordDemo, setNewPasswordDemo] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

  useEffect(() => {
    if (location.pathname === '/recuperar-senha') {
      setIsForgotOpen(true);
    }
  }, [location.pathname]);

  const handleCloseForgot = () => {
    setIsForgotOpen(false);
    if (location.pathname === '/recuperar-senha') {
      navigate('/login', { replace: true });
    }
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError(null);

    const result = loginWithCredentials(identifier, password);
    if (!result.success || !result.role) {
      setLoginError({
        type: result.errorType ?? 'invalid_credentials',
        message: result.message ?? 'Não foi possível autenticar. Confira suas credenciais.',
      });
      return;
    }

    showToast({
      variant: 'success',
      title: 'Acesso autenticado no Bonsucesso+',
      description: 'Redirecionando para o seu painel.',
    });
    navigate(getDefaultRouteForRole(result.role), { replace: true });
  };

  const handleQuickDemoLogin = (role: UserRole, personName: string) => {
    setLoginError(null);
    const result = quickLoginAsRole(role);
    if (result.success && result.role) {
      showToast({
        variant: 'info',
        title: `Sessão iniciada: ${personName}`,
        description: 'Você pode alternar entre os 4 perfis pelo seletor no topo da tela.',
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
        setRecoveryError('Informe seu e-mail ou CPF cadastrado na secretaria.');
        return;
      }
      setForgotStep(2);
      return;
    }

    if (forgotStep === 2) {
      if (recoveryCode.trim().length < 4) {
        setRecoveryError('Informe o código numérico de 6 dígitos.');
        return;
      }
      if (newPasswordDemo.trim().length < 6) {
        setRecoveryError('A nova senha deve ter no mínimo 6 caracteres.');
        return;
      }
      setForgotStep(3);
    }
  };

  return (
    <div className="flex min-h-[100dvh] w-full max-w-full flex-col overflow-x-clip bg-paper text-ink">
      {/* Cabeçalho Institucional Bauhaus Suíço */}
      <header className="w-full max-w-full border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <BrandLockup
            size="lg"
            subtitle="Cursinho Comunitário"
          />

          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/design-system"
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded border border-line bg-surface px-3 text-xs font-semibold text-ink hover:border-ink hover:bg-subtle"
            >
              <span className="hidden sm:inline">Catálogo Design System</span>
              <span className="sm:hidden">Design System</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="eyebrow">Acesso Autenticado RBAC • 4 Perfis Oficiais</p>
            <h1 className="mt-1">Portal Acadêmico Bonsucesso+</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="academic">Acadêmico</Badge>
            <Badge variant="progress">Frequência ≥ 75%</Badge>
            <Badge variant="assess">Simulados ENEM 0–1000</Badge>
            <Badge variant="critical">Alertas Críticos</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* Coluna Esquerda: Credenciais */}
          <div className="lg:col-span-5">
            <Card
              eyebrow="Autenticação Institucional"
              title="Entrar com E-mail ou CPF"
              subtitle="Use suas credenciais ou selecione um perfil ao lado para acesso imediato."
            >
              <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
                {loginError && (
                  <CalloutAlert
                    variant={loginError.type === 'inactive_user' ? 'warning' : 'error'}
                    title={
                      loginError.type === 'inactive_user'
                        ? 'Cadastro inativo ou matrícula trancada'
                        : 'Falha na autenticação'
                    }
                  >
                    {loginError.message}
                  </CalloutAlert>
                )}

                <Input
                  label="E-mail ou CPF"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="mariana.estudante@bonsucesso.org.br ou 401.501.601-01"
                  helperText="Aceita CPF com ou sem pontuação."
                  leftIcon={<Mail className="h-4 w-4" />}
                  autoComplete="username"
                />

                <div className="space-y-2">
                  <Input
                    label="Senha"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Senha padrão demo: 123456"
                    helperText="No ambiente de demonstração, todas as contas usam 123456."
                    leftIcon={<Lock className="h-4 w-4" />}
                    autoComplete="current-password"
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-pressed={showPassword}
                        className="inline-flex h-7 items-center gap-1 rounded border border-line bg-paper px-2 text-xs font-medium text-ink hover:bg-subtle"
                      >
                        {showPassword ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Ocultar</span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Mostrar</span>
                          </>
                        )}
                      </button>
                    }
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleOpenForgotModal}
                      className="inline-flex h-10 items-center gap-1.5 text-xs font-semibold text-ink underline underline-offset-4 hover:text-academic"
                    >
                      <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Recuperar senha</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIdentifier('inativo@bonsucesso.org.br');
                        setPassword('123456');
                      }}
                      className="inline-flex h-10 items-center text-xs font-medium text-ink-muted hover:text-critical"
                    >
                      <span>Simular conta inativa</span>
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  leftIcon={<LogIn className="h-4 w-4" />}
                >
                  Acessar Plataforma
                </Button>
              </form>
            </Card>
          </div>

          {/* Coluna Direita: Acesso Rápido de 1 Clique aos 4 Perfis RBAC */}
          <div className="lg:col-span-7">
            <Card
              eyebrow="Validação Rápida de Arquitetura (RBAC)"
              title="Selecionar Perfil para Validação"
              subtitle="Clique em qualquer perfil para abrir o AppShell correspondente. Não existe perfil logado para doadores externos."
              headerAction={<Badge variant="ink">4 Perfis</Badge>}
              footer={
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-ink-muted">
                    Alterações persistem em <code className="num">localStorage</code> durante a sessão.
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<RotateCcw className="h-4 w-4" />}
                    onClick={() => {
                      resetDemoData();
                      showToast({
                        variant: 'success',
                        title: 'Base de demonstração restaurada',
                        description: 'Registros originais do Cursinho Bonsucesso recarregados.',
                      });
                    }}
                  >
                    Restaurar Dados Demo
                  </Button>
                </div>
              }
            >
              <div className="grid grid-cols-1 gap-3">
                {QUICK_DEMO_CARDS.map((card) => (
                  <button
                    key={card.role}
                    type="button"
                    onClick={() => handleQuickDemoLogin(card.role, card.personName)}
                    className="group flex w-full items-start justify-between gap-4 rounded-lg border border-line bg-paper p-4 text-left transition-colors hover:border-ink hover:bg-surface"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded border border-line bg-surface"
                        aria-hidden="true"
                      >
                        {card.icon}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={card.tone}>{card.code}</Badge>
                          <span className="text-sm font-semibold text-ink">{card.title}</span>
                        </div>
                        <p className="mt-1 text-sm font-bold text-ink">{card.personName}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">{card.subtitle}</p>
                        <p className="num mt-1 text-xs text-ink-muted">{card.emailHint}</p>
                      </div>
                    </div>

                    <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded border border-line bg-surface px-2.5 text-xs font-semibold text-ink group-hover:border-ink group-hover:bg-ink group-hover:text-white">
                      <span>Entrar</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Modal de Recuperação de Senha (/recuperar-senha) */}
      <Modal
        isOpen={isForgotOpen}
        onClose={handleCloseForgot}
        title="Recuperação de Senha"
        description="Redefinição guiada em 3 etapas para estudantes, responsáveis, professores e coordenação."
        footer={
          forgotStep < 3 ? (
            <>
              <Button variant="secondary" onClick={handleCloseForgot}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleNextForgotStep}
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
              >
                {forgotStep === 1 ? 'Enviar código' : 'Confirmar nova senha'}
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                handleCloseForgot();
                showToast({
                  variant: 'success',
                  title: 'Senha redefinida com sucesso',
                  description: 'Utilize sua nova credencial para acessar.',
                });
              }}
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
            >
              Concluir e voltar ao Login
            </Button>
          )
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <span className="eyebrow">Fluxo de Recuperação</span>
            <span className="num text-xs font-semibold text-ink">Etapa {forgotStep} / 3</span>
          </div>

          {recoveryError && (
            <CalloutAlert variant="error" title="Verifique o campo informado">
              {recoveryError}
            </CalloutAlert>
          )}

          {forgotStep === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-ink">
                Informe seu <strong>e-mail</strong> ou <strong>CPF</strong> cadastrado no Cursinho Bonsucesso para receber o código de verificação.
              </p>
              <Input
                label="E-mail ou CPF"
                required
                value={recoveryIdentifier}
                onChange={(e) => setRecoveryIdentifier(e.target.value)}
                placeholder="mariana.estudante@bonsucesso.org.br ou 401.501.601-01"
              />
            </div>
          )}

          {forgotStep === 2 && (
            <div className="space-y-4">
              <CalloutAlert variant="info" title="Código de verificação enviado">
                Código simulado <strong className="num">482910</strong> encaminhado para{' '}
                <strong className="num">{recoveryIdentifier}</strong>.
              </CalloutAlert>

              <Input
                label="Código de 6 dígitos"
                mono
                required
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                helperText="Código 482910 pré-preenchido para validação."
              />

              <Input
                label="Nova senha"
                type="password"
                required
                value={newPasswordDemo}
                onChange={(e) => setNewPasswordDemo(e.target.value)}
                placeholder="Mínimo de 6 caracteres"
              />
            </div>
          )}

          {forgotStep === 3 && (
            <CalloutAlert variant="success" title="Credencial atualizada">
              A nova senha foi vinculada ao cadastro <strong className="num">{recoveryIdentifier}</strong>.
            </CalloutAlert>
          )}
        </div>
      </Modal>
    </div>
  );
};
