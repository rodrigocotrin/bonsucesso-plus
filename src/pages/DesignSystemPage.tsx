import React, { useMemo, useState } from 'react';
import {
  Award,
  Bell,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Eye,
  FilePenLine,
  GraduationCap,
  HeartHandshake,
  Mail,
  MessageSquareHeart,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  Badge,
  Button,
  CalloutAlert,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  MetricCard,
  Modal,
  ProgressBarGroup,
  SearchBar,
  Select,
} from '../components/ui';
import { AccessibilityToolbar } from '../components/shared/AccessibilityToolbar';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { useToast } from '../contexts/ToastContext';
import { MOCK_STUDENT_SUMMARY, MOCK_SUBJECT_ATTENDANCE } from '../mocks/designSystemMocks';
import { evaluateAttendanceStatus } from '../utils/formatters';

export const DesignSystemPage: React.FC = () => {
  const { theme, fontScale } = useAccessibility();
  const { showToast } = useToast();

  // Estados de demonstração para formulários e busca
  const [studentName, setStudentName] = useState('Mariana Oliveira Santos');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [phoneError, setPhoneError] = useState('Digite o telefone com DDD (ex: 11 98765-4321) para avisos importantes.');
  const [selectedShift, setSelectedShift] = useState('noite');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSavingDemo, setIsSavingDemo] = useState(false);

  // Estados de demonstração para Modal e ConfirmDialog
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  // Filtra matérias da barra de progresso para demonstrar o EmptyState funcionando na prática
  const filteredSubjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return MOCK_SUBJECT_ATTENDANCE;
    return MOCK_SUBJECT_ATTENDANCE.filter(
      (subj) =>
        subj.subjectName.toLowerCase().includes(query) ||
        subj.area.toLowerCase().includes(query) ||
        subj.teacherName.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const progressItems = useMemo(
    () =>
      filteredSubjects.map((subj) => ({
        id: subj.id,
        label: subj.subjectName,
        sublabel: `Área: ${subj.area} • ${subj.teacherName} (${subj.presentClasses} presenças em ${subj.totalClasses} aulas)`,
        value: subj.percentage,
        max: 100,
        unit: '%',
        thresholdPercentage: 75,
      })),
    [filteredSubjects]
  );

  const overallAttendanceEval = evaluateAttendanceStatus(
    MOCK_STUDENT_SUMMARY.attendancePercentage
  );

  const handleSimulateSave = () => {
    setIsSavingDemo(true);
    window.setTimeout(() => {
      setIsSavingDemo(false);
      showToast({
        variant: 'success',
        title: 'Alterações salvas com sucesso!',
        description: 'Os dados de acompanhamento foram atualizados no caderno da turma.',
      });
    }, 900);
  };

  return (
    <div className="space-y-10 pb-12">
      {/* Cabeçalho Explicativo do Design System */}
      <section aria-labelledby="ds-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge variant="primary" icon={<Sparkles className="h-4 w-4" />}>
              Etapa 1 • Fundação Arquitetural e Design System
            </Badge>
            <h1
              id="ds-heading"
              className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white"
            >
              Catálogo Interativo de Componentes — IntegraCurso
            </h1>
            <p className="mt-1 max-w-3xl text-base text-slate-600 dark:text-slate-300">
              Validação visual e funcional dos componentes reutilizáveis projetados para jovens estudantes,
              professores voluntários e pais ou responsáveis. Abaixo você pode simular as preferências de{' '}
              <strong className="font-semibold text-slate-900 dark:text-white">Tema</strong> e{' '}
              <strong className="font-semibold text-slate-900 dark:text-white">Tamanho da Letra</strong> (que ficarão disponíveis na aba de Configurações do Perfil).
            </p>
          </div>

          <div className="rounded-2xl border border-primary-200 bg-primary-50/80 px-4 py-3 text-sm dark:border-primary-800 dark:bg-primary-950/60">
            <p className="font-bold text-primary-900 dark:text-primary-200">
              Estado Atual de Acessibilidade:
            </p>
            <p className="text-slate-700 dark:text-slate-300 mt-0.5">
              Tema: <strong>{theme === 'light' ? 'Claro Acolhedor' : 'Escuro (Alto Contraste)'}</strong> •{' '}
              Fonte:{' '}
              <strong>
                {fontScale === 'normal'
                  ? 'Normal (16px)'
                  : fontScale === 'large'
                  ? 'Grande (18px)'
                  : 'Extra Grande (20px)'}
              </strong>
            </p>
          </div>
        </div>

        {/* Painel temporário apenas na página de validação do Design System */}
        <Card
          title="Simulação das Preferências de Aparência (Configurações do Perfil)"
          subtitle="Na aplicação final, o site carrega com o tamanho padrão (16px) e estes controles ficarão organizados dentro da aba de Configurações do Perfil de cada usuário."
        >
          <AccessibilityToolbar />
        </Card>
      </section>

      {/* 1. Paleta Institucional e Semântica */}
      <Card
        as="section"
        title="1. Identidade Visual e Cores Semânticas (WCAG 2.1 AA)"
        subtitle="Cores pensadas para transmitir acolhimento comunitário, clareza pedagógica e nunca depender apenas da cor."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-primary-300 bg-primary-700 p-4 text-white">
            <p className="font-bold text-base">Primária Institucional</p>
            <p className="text-sm opacity-90 mt-1">Azul Petróleo / Teal (#0F766E)</p>
            <p className="text-xs opacity-80 mt-2">Acolhimento, confiança e ação principal</p>
          </div>

          <div className="rounded-xl border border-secondary-300 bg-secondary-700 p-4 text-white">
            <p className="font-bold text-base">Destaque Pedagógico</p>
            <p className="text-sm opacity-90 mt-1">Azul Índigo (#4338CA)</p>
            <p className="text-xs opacity-80 mt-2">Simulados ENEM, notas e progresso</p>
          </div>

          <div className="rounded-xl border border-success-500/40 bg-success-50 p-4 text-success-900 dark:bg-success-900/40 dark:text-emerald-100">
            <p className="font-bold text-base">Sucesso / Regular</p>
            <p className="text-sm mt-1">Verde Esmeralda (#047857)</p>
            <p className="text-xs mt-2">Presença ≥ 75% e atividades em dia</p>
          </div>

          <div className="rounded-xl border border-warning-500/50 bg-warning-50 p-4 text-warning-900 dark:bg-warning-900/40 dark:text-amber-100">
            <p className="font-bold text-base">Alerta Preventivo</p>
            <p className="text-sm mt-1">Âmbar Contraste (#B45309)</p>
            <p className="text-xs mt-2">Atenção à frequência ou prazos próximos</p>
          </div>

          <div className="rounded-xl border border-danger-500/50 bg-danger-50 p-4 text-danger-900 dark:bg-danger-900/40 dark:text-red-100">
            <p className="font-bold text-base">Atenção Crítica</p>
            <p className="text-sm mt-1">Vermelho Sóbrio (#B91C1C)</p>
            <p className="text-xs mt-2">Presença &lt; 75% ou campos obrigatórios</p>
          </div>
        </div>
      </Card>

      {/* 2. Botões e Estados de Ação */}
      <Card
        as="section"
        title="2. Botões Acessíveis (Button)"
        subtitle="Área mínima de toque de 44x44px, ícones sempre acompanhados de rótulos claros e estado de carregamento."
      >
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Variantes Principais (Tamanho Padrão 44px)
            </h4>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                leftIcon={<Save className="h-5 w-5" />}
                onClick={handleSimulateSave}
                isLoading={isSavingDemo}
                loadingText="Salvando registro..."
              >
                Salvar Chamada da Turma
              </Button>

              <Button
                variant="secondary"
                leftIcon={<GraduationCap className="h-5 w-5" />}
                onClick={() =>
                  showToast({
                    variant: 'info',
                    title: 'Caderno de Simulados ENEM',
                    description: 'Visualizando notas no padrão de 0 a 1000 pontos.',
                  })
                }
              >
                Ver Notas do Simulado
              </Button>

              <Button
                variant="ghost"
                leftIcon={<Eye className="h-5 w-5" />}
                onClick={() => setIsDetailsModalOpen(true)}
              >
                Ver Ficha da Estudante
              </Button>

              <Button
                variant="danger"
                leftIcon={<Trash2 className="h-5 w-5" />}
                onClick={() => setIsConfirmDialogOpen(true)}
              >
                Cancelar Inscrição no Simulado
              </Button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Tamanhos Amplos (52px) e Estados Desabilitados / Carregando
            </h4>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                leftIcon={<HeartHandshake className="h-5 w-5" />}
                onClick={() =>
                  showToast({
                    variant: 'success',
                    title: 'Mensagem enviada para a coordenação!',
                    description: 'A equipe pedagógica responderá em breve.',
                  })
                }
              >
                Falar com a Coordenação (Botão Amplo)
              </Button>

              <Button variant="primary" isLoading loadingText="Enviando frequência...">
                Enviando
              </Button>

              <Button variant="ghost" disabled leftIcon={<CheckCircle2 className="h-5 w-5" />}>
                Chamada já concluída
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Badges Semânticos */}
      <Card
        as="section"
        title="3. Rótulos de Status (Badge)"
        subtitle="Status visuais claros que combinam ícone + texto explicativo para leitores de tela e pessoas com daltonismo."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="success">Presença em dia (88%)</Badge>
          <Badge variant="warning">Próximo ao limite (76%)</Badge>
          <Badge variant="danger">Atenção: Abaixo de 75% (68%)</Badge>
          <Badge variant="primary" icon={<UserCheck className="h-4 w-4" />}>
            Matrícula Ativa 2026
          </Badge>
          <Badge variant="secondary" icon={<Award className="h-4 w-4" />}>
            Redação Nota 840 / 1000
          </Badge>
          <Badge variant="neutral">Turma Paulo Freire — Noite</Badge>
        </div>
      </Card>

      {/* 4. Cartões de Métricas Pedagógicas (MetricCard) */}
      <section aria-labelledby="metrics-heading" className="space-y-4">
        <div>
          <h2 id="metrics-heading" className="text-xl font-bold text-slate-900 dark:text-white">
            4. Cartões de Métricas Pedagógicas (MetricCard — Escala ENEM e %)
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Exibição direta e sem jargões para acompanhamento de frequência (%) e desempenho nos simulados (0 a 1000 pontos).
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <MetricCard
            title="Frequência Geral nas Aulas"
            value={MOCK_STUDENT_SUMMARY.attendancePercentage}
            scale="percentage"
            accentColor="danger"
            icon={<CalendarCheck className="h-6 w-6 text-danger-700 dark:text-danger-400" />}
            statusBadge={{
              label: overallAttendanceEval.label,
              variant: 'danger',
            }}
            trend={{
              direction: 'down',
              label: '3% abaixo da meta de 75%',
              variant: 'danger',
            }}
            subtitle="Recomendado mínimo de 75% de presença para acompanhar todo o conteúdo do ENEM."
          />

          <MetricCard
            title="Média Geral nos Simulados"
            value={MOCK_STUDENT_SUMMARY.enemAverageScore}
            scale="enem"
            accentColor="secondary"
            icon={<GraduationCap className="h-6 w-6 text-secondary-700 dark:text-secondary-400" />}
            trend={{
              direction: 'up',
              label: '+45 pts desde o 1º Simulado',
              variant: 'success',
            }}
            subtitle="Calculada sobre as 4 áreas de conhecimento + Redação do ENEM."
          />

          <MetricCard
            title="Última Nota de Redação"
            value={MOCK_STUDENT_SUMMARY.redacaoLastScore}
            scale="enem"
            accentColor="primary"
            icon={<FilePenLine className="h-6 w-6 text-primary-700 dark:text-primary-400" />}
            statusBadge={{
              label: 'Ótimo evolução',
              variant: 'success',
            }}
            trend={{
              direction: 'up',
              label: '+80 pts na Competência 3',
              variant: 'success',
            }}
            subtitle="Tema: 'Caminhos para democratizar o acesso à leitura no Brasil'."
          />
        </div>
      </section>

      {/* 5. Avisos Contextuais (CalloutAlert) */}
      <Card
        as="section"
        title="5. Avisos Contextuais (CalloutAlert)"
        subtitle="Mensagens acolhedoras que orientam estudantes, pais e professores sem termos burocráticos."
      >
        <div className="space-y-4">
          <CalloutAlert
            variant="warning"
            title="Frequência abaixo de 75% em Matemática Básica"
            action={
              <Button
                variant="ghost"
                onClick={() =>
                  showToast({
                    variant: 'info',
                    title: 'Apoio Pedagógico Solicitado',
                    description: 'O professor voluntário enviará o material de revisão.',
                  })
                }
              >
                Pedir Material de Revisão
              </Button>
            }
          >
            Notamos que Mariana esteve ausente nas últimas 3 aulas de Matemática (presença atual: 65%).
            Se precisar de ajuda com transporte ou horários de monitoria, converse com a coordenação.
          </CalloutAlert>

          <CalloutAlert
            variant="info"
            title="Inscrições abertas para o 5º Simulado Comunitário ENEM"
          >
            O simulado acontecerá neste sábado, das 13h às 18h30. Lembre-se de trazer caneta esferográfica
            de tinta preta fabricada em material transparente e lanche leve.
          </CalloutAlert>

          <CalloutAlert
            variant="success"
            title="Redação corrigida pela professora voluntária!"
          >
            Os comentários detalhados por competência do ENEM já estão disponíveis para leitura.
          </CalloutAlert>

          <CalloutAlert
            variant="error"
            title="Não foi possível salvar a lista de presença"
          >
            Verifique se todos os estudantes da turma foram marcados como Presente, Falta ou Falta Justificada antes de concluir.
          </CalloutAlert>
        </div>
      </Card>

      {/* 6. Formulários Claros (Input, Select, SearchBar) */}
      <Card
        as="section"
        title="6. Campos de Formulário Acessíveis (Input, Select e SearchBar)"
        subtitle="Rótulos (labels) sempre visíveis acima do campo, dicas claras de preenchimento e validação explícita."
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Input
            label="Nome completo do(a) estudante"
            required
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Ex: Mariana Oliveira Santos"
            helperText="Use o mesmo nome que consta no documento de identidade para o dia do simulado."
            leftIcon={<Users className="h-5 w-5" />}
          />

          <Select
            label="Turma e Turno de Estudo"
            required
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
            leftIcon={<BookOpen className="h-5 w-5" />}
            helperText="Você pode solicitar mudança de turno diretamente na secretaria comunitária."
            options={[
              { value: 'manha', label: 'Turma Carolina Maria de Jesus — Manhã (08h às 12h)' },
              { value: 'tarde', label: 'Turma Milton Santos — Tarde (14h às 18h)' },
              { value: 'noite', label: 'Turma Paulo Freire — Noite (19h às 22h30)' },
            ]}
          />

          <Input
            label="Telefone ou WhatsApp do Responsável"
            required
            value={guardianPhone}
            onChange={(e) => {
              const val = e.target.value;
              setGuardianPhone(val);
              if (val.trim().length >= 10) {
                setPhoneError('');
              } else {
                setPhoneError('Digite o telefone com DDD (ex: 11 98765-4321) para avisos importantes.');
              }
            }}
            placeholder="Ex: (11) 98765-4321"
            errorText={phoneError}
            helperText="Digite ao menos 10 números acima para ver o erro desaparecer."
            leftIcon={<Mail className="h-5 w-5" />}
          />

          <Input
            label="Observação de Saúde ou Acessibilidade"
            optionalText="Opcional"
            placeholder="Ex: Precisa sentar nas primeiras fileiras da sala"
            helperText="Informação confidencial compartilhada apenas com a coordenação pedagógica."
          />
        </div>
      </Card>

      {/* 7. Barras de Progresso Rotuladas (ProgressBarGroup) + Busca + EmptyState */}
      <Card
        as="section"
        title="7. Barras de Presença por Matéria (ProgressBarGroup) + Busca e Estado Vazio (EmptyState)"
        subtitle="Filtre as matérias abaixo. Se você digitar uma matéria inexistente (ex: 'Francês'), verá o componente EmptyState em ação."
      >
        <div className="space-y-6">
          <div className="max-w-xl">
            <SearchBar
              label="Filtrar matérias por nome, área do ENEM ou professor(a)"
              value={searchQuery}
              onValueChange={setSearchQuery}
              placeholder="Digite ex: Matemática, Redação, Beatriz..."
              helperText="Experimente digitar uma palavra que não existe para testar a mensagem de lista vazia."
            />
          </div>

          {progressItems.length > 0 ? (
            <ProgressBarGroup items={progressItems} showThresholdMarker defaultThreshold={75} />
          ) : (
            <EmptyState
              title={`Nenhuma matéria encontrada para "${searchQuery}"`}
              description="Não encontramos nenhuma disciplina ou professor com esse termo. Verifique a grafia ou limpe o filtro para ver todas as matérias do cursinho."
              action={
                <Button
                  variant="primary"
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                  onClick={() => setSearchQuery('')}
                >
                  Mostrar Todas as Matérias
                </Button>
              }
            />
          )}
        </div>
      </Card>

      {/* 8. Modais, Prevenção de Erros e Notificações Toast */}
      <Card
        as="section"
        title="8. Janelas de Diálogo (Modal, ConfirmDialog) e Feedback Imediato (ToastNotification)"
        subtitle="Com trap de foco por teclado, fechamento via tecla Esc e foco nas Heurísticas de Nielsen (Visibilidade do Status e Prevenção de Erros)."
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/60 space-y-3">
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Testar Modal e Diálogo de Confirmação (Trap de Foco + Esc)
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Ao abrir qualquer janela, o foco do teclado fica retido dentro dela e a tecla <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-800">Esc</kbd> fecha com segurança.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                variant="primary"
                leftIcon={<MessageSquareHeart className="h-5 w-5" />}
                onClick={() => setIsDetailsModalOpen(true)}
              >
                Abrir Modal de Acolhimento
              </Button>

              <Button
                variant="danger"
                leftIcon={<Trash2 className="h-5 w-5" />}
                onClick={() => setIsConfirmDialogOpen(true)}
              >
                Abrir ConfirmDialog (Prevenção de Erro)
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/60 space-y-3">
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Testar Notificações Instantâneas (ToastNotification)
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Cada clique dispara um feedback claro no canto inferior direito da tela com botão rotulado para fechar.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-2">
              <Button
                variant="primary"
                leftIcon={<Bell className="h-4 w-4" />}
                onClick={() =>
                  showToast({
                    variant: 'success',
                    title: 'Presença registrada com sucesso!',
                    description: '28 estudantes presentes na aula de Redação de hoje.',
                  })
                }
              >
                Toast de Sucesso
              </Button>

              <Button
                variant="secondary"
                leftIcon={<Bell className="h-4 w-4" />}
                onClick={() =>
                  showToast({
                    variant: 'info',
                    title: 'Novo material de estudo publicado',
                    description: 'Apostila de História do Brasil disponível para download.',
                  })
                }
              >
                Toast Informativo
              </Button>

              <Button
                variant="ghost"
                leftIcon={<Bell className="h-4 w-4" />}
                onClick={() =>
                  showToast({
                    variant: 'warning',
                    title: 'Atenção à frequência da turma',
                    description: '3 estudantes atingiram 74% de presença nesta semana.',
                  })
                }
              >
                Toast de Alerta
              </Button>

              <Button
                variant="danger"
                leftIcon={<Bell className="h-4 w-4" />}
                onClick={() =>
                  showToast({
                    variant: 'error',
                    title: 'Falha ao enviar nota do simulado',
                    description: 'A nota da redação deve estar entre 0 e 1000 pontos.',
                  })
                }
              >
                Toast de Erro
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 9. Demonstração Isolada de EmptyState */}
      <Card
        as="section"
        title="9. Componente EmptyState (Visão Dedicada)"
        subtitle="Exibido quando o usuário ainda não possui registros ou quando um filtro não encontra resultados."
      >
        <EmptyState
          title="Nenhum simulado realizado neste mês"
          description="Você ainda não tem notas lançadas para o ciclo atual de simulados do ENEM. Assim que a coordenação publicar o gabarito, seu desempenho aparecerá aqui."
          action={
            <Button
              variant="primary"
              leftIcon={<Plus className="h-5 w-5" />}
              onClick={() =>
                showToast({
                  variant: 'info',
                  title: 'Calendário de Simulados',
                  description: 'O próximo simulado geral ocorrerá no dia 28/11 às 13h.',
                })
              }
            >
              Ver Calendário dos Próximos Simulados
            </Button>
          }
        />
      </Card>

      {/* Instância do Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Registrar Justificativa de Ausência"
        description="Envie uma mensagem simples para a coordenação explicando o motivo da falta."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsDetailsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
              onClick={() => {
                setIsDetailsModalOpen(false);
                showToast({
                  variant: 'success',
                  title: 'Justificativa enviada para a coordenação!',
                  description: 'A equipe pedagógica atualizará o registro de presença.',
                });
              }}
            >
              Enviar Justificativa
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Data da aula em que esteve ausente"
            type="date"
            defaultValue="2026-11-18"
            required
          />
          <Select
            label="Motivo principal da ausência"
            required
            defaultValue="trabalho"
            options={[
              { value: 'saude', label: 'Consulta médica ou questão de saúde' },
              { value: 'trabalho', label: 'Horário de trabalho ou entrevista de emprego' },
              { value: 'transporte', label: 'Dificuldade com ônibus / transporte público' },
              { value: 'familia', label: 'Apoio a familiar em casa' },
            ]}
          />
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Fique tranquilo(a): nosso objetivo é apoiar sua caminhada até o ENEM e disponibilizar o resumo da aula perdida.
          </p>
        </div>
      </Modal>

      {/* Instância do ConfirmDialog */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={() => {
          setIsConfirmDialogOpen(false);
          showToast({
            variant: 'warning',
            title: 'Inscrição no simulado cancelada',
            description: 'Você pode se inscrever novamente até sexta-feira às 20h.',
          });
        }}
        variant="danger"
        title="Deseja cancelar a participação no 5º Simulado?"
        description="Você está prestes a liberar a vaga reservada para Mariana Oliveira Santos no simulado presencial deste sábado."
        consequenceNote="Ao cancelar, o caderno de questões impresso será destinado a outro estudante da lista de espera."
        confirmLabel="Sim, cancelar participação"
        cancelLabel="Manter minha inscrição"
      />
    </div>
  );
};
