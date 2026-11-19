import { EnemArea } from '../../types';

export interface StudentTodaySlot {
  id: string;
  type: 'lesson' | 'break';
  subjectName?: string;
  area?: EnemArea;
  teacherName?: string;
  startTime: string;
  endTime: string;
  roomLabel?: string;
  topic?: string;
  isNextHighlight?: boolean;
  lessonId?: string;
}

export interface StudentPendingTask {
  id: string;
  title: string;
  subjectName: string;
  dueDateLabel: string;
  urgency: 'hoje' | 'proxima' | 'no_prazo';
}

export interface StudentStudyMaterial {
  id: string;
  title: string;
  subjectName:
    | 'Matemática'
    | 'Redação'
    | 'Português'
    | 'História'
    | 'Geografia'
    | 'Física'
    | 'Química'
    | 'Biologia';
  area: EnemArea;
  type: 'pdf' | 'video' | 'lista_exercicios' | 'classroom';
  typeLabel: string;
  postedAt: string;
  teacherName: string;
  description: string;
  externalUrl?: string;
  isNew?: boolean;
}

export interface StudentAnnouncement {
  id: string;
  title: string;
  summary: string;
  date: string;
  author: string;
  category: 'comunicado' | 'simulado' | 'feriado' | 'visita_pedagogica' | 'aula_especial';
  categoryLabel: string;
  location?: string;
  timeRange?: string;
  isNew?: boolean;
}

export interface WeeklyScheduleSlot {
  id: string;
  dayOfWeek: 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado';
  startTime: string;
  endTime: string;
  subjectName: string;
  area: EnemArea;
  teacherName: string;
  roomLabel: string;
  syllabusTopics: string[];
  studyGuideNotes: string;
  externalClassroomUrl?: string;
  supportVideoUrl?: string;
}

export const STUDENT_TODAY_TIMELINE: StudentTodaySlot[] = [
  {
    id: 'td-1',
    type: 'lesson',
    subjectName: 'Matemática',
    area: 'Matemática',
    teacherName: 'Prof. Carlos Eduardo Lima',
    startTime: '19:00',
    endTime: '20:30',
    roomLabel: 'Sala 01 — Térreo',
    topic: 'Geometria Espacial e Probabilidade — Revisão Reta Final ENEM',
    isNextHighlight: true,
    lessonId: 'les-06',
  },
  {
    id: 'td-break',
    type: 'break',
    startTime: '20:30',
    endTime: '20:45',
    topic: 'Intervalo e Lanche Comunitário na Copa (Pão fresquinho e café)',
  },
  {
    id: 'td-2',
    type: 'lesson',
    subjectName: 'História',
    area: 'Ciências Humanas',
    teacherName: 'Prof. Marcos Vinícius Ferreira',
    startTime: '20:45',
    endTime: '22:15',
    roomLabel: 'Sala 01 — Térreo',
    topic: 'Redemocratização do Brasil e Constituição Cidadã de 1988',
  },
];

export const STUDENT_PENDING_TASKS: StudentPendingTask[] = [
  {
    id: 'tsk-1',
    title: 'Entregar folha da Redação Tema 14 (Acesso à Leitura no Brasil)',
    subjectName: 'Redação',
    dueDateLabel: 'Vence amanhã (20/11)',
    urgency: 'hoje',
  },
  {
    id: 'tsk-2',
    title: 'Resolver Lista de 15 Questões de Porcentagem e Funções',
    subjectName: 'Matemática',
    dueDateLabel: 'Para segunda-feira (23/11)',
    urgency: 'proxima',
  },
  {
    id: 'tsk-3',
    title: 'Confirmar presença no 4º Simulado Comunitário de Sábado',
    subjectName: 'Coordenação',
    dueDateLabel: 'Até quarta-feira (25/11)',
    urgency: 'no_prazo',
  },
];

