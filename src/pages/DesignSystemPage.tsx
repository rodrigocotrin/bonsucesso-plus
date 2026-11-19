import React, { useState } from 'react';
import {
  Ban,
  BookOpen,
  Calendar,
  ExternalLink,
  Eye,
  GraduationCap,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  Badge,
  BrandLoader,
  BrandLockup,
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
  SkeletonCard,
  SkeletonMetric,
  SkeletonTable,
  SlideOverDrawer,
} from '../components/ui';
import { DataTable, DataTableColumn } from '../components/shared/DataTable';
import { ScheduleMatrix } from '../components/shared/ScheduleMatrix';
import { StudentCard } from '../components/shared/StudentCard';
import { AccessibilityToolbar } from '../components/shared/AccessibilityToolbar';
import { useToast } from '../contexts/ToastContext';
import { AttendancePresence, Person } from '../types';
import { ScheduleMatrixEntry } from '../utils/scheduleConflicts';

interface DemoStudentRow {
  id: string;
  enrollmentCode: string;
  fullName: string;
  cpf: string;
  turma: string;
  attendance: number;
  lastEnemScore: number;
  status: 'active' | 'inactive';
}

const DEMO_STUDENTS: DemoStudentRow[] = [
  {
    id: 'st-01',
    enrollmentCode: '2026.2.0014',
    fullName: 'Mariana Oliveira Santos',
    cpf: '401.501.601-01',
    turma: 'Turma Esperança • Noite',
    attendance: 71,
    lastEnemScore: 610,
    status: 'active',
  },
  {
    id: 'st-02',
    enrollmentCode: '2026.2.0019',
    fullName: 'LucasGabriel Ferreira',
    cpf: '402.502.602-02',
    turma: 'Turma Esperança • Noite',
    attendance: 92,
    lastEnemScore: 685,
    status: 'active',
  },
  {
    id: 'st-03',
    enrollmentCode: '2026.2.0027',
    fullName: 'Beatriz Nascimento Costa',
    cpf: '403.503.603-03',
    turma: 'Turma Paulo Freire • Manhã',
    attendance: 78,
    lastEnemScore: 640,
    status: 'active',
  },
];

const DEMO_MATRIX_ENTRIES: ScheduleMatrixEntry[] = [
  {
    id: 'm-1',
    dayOfWeek: 'Seg',
    shiftSlot: 'Noite',
    dateIso: '2026-11-16',
    startTime: '19:00',
    endTime: '20:30',
    subjectId: 'sub-mat',
    subjectName: 'Matemática e suas Tecnologias',
    classRoomId: 'cls-esp',
    classRoomName: 'Turma Esperança • Sala 01',
    teacherPersonId: 'per-prof-01',
    teacherName: 'Prof. Carlos Eduardo Lima',
    topic: 'Geometria Espacial e Probabilidade ENEM',
    status: 'ministrada',
  },
  {
    id: 'm-2',
    dayOfWeek: 'Seg',
    shiftSlot: 'Noite',
    dateIso: '2026-11-16',
    startTime: '19:30',
    endTime: '21:00',
    subjectId: 'sub-fis',
    subjectName: 'Física — Eletrodinâmica',
    classRoomId: 'cls-a',
    classRoomName: 'Turma Carolina de Jesus • Sala 02',
    teacherPersonId: 'per-prof-01',
    teacherName: 'Prof. Carlos Eduardo Lima',
    topic: 'Circuitos Elétricos e Potência',
    status: 'agendada',
  },
  {
    id: 'm-3',
    dayOfWeek: 'Qua',
    shiftSlot: 'Noite',
    dateIso: '2026-11-18',
    startTime: '19:00',
    endTime: '20:30',
    subjectId: 'sub-red',
    subjectName: 'Redação Dissertativa-Argumentativa',
    classRoomId: 'cls-esp',
    classRoomName: 'Turma Esperança • Sala 01',
    teacherPersonId: 'per-prof-02',
    teacherName: 'Profa. Juliana Mendes',
    topic: 'Competência V e Proposta de Intervenção',
    status: 'agendada',
  },
];

