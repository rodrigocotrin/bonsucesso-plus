/**
 * Lógica pura de estruturação da Grade Horária e Detecção Automática de Conflitos (SRP)
 * Separada completamente da camada de apresentação React.
 */

export type MatrixDayOfWeek = 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sáb';
export type MatrixShiftSlot = 'Manhã' | 'Tarde' | 'Noite';

export interface ScheduleMatrixEntry {
  id: string;
  dayOfWeek: MatrixDayOfWeek;
  shiftSlot: MatrixShiftSlot;
  dateIso: string;
  startTime: string;
  endTime: string;
  subjectId: string;
  subjectName: string;
  classRoomId: string;
  classRoomName: string;
  teacherPersonId: string;
  teacherName: string;
  topic: string;
  status: 'agendada' | 'ministrada' | 'cancelada';
}

export interface ScheduleConflictRecord {
  id: string;
  type: 'teacher_overlap' | 'classroom_overlap';
  dayOfWeek: MatrixDayOfWeek;
  shiftSlot: MatrixShiftSlot;
  timeOverlapLabel: string;
  description: string;
  involvedEntryIds: [string, string];
}

export const MATRIX_DAYS: Array<{ key: MatrixDayOfWeek; fullLabel: string }> = [
  { key: 'Seg', fullLabel: 'Segunda-feira' },
  { key: 'Ter', fullLabel: 'Terça-feira' },
  { key: 'Qua', fullLabel: 'Quarta-feira' },
  { key: 'Qui', fullLabel: 'Quinta-feira' },
  { key: 'Sex', fullLabel: 'Sexta-feira' },
  { key: 'Sáb', fullLabel: 'Sábado' },
];

export const MATRIX_SHIFTS: Array<{
  key: MatrixShiftSlot;
  timeRangeHint: string;
}> = [
  { key: 'Manhã', timeRangeHint: '07h00 às 12h30' },
  { key: 'Tarde', timeRangeHint: '13h00 às 18h00' },
  { key: 'Noite', timeRangeHint: '18h30 às 22h30' },
];

/**
 * Converte horário HH:mm em minutos desde 00:00 para comparação exata de sobreposição.
 */
export function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

/**
 * Determina o turno (Manhã, Tarde, Noite) com base no horário de início da aula.
 */
export function resolveShiftFromStartTime(startTime: string): MatrixShiftSlot {
  const minutes = parseTimeToMinutes(startTime);
  if (minutes < 12 * 60 + 30) return 'Manhã';
  if (minutes < 18 * 60) return 'Tarde';
  return 'Noite';
}

/**
 * Converte uma data ISO YYYY-MM-DD para o dia da semana da matriz (Seg a Sáb).
 * Domingos são mapeados para Sáb para fins de exibição na grade de 6 dias.
 */
export function resolveDayOfWeekFromIsoDate(isoDate: string): MatrixDayOfWeek {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return 'Seg';
  const dt = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  const day = dt.getDay(); // 0=Dom, 1=Seg ... 6=Sáb
  switch (day) {
    case 1:
      return 'Seg';
    case 2:
      return 'Ter';
    case 3:
      return 'Qua';
    case 4:
      return 'Qui';
    case 5:
      return 'Sex';
    default:
      return 'Sáb';
  }
}

/**
 * Verifica se dois intervalos de horário [startA, endA) e [startB, endB) se sobrepõem.
 */
export function doTimeIntervalsOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const a0 = parseTimeToMinutes(startA);
  const a1 = parseTimeToMinutes(endA);
  const b0 = parseTimeToMinutes(startB);
  const b1 = parseTimeToMinutes(endB);
  return a0 < b1 && b0 < a1;
}

/**
 * Detecta automaticamente todos os conflitos de horário em uma lista de aulas da matriz:
 * 1. Mesmo professor alocado em duas aulas sobrepostas no mesmo dia da semana.
 * 2. Mesma turma com duas aulas sobrepostas no mesmo dia da semana.
 */
export function detectScheduleConflicts(
  entries: ScheduleMatrixEntry[]
): {
  conflicts: ScheduleConflictRecord[];
  conflictingEntryIds: Set<string>;
} {
  const activeEntries = entries.filter((e) => e.status !== 'cancelada');
  const conflicts: ScheduleConflictRecord[] = [];
  const conflictingEntryIds = new Set<string>();

  for (let i = 0; i < activeEntries.length; i++) {
    for (let j = i + 1; j < activeEntries.length; j++) {
      const a = activeEntries[i];
      const b = activeEntries[j];

      // Verifica se caem no mesmo dia da semana (ou mesma data) e se os horários se sobrepõem
      if (a.dayOfWeek !== b.dayOfWeek) continue;
      if (!doTimeIntervalsOverlap(a.startTime, a.endTime, b.startTime, b.endTime)) {
        continue;
      }

      const overlapLabel = `${a.startTime}-${a.endTime} vs. ${b.startTime}-${b.endTime}`;

      // Conflito 1: Mesmo Professor em duas aulas simultâneas
      if (a.teacherPersonId === b.teacherPersonId) {
        conflictingEntryIds.add(a.id);
        conflictingEntryIds.add(b.id);
        conflicts.push({
          id: `conf-prof-${a.id}-${b.id}`,
          type: 'teacher_overlap',
          dayOfWeek: a.dayOfWeek,
          shiftSlot: a.shiftSlot,
          timeOverlapLabel: overlapLabel,
          description: `Conflito de Professor (${a.dayOfWeek}): ${a.teacherName} está alocado(a) simultaneamente em "${a.subjectName}" (${a.classRoomName}) e "${b.subjectName}" (${b.classRoomName}) no horário ${overlapLabel}.`,
          involvedEntryIds: [a.id, b.id],
        });
      }

      // Conflito 2: Mesma Turma com duas aulas simultâneas
      if (a.classRoomId === b.classRoomId) {
        conflictingEntryIds.add(a.id);
        conflictingEntryIds.add(b.id);
        conflicts.push({
          id: `conf-cls-${a.id}-${b.id}`,
          type: 'classroom_overlap',
          dayOfWeek: a.dayOfWeek,
          shiftSlot: a.shiftSlot,
          timeOverlapLabel: overlapLabel,
          description: `Conflito de Turma (${a.dayOfWeek}): A turma ${a.classRoomName} possui duas aulas sobrepostas ("${a.subjectName}" e "${b.subjectName}") no horário ${overlapLabel}.`,
          involvedEntryIds: [a.id, b.id],
        });
      }
    }
  }

  return { conflicts, conflictingEntryIds };
}