export const STUDENT_STUDY_MATERIALS: StudentStudyMaterial[] = [
  {
    id: 'mat-01',
    title: 'Guia Prático: Como estruturar a Competência 5 (Proposta de Intervenção)',
    subjectName: 'Redação',
    area: 'Redação',
    type: 'pdf',
    typeLabel: 'Apostila PDF',
    postedAt: '2026-11-18',
    teacherName: 'Profa. Beatriz Souza',
    description: 'Checklist com os 5 elementos obrigatórios na conclusão do ENEM (Agente, Ação, Meio, Efeito e Detalhamento).',
    externalUrl: 'https://classroom.google.com/c/bonsucesso-esperanca-redacao',
    isNew: true,
  },
  {
    id: 'mat-02',
    title: 'Lista Comentada: 20 Questões Recorrentes de Funções e Regra de Três',
    subjectName: 'Matemática',
    area: 'Matemática',
    type: 'lista_exercicios',
    typeLabel: 'Lista de Exercícios',
    postedAt: '2026-11-17',
    teacherName: 'Prof. Carlos Eduardo Lima',
    description: 'Exercícios passo a passo focados nas questões fáceis e médias que mais valorizam sua nota pela TRI.',
    externalUrl: 'https://classroom.google.com/c/bonsucesso-esperanca-matematica',
    isNew: true,
  },
  {
    id: 'mat-03',
    title: 'Vídeo de Revisão: Ecologia, Ciclos Biogeoquímicos e Biomas Brasileiros',
    subjectName: 'Biologia',
    area: 'Ciências da Natureza',
    type: 'video',
    typeLabel: 'Vídeo de Apoio',
    postedAt: '2026-11-15',
    teacherName: 'Profa. Juliana Castro',
    description: 'Resumo visual de 18 minutos sobre ciclo do nitrogênio, carbono e impactos ambientais.',
    externalUrl: 'https://classroom.google.com/c/bonsucesso-esperanca-biologia',
  },
  {
    id: 'mat-04',
    title: 'Linha do Tempo Ilustrada: Era Vargas e República Populista',
    subjectName: 'História',
    area: 'Ciências Humanas',
    type: 'pdf',
    typeLabel: 'Resumo PDF',
    postedAt: '2026-11-14',
    teacherName: 'Prof. Marcos Vinícius',
    description: 'Mapa mental comparando as fases do governo Vargas e as conquistas trabalhistas (CLT).',
    externalUrl: 'https://classroom.google.com/c/bonsucesso-esperanca-historia',
  },
  {
    id: 'mat-05',
    title: 'Fórmulas Essenciais do Cotidiano: Elétrica residencial e Consumo (kWh)',
    subjectName: 'Física',
    area: 'Ciências da Natureza',
    type: 'lista_exercicios',
    typeLabel: 'Lista + Resumo',
    postedAt: '2026-11-12',
    teacherName: 'Prof. Roberto Alves',
    description: 'Como calcular potência elétrica, conta de luz e resistores sem decorar fórmulas complexas.',
    externalUrl: 'https://classroom.google.com/c/bonsucesso-turmac-fisica',
  },
  {
    id: 'mat-06',
    title: 'Química no Dia a Dia: Funções Orgânicas, Polaridade e Sabões',
    subjectName: 'Química',
    area: 'Ciências da Natureza',
    type: 'pdf',
    typeLabel: 'Apostila PDF',
    postedAt: '2026-11-10',
    teacherName: 'Profa. Nanda Moraes',
    description: 'Identificação rápida de cadeias carbônicas e interação intermolecular.',
    externalUrl: 'https://classroom.google.com/c/bonsucesso-turmaa-quimica',
  },
  {
    id: 'mat-07',
    title: 'Interpretação de Textos, Variação Linguística e Funções da Linguagem',
    subjectName: 'Português',
    area: 'Linguagens',
    type: 'pdf',
    typeLabel: 'Apostila PDF',
    postedAt: '2026-11-08',
    teacherName: 'Profa. Beatriz Souza',
    description: 'Dicas práticas para ganhar tempo na leitura dos textos longos do 1º dia do ENEM.',
    externalUrl: 'https://classroom.google.com/c/bonsucesso-turmac-portugues',
  },
  {
    id: 'mat-08',
    title: 'Urbanização Brasileira, Matrizes Energéticas e Questão Agrária',
    subjectName: 'Geografia',
    area: 'Ciências Humanas',
    type: 'pdf',
    typeLabel: 'Resumo PDF',
    postedAt: '2026-11-06',
    teacherName: 'Prof. Marcos Vinícius',
    description: 'Síntese dos gráficos e mapas mais cobrados em Ciências Humanas.',
    externalUrl: 'https://classroom.google.com/c/bonsucesso-esperanca-historia',
  },
];

