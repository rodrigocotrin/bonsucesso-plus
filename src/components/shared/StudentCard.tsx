import React from 'react';
import { AttendancePresence, Person } from '../../types';
import { getDisplayName } from '../../lib/person';
import {
  cn,
  evaluateAttendanceStatus,
  getInitials,
} from '../../utils/formatters';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';

export interface StudentCardProps {
  student: Person;
  enrollmentCode: string;
  accumulatedAttendancePercentage: number;
  selectedPresence?: AttendancePresence;
  justification?: string;
  onChangePresence: (presence: AttendancePresence) => void;
  onChangeJustification?: (justification: string) => void;
  isHighlightedAsMissing?: boolean;
  /** Avança o foco automaticamente para a linha do próximo aluno após atalho P / F / J */
  onAdvanceNext?: () => void;
  onMovePrev?: () => void;
}

/**
 * Opções de lançamento rápido em lote (Chamada do Professor).
 * IMPORTANTE (Contrato Seção 1): no estado Amarelo (Justificada), o texto é OBRIGATORIAMENTE #111111 (nunca branco).
 */
const PRESENCE_OPTIONS: Array<{
  value: AttendancePresence;
  shortCode: string;
  label: string;
  activeClass: string;
}> = [
  {
    value: 'presente',
    shortCode: 'P',
    label: 'Presente',
    activeClass: 'border-progress bg-progress text-white',
  },
  {
    value: 'falta',
    shortCode: 'F',
    label: 'Falta',
    activeClass: 'border-critical bg-critical text-white',
  },
  {
    value: 'justificada',
    shortCode: 'J',
    label: 'Justificada',
    activeClass: 'border-assess bg-assess text-[#111111]',
  },
];

/**
 * StudentCard — Alta densidade operacional para chamada rápida de 1 clique ou 100% por teclado (P / F / J).
 * Exibe exclusivamente `getDisplayName(student)` (prioridade total ao Nome Social).
 */
export const StudentCard = React.forwardRef<HTMLDivElement, StudentCardProps>(
  (
    {
      student,
      enrollmentCode,
      accumulatedAttendancePercentage,
      selectedPresence,
      justification = '',
      onChangePresence,
      onChangeJustification,
      isHighlightedAsMissing = false,
      onAdvanceNext,
      onMovePrev,
    },
    ref
  ) => {
    const displayName = getDisplayName(student);
    const attendanceEval = evaluateAttendanceStatus(accumulatedAttendancePercentage);
    const isLowAttendance = attendanceEval.status === 'critical';

    const handleRowKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      const targetTag = (event.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === 'p') {
        event.preventDefault();
        onChangePresence('presente');
        onAdvanceNext?.();
      } else if (key === 'f') {
        event.preventDefault();
        onChangePresence('falta');
        onAdvanceNext?.();
      } else if (key === 'j') {
        event.preventDefault();
        onChangePresence('justificada');
        onAdvanceNext?.();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        onAdvanceNext?.();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        onMovePrev?.();
      }
    };

    return (
      <div
        ref={ref}
        tabIndex={0}
        onKeyDown={handleRowKeyDown}
        aria-label={`${displayName}, matrícula ${enrollmentCode}. Use as teclas P para Presente, F para Falta ou J para Justificada.`}
        className={cn(
          'rounded-lg border p-4 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
          isHighlightedAsMissing
            ? 'border-critical bg-critical-bg'
            : 'border-line bg-surface hover:border-ink/40'
        )}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Identificação + Matrícula Tabular (Prioridade estrita ao Nome Social) */}
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={cn(
                'num flex h-10 w-10 shrink-0 items-center justify-center rounded border text-xs font-semibold',
                isLowAttendance
                  ? 'border-critical-border bg-critical-bg text-critical'
                  : 'border-line bg-paper text-ink'
              )}
              aria-hidden="true"
            >
              {getInitials(displayName)}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-semibold text-ink">{displayName}</h3>
                {isLowAttendance && <Badge variant="critical">&lt; 75% frequência</Badge>}
                {isHighlightedAsMissing && <Badge variant="critical">Marcar presença</Badge>}
              </div>

              <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                <span>
                  Matrícula: <strong className="num text-ink">{enrollmentCode}</strong>
                </span>
                <span>•</span>
                <span>
                  Assiduidade: <strong className="num text-ink">{accumulatedAttendancePercentage}%</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Toggle P / F / J de 1 clique (Lei de Fitts: h-11 mobile / h-10 desktop) */}
          <div
            role="group"
            aria-label={`Frequência de ${displayName}`}
            className="grid shrink-0 grid-cols-3 gap-2 sm:flex sm:items-center"
          >
            {PRESENCE_OPTIONS.map((opt) => {
              const isSelected = selectedPresence === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChangePresence(opt.value)}
                  aria-pressed={isSelected}
                  title={`Marcar ${opt.label} (Atalho: ${opt.shortCode})`}
                  className={cn(
                    'inline-flex h-11 sm:h-10 items-center justify-center gap-2 rounded border px-3 text-xs font-semibold transition-all duration-[120ms] ease-out active:scale-95',
                    isSelected
                      ? opt.activeClass
                      : 'border-line bg-surface text-ink hover:bg-subtle'
                  )}
                >
                  <span className="num font-bold">{opt.shortCode}</span>
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedPresence === 'justificada' && onChangeJustification && (
          <div className="mt-3 border-t border-line pt-3">
            <Input
              label={`Justificativa de ${displayName.split(' ')[0]}`}
              optionalText="Opcional"
              value={justification}
              onChange={(e) => onChangeJustification(e.target.value)}
              placeholder="Ex.: Atestado médico, atraso na linha de ônibus, escala de trabalho..."
            />
          </div>
        )}
      </div>
    );
  }
);

StudentCard.displayName = 'StudentCard';
