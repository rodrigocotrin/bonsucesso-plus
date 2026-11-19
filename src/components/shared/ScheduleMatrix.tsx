import React, { useMemo, useState } from 'react';
import { Clock, User } from 'lucide-react';
import { Badge, CalloutAlert } from '../ui';
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
 * Matriz Semanal de Grade Horária (Dias da Semana × Turnos).
 * - Mobile (< 768px): Seletor de dia da semana (Seg | Ter | Qua | Qui | Sex | Sáb) + lista vertical do dia.
 * - Desktop (>= 768px): Matriz tabular completa com detecção de conflitos em Vermelho.
 */
export const ScheduleMatrix: React.FC<ScheduleMatrixProps> = ({
  entries,
  onEntryClick,
}) => {
  const [selectedMobileDay, setSelectedMobileDay] = useState<MatrixDayOfWeek>('Seg');

  const { conflicts, conflictingEntryIds } = useMemo(
    () => detectScheduleConflicts(entries),
    [entries]
  );

  const getCellEntries = (day: MatrixDayOfWeek, shift: MatrixShiftSlot) =>
    entries
      .filter((e) => e.dayOfWeek === day && e.shiftSlot === shift)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const mobileDayMeta = MATRIX_DAYS.find((d) => d.key === selectedMobileDay) ?? MATRIX_DAYS[0];
  const mobileDayEntries = useMemo(
    () =>
      entries
        .filter((e) => e.dayOfWeek === selectedMobileDay)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [entries, selectedMobileDay]
  );

  return (
    <div className="min-w-0 w-full max-w-full space-y-4">
      {conflicts.length > 0 && (
        <CalloutAlert
          variant="error"
          title={`Choque de horário detectado (${conflicts.length} ${
            conflicts.length === 1 ? 'ocorrência' : 'ocorrências'
          })`}
        >
          <ul className="mt-1 list-inside list-disc space-y-1 break-words text-xs font-medium text-ink">
            {conflicts.map((conflict) => (
              <li key={conflict.id}>{conflict.description}</li>
            ))}
          </ul>
        </CalloutAlert>
      )}

      {/* =====================================================================
          VISÃO MOBILE (< 768px): Seletor Seg–Sáb + Lista Vertical do Dia
         ===================================================================== */}
      <div className="space-y-3 md:hidden">
        <div
          role="tablist"
          aria-label="Selecionar dia da semana"
          className="grid grid-cols-6 gap-1 rounded-md bg-track p-1"
        >
          {MATRIX_DAYS.map((day) => {
            const isSelected = selectedMobileDay === day.key;
            const dayCount = entries.filter((e) => e.dayOfWeek === day.key).length;
            const dayHasConflict = entries.some(
              (e) => e.dayOfWeek === day.key && conflictingEntryIds.has(e.id)
            );

            return (
              <button
                key={day.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedMobileDay(day.key)}
                className={cn(
                  'relative flex h-10 flex-col items-center justify-center rounded text-xs transition-colors duration-150',
                  isSelected
                    ? 'bg-surface font-semibold text-ink shadow-xs'
                    : 'font-medium text-ink-muted hover:text-ink'
                )}
              >
                <span>{day.key}</span>
                {dayHasConflict ? (
                  <span
                    className="mt-0.5 h-1.5 w-1.5 rounded-full bg-critical"
                    aria-hidden="true"
                  />
                ) : dayCount > 0 ? (
                  <span
                    className="mt-0.5 h-1 w-1 rounded-full bg-academic"
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="rounded-lg border border-line bg-surface p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-line pb-2.5">
            <h3 className="text-sm font-semibold text-ink">
              {mobileDayMeta.fullLabel}
            </h3>
            <span className="num text-xs text-ink-muted">
              {mobileDayEntries.length}{' '}
              {mobileDayEntries.length === 1 ? 'aula' : 'aulas'}
            </span>
          </div>

          {mobileDayEntries.length > 0 ? (
            <div className="space-y-2.5">
              {mobileDayEntries.map((entry) => {
                const isConflict = conflictingEntryIds.has(entry.id);
                return (
                  <div
                    key={entry.id}
                    onClick={onEntryClick ? () => onEntryClick(entry) : undefined}
                    className={cn(
                      'rounded-md border p-3 transition-colors',
                      onEntryClick && 'cursor-pointer',
                      isConflict
                        ? 'border-critical bg-critical-bg text-ink'
                        : 'border-line bg-paper hover:border-ink'
                    )}
                  >
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                      <span className="num inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-academic" aria-hidden="true" />
                        <span>
                          {entry.startTime}–{entry.endTime}
                        </span>
                        <span className="font-sans font-normal text-ink-muted">
                          ({entry.shiftSlot})
                        </span>
                      </span>

                      {isConflict && <Badge variant="critical">Choque</Badge>}
                    </div>

                    <p className="break-words text-sm font-semibold text-ink">
                      {entry.subjectName}
                    </p>

                    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-academic">
                        {entry.classRoomName}
                      </span>
                      <span className="inline-flex items-center gap-1 text-ink-muted">
                        <User className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span>{entry.teacherName}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-6 text-center text-xs text-ink-muted">
              Nenhuma aula alocada para {mobileDayMeta.fullLabel.toLowerCase()}.
            </p>
          )}
        </div>
      </div>

      {/* =====================================================================
          VISÃO DESKTOP (>= 768px): Matriz Tabular Completa
         ===================================================================== */}
      <div className="hidden md:block w-full max-w-full overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[820px] border-collapse text-left text-sm">
          <thead>
            <tr className="h-10 border-b border-ink bg-paper">
              <th
                scope="col"
                className="w-36 border-r border-line px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink-muted"
              >
                Turno / Horário
              </th>
              {MATRIX_DAYS.map((day) => (
                <th
                  key={day.key}
                  scope="col"
                  className="border-r border-line px-3 py-2 text-left last:border-r-0"
                >
                  <span className="block text-xs font-semibold uppercase tracking-wider text-ink">
                    {day.key}
                  </span>
                  <span className="block text-xs font-normal text-ink-muted">
                    {day.fullLabel}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-line">
            {MATRIX_SHIFTS.map((shift) => (
              <tr key={shift.key} className="align-top">
                <th
                  scope="row"
                  className="border-r border-line bg-paper px-4 py-3 text-left font-semibold text-ink"
                >
                  <span className="block text-sm">{shift.key}</span>
                  <span className="num mt-0.5 block text-xs font-normal text-ink-muted">
                    {shift.timeRangeHint}
                  </span>
                </th>

                {MATRIX_DAYS.map((day) => {
                  const cellEntries = getCellEntries(day.key, shift.key);
                  const cellHasConflict = cellEntries.some((e) =>
                    conflictingEntryIds.has(e.id)
                  );

                  return (
                    <td
                      key={`${shift.key}-${day.key}`}
                      className={cn(
                        'border-r border-line p-2 last:border-r-0',
                        cellHasConflict ? 'bg-critical-bg/50' : 'bg-surface'
                      )}
                    >
                      {cellEntries.length > 0 ? (
                        <div className="space-y-2">
                          {cellEntries.map((entry) => {
                            const isConflict = conflictingEntryIds.has(entry.id);
                            return (
                              <div
                                key={entry.id}
                                onClick={onEntryClick ? () => onEntryClick(entry) : undefined}
                                className={cn(
                                  'rounded border p-2.5 transition-colors',
                                  onEntryClick && 'cursor-pointer',
                                  isConflict
                                    ? 'border-critical bg-critical-bg text-ink'
                                    : 'border-line bg-paper hover:border-ink'
                                )}
                              >
                                <div className="mb-1 flex flex-wrap items-center justify-between gap-1">
                                  <span className="num inline-flex items-center gap-1 text-xs font-medium text-ink">
                                    <Clock className="h-3 w-3 shrink-0 text-academic" aria-hidden="true" />
                                    <span>
                                      {entry.startTime}–{entry.endTime}
                                    </span>
                                  </span>

                                  {isConflict && <Badge variant="critical">Choque</Badge>}
                                </div>

                                <p className="text-sm font-semibold leading-tight text-ink">
                                  {entry.subjectName}
                                </p>

                                <p className="mt-1 truncate text-xs font-medium text-academic">
                                  {entry.classRoomName}
                                </p>

                                <p className="mt-1 flex items-center gap-1 truncate text-xs text-ink-muted">
                                  <User className="h-3 w-3 shrink-0" aria-hidden="true" />
                                  <span className="truncate">{entry.teacherName}</span>
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex h-16 items-center justify-center rounded border border-dashed border-line text-xs text-ink-muted">
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