export const STUDENT_WEEKLY_SCHEDULE: WeeklyScheduleSlot[] = [
  {
    id: 'wk-seg-1',
    dayOfWeek: 'Segunda',
    startTime: '19:00',
    endTime: '20:30',
    subjectName: 'Matemática',
    area: 'Matemática',
    teacherName: 'Prof. Carlos Eduardo Lima',
    roomLabel: 'Sala 01 — Térreo',
    syllabusTopics: [
      'Razão, proporção, escala e regra de três',
      'Porcentagem e matemática financeira básica',
      'Leitura e interpretação de tabelas e gráficos estatísticos',
    ],
    studyGuideNotes: 'Traga seu caderno de exercícios; resolvemos 5 questões reais do ENEM ao final de cada aula.',
    externalClassroomUrl: 'https://classroom.google.com/c/bonsucesso-esperanca-matematica',
    supportVideoUrl: 'https://www.youtube.com/results?search_query=matematica+basica+enem',
  },
  {
    id: 'wk-seg-2',
    dayOfWeek: 'Segunda',
    startTime: '20:45',
    endTime: '22:15',
    subjectName: 'Português',
    area: 'Linguagens',
    teacherName: 'Profa. Beatriz Souza',
    roomLabel: 'Sala 01 — Térreo',
    syllabusTopics: [
      'Gêneros textuais e estratégias argumentativas',
      'Funções da linguagem e figuras de estilo',
      'Patrimônio linguístico e variação sociocultural',
    ],
    studyGuideNotes: 'Foco em leitura dinâmica de charges, tirinhas e textos jornalísticos.',
    externalClassroomUrl: 'https://classroom.google.com/c/bonsucesso-turmac-portugues',
  },
  {
    id: 'wk-ter-1',
    dayOfWeek: 'Terça',
    startTime: '19:00',
    endTime: '20:30',
    subjectName: 'Redação',
    area: 'Redação',
    teacherName: 'Profa. Beatriz Souza',
    roomLabel: 'Sala 01 — Térreo',
    syllabusTopics: [
      'Estrutura dissertativo-argumentativa em 4 parágrafos',
      'Repertório sociocultural produtivo e legítimo',
      'Proposta de intervenção detalhada (Competência 5)',
    ],
    studyGuideNotes: 'Oficina prática: toda terça debatemos um tema atual e construímos o projeto de texto juntos.',
    externalClassroomUrl: 'https://classroom.google.com/c/bonsucesso-esperanca-redacao',
  },
  {
    id: 'wk-ter-2',
    dayOfWeek: 'Terça',
    startTime: '20:45',
    endTime: '22:15',
    subjectName: 'Química',
    area: 'Ciências da Natureza',
    teacherName: 'Profa. Nanda Moraes',
    roomLabel: 'Sala 01 — Térreo',
    syllabusTopics: [
      'Separação de misturas e tratamento da água',
      'Estequiometria básica e soluções',
      'Química ambiental: chuva ácida e efeito estufa',
    ],
    studyGuideNotes: 'O material impresso desta aula é entregue em sala. Link digital ainda não cadastrado pela professora.',
    // Intencionalmente sem externalClassroomUrl para demonstrar o tratamento acessível sem botão quebrado
  },
  {
    id: 'wk-qua-1',
    dayOfWeek: 'Quarta',
    startTime: '19:00',
    endTime: '20:30',
    subjectName: 'Matemática',
    area: 'Matemática',
    teacherName: 'Prof. Carlos Eduardo Lima',
    roomLabel: 'Sala 01 — Térreo',
    syllabusTopics: [
      'Funções do 1º e 2º grau',
      'Geometria plana (áreas e perímetros) e espacial (volumes)',
      'Média, moda, mediana e probabilidade básica',
    ],
    studyGuideNotes: 'Aula focada em geometria visual e resolução guiada.',
    externalClassroomUrl: 'https://classroom.google.com/c/bonsucesso-esperanca-matematica',
  },
  {
    id: 'wk-qua-2',
    dayOfWeek: 'Quarta',
    startTime: '20:45',
    endTime: '22:15',
    subjectName: 'Geografia',
    area: 'Ciências Humanas',
    teacherName: 'Prof. Marcos Vinícius Ferreira',
    roomLabel: 'Sala 01 — Térreo',
    syllabusTopics: [
      'Clima, relevo, domínios morfoclimáticos e recursos hídricos',
      'Dinâmica populacional, migrações e urbanização',
      'Geopolítica contemporânea e blocos econômicos',
    ],
    studyGuideNotes: 'Resumo cartográfico distribuído no início da aula (sem link externo cadastrado).',
  },
  {
    id: 'wk-qui-1',
    dayOfWeek: 'Quinta',
    startTime: '19:00',
    endTime: '20:30',
    subjectName: 'História',
    area: 'Ciências Humanas',
    teacherName: 'Prof. Marcos Vinícius Ferreira',
    roomLabel: 'Sala 01 — Térreo',
    syllabusTopics: [
      'Brasil Colônia, Império e movimentos sociais',
      'Era Vargas, Ditadura Civil-Militar e Redemocratização',
      'Cidadania, patrimônio cultural e memória histórica',
    ],
    studyGuideNotes: 'Debate aberto com conexão direta aos temas de Redação.',
    externalClassroomUrl: 'https://classroom.google.com/c/bonsucesso-esperanca-historia',
  },
  {
    id: 'wk-qui-2',
    dayOfWeek: 'Quinta',
    startTime: '20:45',
    endTime: '22:15',
    subjectName: 'Física',
    area: 'Ciências da Natureza',
    teacherName: 'Prof. Roberto Alves Nascimento',
    roomLabel: 'Sala 01 — Térreo',
    syllabusTopics: [
      'Cinemática, leis de Newton e conservação de energia',
      'Termologia, calorimetria e fenômenos ondulatórios',
      'Eletrodinâmica prática no cotidiano doméstico',
    ],
    studyGuideNotes: 'Foco conceitual nos fenômenos físicos antes da aplicação das fórmulas.',
    externalClassroomUrl: 'https://classroom.google.com/c/bonsucesso-turmac-fisica',
  },
  {
    id: 'wk-sex-1',
    dayOfWeek: 'Sexta',
    startTime: '19:00',
    endTime: '20:30',
    subjectName: 'Biologia',
    area: 'Ciências da Natureza',
    teacherName: 'Profa. Juliana Castro Mendes',
    roomLabel: 'Sala 01 — Térreo',
    syllabusTopics: [
      'Ecologia, cadeias alimentares e desequilíbrios ambientais',
      'Citologia, genética básica e biotecnologia',
      'Saúde pública, vacinas e principais endemias brasileiras',
    ],
    studyGuideNotes: 'Caderno de resumos disponível no Google Sala de Aula da turma.',
    externalClassroomUrl: 'https://classroom.google.com/c/bonsucesso-esperanca-biologia',
  },
  {
    id: 'wk-sex-2',
    dayOfWeek: 'Sexta',
    startTime: '20:45',
    endTime: '22:15',
    subjectName: 'Plantão de Dúvidas & Monitoria',
    area: 'Redação',
    teacherName: 'Equipe de Professores Voluntários',
    roomLabel: 'Sala 01 — Térreo',
    syllabusTopics: [
      'Atendimento individualizado para correção de redações',
      'Resolução assistida de listas de Matemática e Natureza',
    ],
    studyGuideNotes: 'Momento livre e acolhedor para tirar qualquer dúvida da semana sem pressa.',
  },
];

