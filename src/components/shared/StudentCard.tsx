import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  XCircle,
} from 'lucide-react';
import { Badge, Input } from '../ui';
import { AttendancePresence, Person } from '../../types';
import {
  cn,
  evaluateAttendanceStatus,
  getDisplayName,
  getInitials,
} from '../../utils/formatters';

export interface StudentCardProps {
  student: Person;
  enrollmentCode: string;
  accumulatedAttendancePercentage: number;
  selectedPresence?: AttendancePresence;
  justification?: string;
  onChangePresence: (presence: AttendancePresence) => void;
  onChangeJustification?: (justification: string) => void;
  isHighlightedAsMissing?: boolean;
}

const PRESENCE_OPTIONS: Array<{
  value: AttendancePresence;
  label: string;
  activeClass: string;
  icon: React.ReactNode;
}> = [
  {
    value: 'presente',
    label: 'Presente',
    activeClass:
      'border-emerald-700 bg-emerald-700 text-white shadow-xs dark:border-emerald-500 dark:bg-emerald-600',
    icon: <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />,
  },
  {
    value: 'falta',
    label: 'Falta',
    activeClass:
      'border-danger-700 bg-danger-700 text-white shadow-xs dark:border-danger-500 dark:bg-danger-600',
    icon: <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />,
  },
  {
    value: 'justificada',
    label: 'Justificada',
    activeClass:
      'border-amber-700 bg-amber-700 text-white shadow-xs dark:border-amber-500 dark:bg-amber-600',
    icon: <FileCheck className="h-4 w-4 shrink-0" aria-hidden="true" />,
  },
];

/**
 * Componente Reutilizável StudentCard (src/components/shared/StudentCard.tsx)
 * - Exibe avatar com iniciais, nome de exibição (respeitando Nome Social), código de matrícula
 * - Sinaliza claramente caso a frequência acumulada esteja abaixo de 75%
 * - Controles amplos (>= 44x44px) para chamada rápida pelo celular ou desktop: Presente / Falta / Justificada
 * - Destaca visualmente caso o professor tente salvar a chamada sem marcar o aluno (Prevenção de Erros)
 */
export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  enrollmentCode,
  accumulatedAttendancePercentage,
  selectedPresence,
  justification = '',
  onChangePresence,
  onChangeJustification,
  isHighlightedAsMissing = false,
}) => {
  const displayName = getDisplayName(student);
  const hasSocialName = Boolean(
    student.socialName && student.socialName.trim().length > 0
  );
  const attendanceEval = evaluateAttendanceStatus(accumulatedAttendancePercentage);
  const isLowAttendance = attendanceEval.status === 'critical';

  return (
    <div
      className={cn(
        'rounded-2xl border-2 p-4 transition-all',
        isHighlightedAsMissing
          ? 'border-danger-600 bg-danger-50/70 ring-2 ring-danger-500/40 dark:border-red-500 dark:bg-danger-950/30'
          : selectedPresence
          ? 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
          : 'border-slate-300 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/60'
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Identificação do Estudante */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-extrabold',
              isLowAttendance
                ? 'bg-danger-100 text-danger-900 dark:bg-danger-950 dark:text-red-200'
                : 'bg-primary-100 text-primary-900 dark:bg-primary-950 dark:text-primary-200'
            )}
            aria-hidden="true"
          >
            {getInitials(displayName)}
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                {displayName}
              </h3>

              {hasSocialName && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  (Reg. civil: {student.fullName})
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                Matrícula: {enrollmentCode}
              </span>
              <span>•</span>
              <span>
                Frequência acumulada: <strong>{accumulatedAttendancePercentage}%</strong>
              </span>

              {isLowAttendance && (
                <Badge
                  variant="danger"
                  icon={<AlertTriangle className="h-3.5 w-3.5" />}
                >
                  Abaixo de 75%
                </Badge>
              )}

              {isHighlightedAsMissing && (
                <Badge variant="danger">Pendente de marcação!</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Controles Grandes de Status para Chamada (Presente / Falta / Justificada) */}
        <div
          role="group"
          aria-label={`Marcar presença de ${displayName}`}
          className="grid grid-cols-3 gap-2 sm:flex sm:items-center shrink-0"
        >
          {PRESENCE_OPTIONS.map((opt) => {
            const isSelected = selectedPresence === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChangePresence(opt.value)}
                aria-pressed={isSelected}
                className={cn(
                  'min-h-[46px] inline-flex items-center justify-center gap-1.5 rounded-xl border-2 px-3 sm:px-4 py-2 text-sm font-extrabold transition-all',
                  isSelected
                    ? opt.activeClass
                    : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'
                )}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Campo adicional de observação quando marcada como "Justificada" */}
      {selectedPresence === 'justificada' && onChangeJustification && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Input
            label={`Motivo da falta justificada de ${displayName.split(' ')[0]}`}
            optionalText="Opcional"
            value={justification}
            onChange={(e) => onChangeJustification(e.target.value)}
            placeholder="Ex: Atestado médico, atraso no ônibus ou turno extra no trabalho..."
          />
        </div>
      )}
    </div>
  );
};
