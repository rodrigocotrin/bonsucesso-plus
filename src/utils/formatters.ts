import { Attendance, AttendanceStatus, Grade, Person, UserRole } from '../types';

/**
 * Limiar oficial de frequência do cursinho comunitário (75%)
 */
export const MINIMUM_ATTENDANCE_THRESHOLD = 75;
export const WARNING_ATTENDANCE_THRESHOLD = 80;

/**
 * Calcula a porcentagem de presença de um aluno a partir de uma lista de registros de chamada.
 * Faltas justificadas ('justificada') contam como presença abonada para fins de acompanhamento pedagógico.
 */
export function calculateAttendancePercentage(attendances: Attendance[]): number {
  if (attendances.length === 0) return 100;
  const attendedCount = attendances.filter(
    (a) => a.presence === 'presente' || a.presence === 'justificada'
  ).length;
  return Math.round((attendedCount / attendances.length) * 100);
}

/**
 * Calcula a média simples do ENEM (escala 0 a 1000) a partir de uma lista de notas.
 */
export function calculateSimpleEnemAverage(grades: Grade[]): number {
  if (grades.length === 0) return 0;
  const sum = grades.reduce((acc, g) => acc + g.score, 0);
  return Math.round(sum / grades.length);
}

/**
 * Calcula a média das 5 áreas do ENEM de uma nota individual.
 */
export function calculateFiveAreasAverage(areaScores: NonNullable<Grade['areaScores']>): number {
  const { linguagens, matematica, natureza, humanas, redacao } = areaScores;
  return Math.round((linguagens + matematica + natureza + humanas + redacao) / 5);
}

/**
 * Retorna o nome de exibição preferencial de uma Person (respeitando Nome Social quando informado).
 */
export function getDisplayName(person?: Person | null): string {
  if (!person) return 'Usuário';
  return person.socialName && person.socialName.trim().length > 0
    ? person.socialName
    : person.fullName;
}

/**
 * Normaliza CPF ou e-mail para comparação no login.
 */
export function normalizeIdentifier(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  // Remove pontuação caso seja CPF
  return trimmed.replace(/\D/g, '');
}

/**
 * Retorna a rota inicial padrão de acordo com o perfil do usuário (RBAC).
 */
export function getDefaultRouteForRole(role: UserRole): string {
  switch (role) {
    case 'coordinator':
      return '/coordenacao';
    case 'teacher':
      return '/professor';
    case 'student':
      return '/aluno';
    case 'guardian':
      return '/responsavel';
  }
}

/**
 * Rótulo amigável em português para cada perfil.
 */
export function getRoleDisplayLabel(role: UserRole): string {
  switch (role) {
    case 'coordinator':
      return 'Coordenação Pedagógica';
    case 'teacher':
      return 'Professor(a) Voluntário(a)';
    case 'student':
      return 'Estudante';
    case 'guardian':
      return 'Mãe / Pai / Responsável';
  }
}

/**
 * Calcula e classifica a situação de presença do estudante sem depender apenas de cor.
 * Retorna rótulo amigável em português cotidiano.
 */
export function evaluateAttendanceStatus(percentage: number): {
  status: AttendanceStatus;
  label: string;
  description: string;
} {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));

  if (clamped < MINIMUM_ATTENDANCE_THRESHOLD) {
    return {
      status: 'critical',
      label: 'Atenção: Abaixo de 75%',
      description: `Presença atual em ${clamped}%. Converse com a coordenação para apoiar sua rotina de estudos.`,
    };
  }

  if (clamped < WARNING_ATTENDANCE_THRESHOLD) {
    return {
      status: 'attention',
      label: 'Próximo ao limite (75%)',
      description: `Presença atual em ${clamped}%. Evite faltas nas próximas aulas para manter a regularidade.`,
    };
  }

  return {
    status: 'regular',
    label: 'Presença em dia',
    description: `Excelente participação (${clamped}% de presença nas aulas).`,
  };
}

/**
 * Formata uma nota na escala ENEM (0 a 1000 pontos) de forma clara.
 */
export function formatEnemScore(score: number): string {
  const rounded = Math.round(score);
  return `${rounded} pts`;
}

/**
 * Formata porcentagem para exibição amigável.
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Formata data ISO YYYY-MM-DD para padrão brasileiro DD/MM/YYYY.
 */
export function formatDateBR(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Combina classes CSS condicional de maneira limpa (similar ao clsx).
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