export const STUDENT_ANNOUNCEMENTS_FEED: StudentAnnouncement[] = [
  {
    id: 'ann-01',
    title: 'Orientações para o 4º Simulado Comunitário Geral (Modelo ENEM)',
    summary:
      'Nosso próximo simulado presencial será no sábado (28/11), das 13h às 18h30. Traga caneta esferográfica de tinta preta em material transparente e documento com foto. Teremos lanche reforçado na copa!',
    date: '2026-11-18',
    author: 'Ana Paula Ribeiro (Coordenação Pedagógica)',
    category: 'simulado',
    categoryLabel: 'Simulado ENEM',
    location: 'Todas as salas do Cursinho Bonsucesso',
    timeRange: '13h00 às 18h30',
    isNew: true,
  },
  {
    id: 'ann-02',
    title: 'Plantão Especial de Redação: Devolutivas Individuais nesta Sexta',
    summary:
      'A professora Beatriz estará na Sala 01 a partir das 18h15 (antes da aula normal) para conversar individualmente com quem quiser revisar a Competência 3 e a Competência 5.',
    date: '2026-11-17',
    author: 'Profa. Beatriz Souza (Redação)',
    category: 'comunicado',
    categoryLabel: 'Comunicado da Coordenação',
    location: 'Sala 01 — Térreo',
    timeRange: '18h15 às 19h00',
    isNew: true,
  },
  {
    id: 'ann-03',
    title: 'Aulão Integrado de Atualidades, Direitos Humanos e Repertório ENEM',
    summary:
      'Encontro aberto e dinâmico com os professores Marcos (História) e Beatriz (Redação) conectando fatos atuais do Brasil com possíveis eixos temáticos da prova.',
    date: '2026-11-21',
    author: 'Equipe Pedagógica Bonsucesso',
    category: 'aula_especial',
    categoryLabel: 'Aulão Especial',
    location: 'Auditório Comunitário Bonsucesso',
    timeRange: '09h00 às 12h30',
    isNew: false,
  },
  {
    id: 'ann-04',
    title: 'Feriado da Consciência Negra — Funcionamento e Roda Cultural',
    summary:
      'No dia 20/11 não haverá aula regular noturna, mas realizaremos às 15h uma roda de conversa voluntária sobre literatura afro-brasileira e questões comentadas do ENEM.',
    date: '2026-11-20',
    author: 'Coordenação Comunitária',
    category: 'feriado',
    categoryLabel: 'Feriado / Atividade Cultural',
    location: 'Pátio Comunitário',
    timeRange: '15h00 às 17h30',
    isNew: false,
  },
  {
    id: 'ann-05',
    title: 'Visita Pedagógica Guiada ao Campus da Universidade Pública',
    summary:
      'Vamos conhecer de perto os laboratórios, a biblioteca central e o restaurante universitário (bandejão) para você já se sentir em casa no ensino superior! Transporte gratuito saindo do cursinho.',
    date: '2026-12-05',
    author: 'Ana Paula Ribeiro (Coordenação Pedagógica)',
    category: 'visita_pedagogica',
    categoryLabel: 'Visita Pedagógica',
    location: 'Saída em frente ao Cursinho Bonsucesso',
    timeRange: '08h00 às 14h00',
    isNew: false,
  },
];

