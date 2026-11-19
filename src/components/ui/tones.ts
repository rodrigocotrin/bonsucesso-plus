/**
 * Mapa central de Tons Semânticos do Bonsucesso+ (Regra 90/10).
 * Fonte única de verdade para as cores funcionais usadas nos componentes.
 *
 * - academic (Azul): Aulas, Turmas, Disciplinas, Google Classroom
 * - progress (Verde): Frequência, Matrículas ativas, metas atingidas
 * - assess (Amarelo): Notas, Simulados ENEM, Calendário, alertas preventivos
 * - critical (Vermelho): Faltas excessivas, choques de horário, trancamentos, inativação
 */
export type SemanticTone = 'neutral' | 'ink' | 'academic' | 'progress' | 'assess' | 'critical';

/** Variantes legadas aceitas pelos componentes antigos (compatibilidade) */
export type LegacyVariant = 'neutral' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

export type ToneInput = SemanticTone | LegacyVariant;

const LEGACY_TO_TONE: Record<LegacyVariant, SemanticTone> = {
  neutral: 'neutral',
  primary: 'ink',
  secondary: 'academic',
  success: 'progress',
  warning: 'assess',
  danger: 'critical',
};

export function resolveTone(input: ToneInput | undefined, fallback: SemanticTone = 'neutral'): SemanticTone {
  if (!input) return fallback;
  if (input in LEGACY_TO_TONE) return LEGACY_TO_TONE[input as LegacyVariant];
  return input as SemanticTone;
}

/** Quadrado sólido de 8px (badge, legenda, acento) */
export const TONE_DOT: Record<SemanticTone, string> = {
  neutral: 'bg-ink-muted',
  ink: 'bg-ink',
  academic: 'bg-academic',
  progress: 'bg-progress',
  assess: 'bg-assess',
  critical: 'bg-critical',
};

/** Cor de texto/ícone sobre superfície clara (amarelo usa tinta marrom por contraste) */
export const TONE_TEXT: Record<SemanticTone, string> = {
  neutral: 'text-ink-muted',
  ink: 'text-ink',
  academic: 'text-academic',
  progress: 'text-progress',
  assess: 'text-assess-ink',
  critical: 'text-critical',
};

/** Superfície suave (fundo + borda) para callouts e destaques */
export const TONE_SOFT: Record<SemanticTone, string> = {
  neutral: 'bg-subtle border-line',
  ink: 'bg-subtle border-line',
  academic: 'bg-academic-bg border-academic-border',
  progress: 'bg-progress-bg border-progress-border',
  assess: 'bg-assess-bg border-assess-border',
  critical: 'bg-critical-bg border-critical-border',
};

/** Preenchimento sólido (barras de progresso, toggles ativos) */
export const TONE_FILL: Record<SemanticTone, string> = {
  neutral: 'bg-ink-muted',
  ink: 'bg-ink',
  academic: 'bg-academic',
  progress: 'bg-progress',
  assess: 'bg-assess',
  critical: 'bg-critical',
};

/** Borda sólida na cor semântica */
export const TONE_BORDER: Record<SemanticTone, string> = {
  neutral: 'border-line',
  ink: 'border-ink',
  academic: 'border-academic',
  progress: 'border-progress',
  assess: 'border-assess',
  critical: 'border-critical',
};
