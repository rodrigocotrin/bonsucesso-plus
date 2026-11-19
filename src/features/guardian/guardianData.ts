export interface GuardianNoticeItem {
  id: string;
  title: string;
  plainExplanation: string;
  date: string;
  timeRange?: string;
  location?: string;
  category: 'reuniao_familia' | 'simulado_presencial' | 'comunicado_turma' | 'feriado';
  categoryLabel: string;
  targetClassRoomId: string | 'all';
  isHighlighted?: boolean;
}

export interface GuardianSimulatedMonthAttendance {
  monthKey: '2026-11' | '2026-10' | '2026-09' | 'all';
  monthLabel: string;
}

export const GUARDIAN_MONTH_FILTERS: GuardianSimulatedMonthAttendance[] = [
  { monthKey: 'all', monthLabel: 'Todo o 2º Semestre de 2026' },
  { monthKey: '2026-11', monthLabel: 'Novembro de 2026 (Mês Atual)' },
  { monthKey: '2026-10', monthLabel: 'Outubro de 2026' },
  { monthKey: '2026-09', monthLabel: 'Setembro de 2026' },
];

export const GUARDIAN_NOTICES_AND_MEETINGS: GuardianNoticeItem[] = [
  {
    id: 'g-not-01',
    title: 'Roda de Conversa com Pais, Mães e Responsáveis',
    plainExplanation:
      'Um encontro presencial e acolhedor com a coordenadora Ana Paula para conversarmos sobre como apoiar a tranquilidade dos jovens nesta reta final para a prova do ENEM. Serviremos café e bolo na copa.',
    date: '2026-11-25',
    timeRange: '19h00 às 20h30',
    location: 'Sala 01 — Térreo do Cursinho Bonsucesso',
    category: 'reuniao_familia',
    categoryLabel: 'Encontro com as Famílias',
    targetClassRoomId: 'all',
    isHighlighted: true,
  },
  {
    id: 'g-not-02',
    title: '4º Simulado Presencial do ENEM neste Sábado',
    plainExplanation:
      'Seu filho(a) fará uma prova de treino igual ao dia oficial do ENEM. É muito importante incentivar que ele(a) durma bem na sexta-feira e leve documento com foto e caneta preta de tubo transparente.',
    date: '2026-11-28',
    timeRange: '13h00 às 18h30',
    location: 'Todas as salas do Cursinho Comunitário Bonsucesso',
    category: 'simulado_presencial',
    categoryLabel: 'Simulado Presencial de Sábado',
    targetClassRoomId: 'all',
    isHighlighted: true,
  },
  {
    id: 'g-not-03',
    title: 'Feriado da Consciência Negra — Sem Aula Noturna Regular',
    plainExplanation:
      'Na sexta-feira (20/11) não teremos aula normal à noite. À tarde (das 15h às 17h30) haverá uma roda cultural opcional no pátio do cursinho.',
    date: '2026-11-20',
    timeRange: '15h00 às 17h30 (Atividade Cultural Opcional)',
    location: 'Pátio Comunitário',
    category: 'feriado',
    categoryLabel: 'Aviso de Feriado',
    targetClassRoomId: 'all',
  },
  {
    id: 'g-not-04',
    title: 'Plantão de Apoio em Matemática e Redação antes da aula',
    plainExplanation:
      'Os professores voluntários estão chegando 45 minutos mais cedo (às 18h15) para tirar dúvidas individuais de alunos que trabalham ou faltaram a alguma aula.',
    date: '2026-11-18',
    timeRange: '18h15 às 19h00',
    location: 'Sala 01 (Turma Esperança) e Sala 02 (Turma A)',
    category: 'comunicado_turma',
    categoryLabel: 'Apoio para a Turma',
    targetClassRoomId: 'all',
  },
  {
    id: 'g-not-05',
    title: 'Visita Guiada Gratuita à Universidade Pública',
    plainExplanation:
      'Levaremos os estudantes em ônibus gratuito para conhecerem o campus da universidade pública, a biblioteca e o refeitório estudantil.',
    date: '2026-12-05',
    timeRange: '08h00 às 14h00',
    location: 'Saída na porta do Cursinho Bonsucesso',
    category: 'comunicado_turma',
    categoryLabel: 'Passeio Pedagógico',
    targetClassRoomId: 'all',
  },
];

export const COORDINATION_SUPPORT_CONTACT = {
  coordinatorName: 'Ana Paula Ribeiro (Coordenadora Pedagógica)',
  phoneAndWhatsapp: '(21) 99811-2233',
  landlineSecretariat: '(21) 3104-5500',
  email: 'coordenacao@bonsucesso.org.br',
  inPersonHours: 'Segunda a Sexta, das 18h00 às 21h30, e Sábados das 08h30 às 13h00',
  address: 'Rua da Comunidade, nº 140 — Bonsucesso (Térreo acessível, próximo à praça)',
};
