import React, { useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  User,
} from 'lucide-react';
import {
  Badge,
  CalloutAlert,
} from '../ui';
import {
  detectScheduleConflicts,
  MATRIX_DAYS,
  MATRIX_SHIFTS,
  MatrixDayOfWeek,
  MatrixShiftSlot,
  ScheduleMatrixEntry,
} from '../../utils/scheduleConflicts';
import { cn } from '../../utils/formatters';

export interface ScheduleMatrixProps {
  entries: ScheduleMatrixEntry[];
  onEntryClick?: (entry: ScheduleMatrixEntry) => void;
}

/**
 * Componente Reutilizável ScheduleMatrix (src/components/shared/ScheduleMatrix.tsx)
 * - Matriz semanal responsiva cruzando Dias da Semana (Seg a Sáb) x Turnos (Manhã, Tarde, Noite).
 * - Consome a função pura detectScheduleConflicts (src/utils/scheduleConflicts.ts).
 * - Se houver conflito de horário (mesmo professor ou mesma turma sobrepostos), exibe CalloutAlert
 *   no topo e destaca visualmente as células conflitantes com Badge de alerta.
 */
export const ScheduleMatrix: React.FC<ScheduleMatrixProps> = ({
  entries,
  onEntryClick,
}) => {
  const { conflicts, conflictingEntryIds } = useMemo(
    () => detectScheduleConflicts(entries),
    [entries]
  );

  const getCellEntries = (day: MatrixDayOfWeek, shift: MatrixShiftSlot) => {
    return entries
      .filter((e) => e.dayOfWeek === day && e.shiftSlot === shift)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  return (
    <div className="space-y-5">
      {/* CalloutAlert Automático no Topo quando há Conflitos de Horário */}
      {conflicts.length > 0 && (
        <CalloutAlert
          variant="error"
          title={`Atenção: Detectamos ${conflicts.length} ${
            conflicts.length === 1
              ? 'conflito de horário na grade'
              : 'conflitos de horário na grade'
          }!`}
        >
          <p className="mb-2">
            Verifique as aulas destacadas em vermelho abaixo para corrigir sobreposições de
            professor ou de turma:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm font-semibold">
            {conflicts.map((conflict) => (
              <li key={conflict.id}>{conflict.description}</li>
            ))}
          </ul>
        </CalloutAlert>
      )}

      {/* Matriz Responsiva: Dias da Semana (Seg a Sáb) x Turnos (Manhã, Tarde, Noite) */}
      <div className="overflow-x-auto rounded-2xl border-2 border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100 text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white">
              <th
                scope="col"
                className="w-36 border-r border-slate-200 px-4 py-3.5 font-extrabold dark:border-slate-700"
              >
                Turno / Horário
              </th>
              {MATRIX_DAYS.map((day) => (
                <th
                  key={day.key}
                  scope="col"
                  className="border-r border-slate-200 px-3 py-3.5 text-center font-extrabold last:border-r-0 dark:border-slate-700"
                >
                  <span className="block text-base">{day.key}</span>
                  <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                    {day.fullLabel}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y-2 divide-slate-200 dark:divide-slate-800">
            {MATRIX_SHIFTS.map((shift) => (
              <tr key={shift.key} className="align-top">
                {/* Coluna do Turno */}
                <th
                  scope="row"
                  className="border-r border-slate-200 bg-slate-50/90 px-4 py-4 font-extrabold text-slate-900 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white"
                >
                  <span className="block text-base">{shift.key}</span>
                  <span className="mt-0.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                    {shift.timeRangeHint}
                  </span>
                </th>

                {/* Células para cada Dia da Semana */}
                {MATRIX_DAYS.map((day) => {
                  const cellEntries = getCellEntries(day.key, shift.key);
                  const cellHasConflict = cellEntries.some((e) =>
                    conflictingEntryIds.has(e.id)
                  );

                  return (
                    <td
                      key={`${shift.key}-${day.key}`}
                      className={cn(
                        'border-r border-slate-200 p-2.5 last:border-r-0 dark:border-slate-800 transition-colors',
                        cellHasConflict
                          ? 'bg-danger-50/70 dark:bg-danger-950/30'
                          : 'bg-white dark:bg-slate-900'
                      )}
                    >
                      {cellEntries.length > 0 ? (
                        <div className="space-y-2.5">
                          {cellEntries.map((entry) => {
                            const isConflict = conflictingEntryIds.has(entry.id);
                            return (
                              <div
                                key={entry.id}
                                onClick={() => onEntryClick?.(entry)}
                                className={cn(
                                  'rounded-xl border-2 p-2.5 transition-all',
                                  onEntryClick && 'cursor-pointer hover:shadow-md',
                                  isConflict
                                    ? 'border-danger-600 bg-white ring-2 ring-danger-500/40 dark:border-red-500 dark:bg-slate-900'
                                    : 'border-slate-200 bg-slate-50/90 hover:border-primary-600 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-primary-400'
                                )}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-primary-900 dark:text-primary-300">
                                    <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                                    <span>
                                      {entry.startTime}-{entry.endTime}
                                    </span>
                                  </span>

                                  {isConflict && (
                                    <Badge
                                      variant="danger"
                                      icon={<AlertTriangle className="h-3 w-3" />}
                                      className="px-2 py-0.5 text-[11px]"
                                    >
                                      Conflito!
                                    </Badge>
                                  )}
                                </div>

                                <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                                  {entry.subjectName}
                                </p>

                                <p className="mt-1 text-xs font-bold text-secondary-800 dark:text-secondary-300 truncate">
                                  {entry.classRoomName}
                                </p>

                                <p className="mt-1 flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 truncate">
                                  <User className="h-3 w-3 shrink-0" aria-hidden="true" />
                                  <span className="truncate">{entry.teacherName}</span>
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-600">
                          Livre
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