const DEMO_STUDENT_PERSON: Person = {
  id: 'per-est-01',
  fullName: 'Mariana Oliveira Santos',
  cpf: '401.501.601-01',
  rg: '28.419.302-4',
  birthDate: '2007-04-12',
  phone: '(21) 99123-4501',
  race: 'Parda',
  email: 'mariana.estudante@bonsucesso.org.br',
  status: 'active',
  createdAt: '2026-07-15',
};

export const DesignSystemPage: React.FC = () => {
  const { showToast } = useToast();

  const [searchValue, setSearchValue] = useState('');
  const [selectedTurn, setSelectedTurn] = useState('noite');
  const [cpfDemo, setCpfDemo] = useState('123.45');
  const [presenceDemo, setPresenceDemo] = useState<AttendancePresence>('presente');
  const [justificationDemo, setJustificationDemo] = useState('');
  const [isSkeletonDemo, setIsSkeletonDemo] = useState(false);

  // Drawer de Revelação Progressiva (5 Abas Acadêmicas)
  const [drawerStudent, setDrawerStudent] = useState<DemoStudentRow | null>(null);
  const [drawerTab, setDrawerTab] = useState('dados');

  // Modal e Soft Delete
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSoftDeleteOpen, setIsSoftDeleteOpen] = useState(false);

  const columns: Array<DataTableColumn<DemoStudentRow>> = [
    {
      id: 'code',
      header: 'Matrícula',
      sortAccessor: (r) => r.enrollmentCode,
      renderCell: (r) => <span className="num font-semibold">{r.enrollmentCode}</span>,
    },
    {
      id: 'name',
      header: 'Estudante',
      sortAccessor: (r) => r.fullName,
      renderCell: (r) => (
        <div>
          <p className="font-semibold text-ink">{r.fullName}</p>
          <p className="num text-xs text-ink-muted">{r.cpf}</p>
        </div>
      ),
    },
    {
      id: 'turma',
      header: 'Turma / Turno',
      sortAccessor: (r) => r.turma,
      renderCell: (r) => <Badge variant="academic">{r.turma}</Badge>,
    },
    {
      id: 'attendance',
      header: 'Frequência',
      sortAccessor: (r) => r.attendance,
      renderCell: (r) => (
        <Badge variant={r.attendance < 75 ? 'critical' : 'progress'}>
          <span className="num">{r.attendance}%</span>
        </Badge>
      ),
    },
    {
      id: 'enem',
      header: 'Último Simulado',
      sortAccessor: (r) => r.lastEnemScore,
      renderCell: (r) => <span className="num font-semibold">{r.lastEnemScore} pts</span>,
    },
    {
      id: 'actions',
      header: 'Ficha (Drawer)',
      renderCell: (r) => (
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Eye className="h-4 w-4" />}
          onClick={(e) => {
            e.stopPropagation();
            setDrawerStudent(r);
            setDrawerTab('dados');
          }}
        >
          Abrir Ficha
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Cabeçalho do Contrato Global */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink pb-6">
        <div className="space-y-2">
          <p className="eyebrow">Contrato Global de Design System, UX e Frontend</p>
          <h1>Bonsucesso+ — Bauhaus Suíço &amp; Sinalização Funcional (90/10)</h1>
          <p className="max-w-3xl text-sm text-ink-muted">
            90% monocromático (Branco Papel <code className="num">#FAF9F6</code> + Preto Tinta{' '}
            <code className="num">#111111</code>) e 10% semântico funcional nas 4 cores da marca
            (Azul Acadêmico, Verde Progresso, Amarelo Avaliação &amp; Tempo, Vermelho Crítico).
          </p>
        </div>

        <AccessibilityToolbar />
      </div>

      {/* 1. Identidade Visual e Tokens de Cor */}
      <Card
        eyebrow="1. Identidade Visual & Regra 90/10"
        title="Lockup Bonsucesso+ e Tokens Semânticos Obrigatórios"
        subtitle="Proibido usar cores decorativas fora desta tabela ou sombras pesadas."
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded border border-line bg-paper p-4">
            <BrandLockup
              size="lg"
              subtitle="Grade 2x2 (6px + gap 2px) • Plus Jakarta Sans ExtraBold"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="academic">Azul #1D4ED8 • Acadêmico</Badge>
              <Badge variant="progress">Verde #15803D • Progresso</Badge>
              <Badge variant="assess">Amarelo #EAB308 • Avaliação &amp; Tempo</Badge>
              <Badge variant="critical">Vermelho #DC2626 • Crítico</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded border border-academic-border bg-academic-bg p-4">
              <div className="flex items-center justify-between">
                <span className="eyebrow text-academic">Eixo Acadêmico</span>
                <span className="num text-xs font-semibold text-academic">#1D4ED8</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-ink">
                Aulas, Turmas, Disciplinas e Google Classroom
              </p>
              <p className="num mt-1 text-xs text-ink-muted">
                Fundo #EFF6FF • Borda #BFDBFE
              </p>
            </div>

            <div className="rounded border border-progress-border bg-progress-bg p-4">
              <div className="flex items-center justify-between">
                <span className="eyebrow text-progress">Eixo de Progresso</span>
                <span className="num text-xs font-semibold text-progress">#15803D</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-ink">
                Frequência em dia (≥75%), Matrículas Ativas e Metas
              </p>
              <p className="num mt-1 text-xs text-ink-muted">
                Fundo #F0FDF4 • Borda #BBF7D0
              </p>
            </div>

            <div className="rounded border border-assess-border bg-assess-bg p-4">
              <div className="flex items-center justify-between">
                <span className="eyebrow text-assess-ink">Avaliação &amp; Tempo</span>
                <span className="num text-xs font-semibold text-assess-ink">#EAB308</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-ink">
                Simulados ENEM, Notas, Calendário e Alertas Preventivos
              </p>
              <p className="num mt-1 text-xs text-assess-ink">
                Texto obrigatório #111111 ou #854D0E
              </p>
            </div>

            <div className="rounded border border-critical-border bg-critical-bg p-4">
              <div className="flex items-center justify-between">
                <span className="eyebrow text-critical">Eixo Crítico</span>
                <span className="num text-xs font-semibold text-critical">#DC2626</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-ink">
                Faltas &lt;75%, Choques de Horário, Trancamento e Soft Delete
              </p>
              <p className="num mt-1 text-xs text-ink-muted">
                Fundo #FEF2F2 • Borda #FECACA
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. MetricCards (KPIs com JetBrains Mono Tabular) */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="eyebrow">2. Indicadores Pedagógicos &amp; Skeleton Loading</p>
            <h2>MetricCard com JetBrains Mono (tabular-nums)</h2>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsSkeletonDemo((prev) => !prev)}
          >
            {isSkeletonDemo ? 'Exibir Dados Reais' : 'Testar Skeleton Loading'}
          </Button>
        </div>

        {isSkeletonDemo ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SkeletonMetric />
            <SkeletonMetric />
            <SkeletonMetric />
            <SkeletonMetric />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="3º Simulado Geral ENEM"
              value={645}
              scale="enem"
              accentColor="assess"
              icon={<GraduationCap />}
              trend={{ direction: 'up', label: '+45 pts vs. Agosto' }}
              subtitle="Média das 5 áreas do conhecimento"
            />
            <MetricCard
              title="Redação ENEM (Comp. I–V)"
              value={820}
              scale="enem"
              accentColor="academic"
              icon={<BookOpen />}
              statusBadge={{ label: 'Melhor nota do semestre', variant: 'academic' }}
              subtitle="Tema: Acesso à Leitura no Brasil"
            />
            <MetricCard
              title="Assiduidade Geral"
              value={86}
              scale="percentage"
              accentColor="progress"
              icon={<Users />}
              statusBadge={{ label: 'Acima da meta (75%)', variant: 'progress' }}
              subtitle="38 presenças • 6 faltas registradas"
            />
            <MetricCard
              title="Acolhimento Prioritário"
              value={3}
              scale="raw"
              accentColor="critical"
              icon={<Calendar />}
              statusBadge={{ label: 'Frequência < 75%', variant: 'critical' }}
              subtitle="Estudantes acompanhados pela coordenação"
            />
          </div>
        )}
      </section>

      {/* 3. Botões, Badges, Inputs e Validação Inline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card
          className="lg:col-span-6"
          eyebrow="3. Lei de Fitts (Alvos >= 40px Desktop / 44px Mobile)"
          title="Botões, Badges Compactos e Modais"
          subtitle="Ação primária em Preto Tinta (#111111), Google Classroom em Azul (#1D4ED8) e Soft Delete em Vermelho (#DC2626)."
        >
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                leftIcon={<Plus />}
                onClick={() =>
                  showToast({
                    variant: 'success',
                    title: 'Ação primária executada',
                    description: 'Feedback imediato via Toast Notification.',
                  })
                }
              >
                Novo Aluno
              </Button>
              <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
                Abrir Modal
              </Button>
              <Button
                variant="academic"
                leftIcon={<ExternalLink />}
                onClick={() =>
                  showToast({
                    variant: 'info',
                    title: 'Google Classroom',
                    description: 'Abrindo ambiente virtual da Turma Esperança.',
                  })
                }
              >
                Google Classroom
              </Button>
              <Button
                variant="danger"
                leftIcon={<Ban />}
                onClick={() => setIsSoftDeleteOpen(true)}
              >
                Inativar Cadastro
              </Button>
            </div>

            <div className="border-t border-line pt-4">
              <p className="eyebrow mb-2">Badges Compactos (Quadrado 8px + Borda 1px #E4E4E7)</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="progress">Matrícula Ativa</Badge>
                <Badge variant="academic">Turma Esperança • Noite</Badge>
                <Badge variant="assess">Simulado ENEM • 24/11</Badge>
                <Badge variant="critical">Frequência Crítica (71%)</Badge>
                <Badge variant="neutral">Histórico Arquivado</Badge>
              </div>
            </div>
          </div>
        </Card>

        <Card
          className="lg:col-span-6"
          eyebrow="4. Heurística de Nielsen — Prevenção de Erros"
          title="Inputs Tabulares e Validação Inline"
          subtitle="Campos de CPF, notas e horários usam JetBrains Mono e validam diretamente no campo em Vermelho (#DC2626)."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="CPF do Estudante"
              mono
              required
              value={cpfDemo}
              onChange={(e) => setCpfDemo(e.target.value)}
              errorText={
                cpfDemo.replace(/\D/g, '').length !== 11
                  ? 'O CPF deve conter 11 dígitos numéricos.'
                  : undefined
              }
            />
            <Select
              label="Turno da Turma"
              value={selectedTurn}
              onChange={(e) => setSelectedTurn(e.target.value)}
              options={[
                { value: 'manha', label: 'Manhã (07h30 – 12h00)' },
                { value: 'tarde', label: 'Tarde (13h30 – 17h30)' },
                { value: 'noite', label: 'Noite (19h00 – 22h15)' },
              ]}
            />
            <div className="sm:col-span-2">
              <SearchBar
                label="Filtro Rápido"
                value={searchValue}
                onValueChange={setSearchValue}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* 4. DataTable (Máx 6 Colunas) + SlideOverDrawer (Revelação Progressiva) */}
      <Card
        eyebrow="5. Lei de Hick — Controle de Carga Cognitiva"
        title="DataTable Densa (Máx. 6 Colunas) + Slide-over Drawer em Abas"
        subtitle="Clique em qualquer linha ou em 'Abrir Ficha' para inspecionar o SlideOverDrawer com as 5 abas acadêmicas."
      >
        <DataTable
          data={DEMO_STUDENTS}
          columns={columns}
          getRowKey={(r) => r.id}
          isLoading={isSkeletonDemo}
          onRowClick={(r) => {
            setDrawerStudent(r);
            setDrawerTab('dados');
          }}
          searchPredicate={(r, q) =>
            r.fullName.toLowerCase().includes(q) ||
            r.enrollmentCode.toLowerCase().includes(q) ||
            r.cpf.includes(q)
          }
        />
      </Card>

      {/* 5. ProgressBarGroup + StudentCard (Chamada Rápida P/F/J) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card
          className="lg:col-span-6"
          eyebrow="6. Acompanhamento de Assiduidade"
          title="ProgressBarGroup (Meta 75%)"
          subtitle="Marcador vertical da meta mínima e classificação semântica automática."
        >
          <ProgressBarGroup
            items={[
              {
                id: 'aug',
                label: 'Agosto / 2026',
                sublabel: '21 presenças em 24 aulas',
                value: 88,
              },
              {
                id: 'sep',
                label: 'Setembro / 2026',
                sublabel: '19 presenças em 24 aulas',
                value: 79,
              },
              {
                id: 'oct',
                label: 'Outubro / 2026',
                sublabel: '17 presenças em 24 aulas',
                value: 71,
              },
            ]}
          />
        </Card>

        <Card
          className="lg:col-span-6"
          eyebrow="7. Lançamento em Lote (Professor)"
          title="StudentCard com Toggle P / F / J de 1 Clique"
          subtitle="No estado Amarelo (Justificada), o texto permanece #111111 para contraste WCAG AAA."
        >
          <StudentCard
            student={DEMO_STUDENT_PERSON}
            enrollmentCode="2026.2.0014"
            accumulatedAttendancePercentage={71}
            selectedPresence={presenceDemo}
            justification={justificationDemo}
            onChangePresence={setPresenceDemo}
            onChangeJustification={setJustificationDemo}
          />
        </Card>
      </div>

      {/* 6. ScheduleMatrix com Detecção Automática de Conflito em Vermelho */}
      <Card
        eyebrow="8. Grade Horária Matricial (Padrão SUAP Moderno)"
        title="ScheduleMatrix com Alerta Automático de Choque de Horário"
        subtitle="O Prof. Carlos Eduardo está alocado em duas salas sobrepostas na Segunda à Noite (19:00–20:30 e 19:30–21:00)."
      >
        <ScheduleMatrix entries={DEMO_MATRIX_ENTRIES} />
      </Card>

      {/* 7. CalloutAlerts, BrandLoader, Skeletons e EmptyState */}
      <Card
        eyebrow="9. BrandLoader (Animação Geométrica Bauhaus 2x2)"
        title="Carregamento com a Logo em Sentido Horário (Azul → Amarelo → Vermelho → Verde)"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col items-center justify-center rounded-md bg-subtle p-6">
            <BrandLoader variant="inline" size="sm" label="Compacto (sm)" />
          </div>
          <div className="flex flex-col items-center justify-center rounded-md bg-subtle p-6">
            <BrandLoader variant="inline" size="md" label="Carregando gráfico..." />
          </div>
          <div className="flex flex-col items-center justify-center rounded-md bg-subtle p-6">
            <BrandLoader variant="inline" size="lg" label="Carregando dados..." />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card
          className="lg:col-span-6"
          eyebrow="9. Sinalização Contextual"
          title="CalloutAlert nos 4 Eixos Semânticos"
        >
          <div className="space-y-3">
            <CalloutAlert variant="info" title="Lista de Exercícios no Google Classroom">
              Nova lista de Geometria Espacial publicada para a Turma Esperança.
            </CalloutAlert>
            <CalloutAlert variant="warning" title="3º Simulado ENEM neste Sábado (13h00)">
              Abertura dos portões às 12h15. Traga caneta esferográfica preta.
            </CalloutAlert>
            <CalloutAlert variant="error" title="Frequência acumulada abaixo de 75%">
              Agende conversa de acolhimento com a coordenação pedagógica.
            </CalloutAlert>
          </div>
        </Card>

        <div className="lg:col-span-6 space-y-4">
          <EmptyState
            title="Nenhuma avaliação lançada neste filtro"
            description="Você pode cadastrar um novo simulado ENEM ou limpar os filtros ativos."
            action={
              <Button
                variant="primary"
                leftIcon={<Sparkles />}
                onClick={() =>
                  showToast({
                    variant: 'info',
                    title: 'Empty State Acionável',
                    description: 'Sempre orienta o próximo passo ao usuário.',
                  })
                }
              >
                Cadastrar Simulado ENEM
              </Button>
            }
          />
          {isSkeletonDemo && (
            <>
              <SkeletonCard lines={3} />
              <SkeletonTable rows={3} columns={4} />
            </>
          )}
        </div>
      </div>

      {/* SlideOverDrawer — Revelação Progressiva com as 5 Abas Acadêmicas */}
      <SlideOverDrawer
        isOpen={Boolean(drawerStudent)}
        onClose={() => setDrawerStudent(null)}
        eyebrow={drawerStudent ? `Matrícula ${drawerStudent.enrollmentCode}` : undefined}
        title={drawerStudent?.fullName ?? 'Ficha Acadêmica'}
        subtitle={drawerStudent?.turma}
        headerBadge={
          drawerStudent ? (
            <Badge variant={drawerStudent.attendance < 75 ? 'critical' : 'progress'}>
              Frequência {drawerStudent.attendance}%
            </Badge>
          ) : undefined
        }
        tabs={[
          { id: 'dados', label: 'Dados Pessoais' },
          { id: 'matriculas', label: 'Matrículas', badgeCount: 1 },
          { id: 'frequencia', label: 'Frequência' },
          { id: 'boletins', label: 'Boletins ENEM', badgeCount: 3 },
          { id: 'historico', label: 'Histórico' },
        ]}
        activeTabId={drawerTab}
        onTabChange={setDrawerTab}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDrawerStudent(null)}>
              Fechar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setDrawerStudent(null);
                setIsSoftDeleteOpen(true);
              }}
            >
              Inativar Matrícula
            </Button>
          </>
        }
      >
        {drawerStudent && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 rounded border border-line bg-paper p-4">
              <div>
                <span className="eyebrow">CPF</span>
                <p className="num mt-1 text-sm font-semibold text-ink">{drawerStudent.cpf}</p>
              </div>
              <div>
                <span className="eyebrow">Média Último Simulado</span>
                <p className="num mt-1 text-sm font-semibold text-ink">
                  {drawerStudent.lastEnemScore} / 1000 pts
                </p>
              </div>
            </div>
            <p className="text-sm text-ink-muted">
              Aba ativa no Drawer: <strong className="text-ink uppercase">{drawerTab}</strong>. O
              SlideOverDrawer mantém a tabela principal enxuta (máx. 6 colunas) e exibe dados
              completos sob demanda.
            </p>
          </div>
        )}
      </SlideOverDrawer>

      {/* Modal Padrão */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Exemplo de Modal Estrutural"
        description="Trap de foco ativo, fechamento via Esc e borda 1px #E4E4E7 sem sombras pesadas."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              Confirmar
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink">
          Todos os diálogos seguem a superfície <code className="num">#FFFFFF</code> com foco
          monocromático de alto contraste.
        </p>
      </Modal>

      {/* ConfirmDialog — Soft Delete Seguro em Vermelho (#DC2626) */}
      <ConfirmDialog
        isOpen={isSoftDeleteOpen}
        onClose={() => setIsSoftDeleteOpen(false)}
        onConfirm={() => {
          setIsSoftDeleteOpen(false);
          showToast({
            variant: 'warning',
            title: 'Status alterado para Inativo',
            description: 'O histórico acadêmico foi integralmente preservado (Soft Delete).',
          });
        }}
        variant="danger"
        title="Alterar status do cadastro para Inativo?"
        description="No Bonsucesso+, nenhum estudante, professor ou disciplina é excluído fisicamente do banco."
        consequenceNote="O status mudará para Inativo preservando todo o histórico de frequência, notas de simulados e matrículas."
        confirmLabel="Confirmar Inativação"
        cancelLabel="Manter Ativo"
      />
    </div>
  );
};