export const STUDENT_MONTHLY_ATTENDANCE_HISTORY: Record<
  string,
  Array<{ id: string; monthLabel: string; presentClasses: number; totalClasses: number; percentage: number }>
> = {
  'per-2026-2': [
    {
      id: 'm-ago',
      monthLabel: 'Agosto / 2026',
      presentClasses: 18,
      totalClasses: 20,
      percentage: 90,
    },
    {
      id: 'm-set',
      monthLabel: 'Setembro / 2026',
      presentClasses: 16,
      totalClasses: 20,
      percentage: 80,
    },
    {
      id: 'm-out',
      monthLabel: 'Outubro / 2026',
      presentClasses: 14,
      totalClasses: 20,
      percentage: 70,
    },
    {
      id: 'm-nov',
      monthLabel: 'Novembro / 2026 (Mês atual)',
      presentClasses: 9,
      totalClasses: 15,
      percentage: 60,
    },
  ],
  'per-2026-1': [
    {
      id: 'm-mar',
      monthLabel: 'Março / 2026',
      presentClasses: 19,
      totalClasses: 20,
      percentage: 95,
    },
    {
      id: 'm-abr',
      monthLabel: 'Abril / 2026',
      presentClasses: 18,
      totalClasses: 20,
      percentage: 90,
    },
    {
      id: 'm-mai',
      monthLabel: 'Maio / 2026',
      presentClasses: 17,
      totalClasses: 20,
      percentage: 85,
    },
    {
      id: 'm-jun',
      monthLabel: 'Junho / 2026',
      presentClasses: 18,
      totalClasses: 20,
      percentage: 90,
    },
  ],
};
