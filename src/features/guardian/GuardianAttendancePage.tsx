import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Info,
  XCircle,
} from 'lucide-react';
import {
  Badge,
  CalloutAlert,
  Card,
  EmptyState,
  Select,
} from '../../components/ui';
import { useSession } from '../../contexts/SessionContext';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import {
  formatDateBR,
  getDisplayName,
} from '../../utils/formatters';
import {
  GuardianCoordinationSupportBox,
  GuardianStudentSelectorBar,
} from './GuardianSharedComponents';
import { GUARDIAN_MONTH_FILTERS, GuardianSimulatedMonthAttendance } from './guardianData';

interface EnrichedAttendanceRow {
  id: string;
  date: string;
  timeRange: string;
  subjectName: string;
  teacherName: string;
  topic: string;
  presence: 'presente' | 'falta' | 'justificada';
  justification?: string;
}

export const GuardianAttendancePage: React.FC = () => {
  const { selectedStudentForGuardian, linkedStudentsForGuardian } = useSession();
  const { db } = useMockDatabase();

  const [selectedMonth, setSelectedMonth] =
    useState<GuardianSimulatedMonthAttendance['monthKey']>('all');

  const student = selectedStudentForGuardian;

  // Monta o histórico completo e legível de aulas para o estudante selecionado
  const allAttendanceRows = useMemo<EnrichedAttendanceRow[]>(() => {
    if (!student) return [];

    // Registros reais de Novembro da Store Mockada
    const realRecords = db.attendances
      .filter((a) => a.studentPersonId === student.id)
      .map((att) => {
        const lesson = db.lessons.find((l) => l.id === att.lessonId);
        const subject = db.subjects.find((s) => s.id === lesson?.subjectId);
        const teacher = db.persons.find((p) => p.id === lesson?.teacherPersonId);

        return {
          id: att.id,
          date: lesson?.date ?? att.recordedAt,
          timeRange: lesson ? `${lesson.startTime} às ${lesson.endTime}` : '19:00 às 20:30',
          subjectName: subject?.name ?? 'Aula Regular',
          teacherName: teacher?.fullName ?? 'Professor(a) Voluntário(a)',
          topic: lesson?.topic ?? 'Conteúdo programático do ENEM',
          presence: att.presence,
          justification: att.justification,
        };
      });

    // Adiciona registros históricos de Outubro e Setembro para que o filtro por mês funcione com riqueza
    const isMariana = student.id === 'per-est-01';
    const historicalMonthsRecords: EnrichedAttendanceRow[] = [
      {
        id: `hist-oct-1-${student.id}`,
        date: '2026-10-28',
        timeRange: '19:00 às 20:30',
        subjectName: 'Matemática',
        teacherName: 'Prof. Carlos Eduardo Lima',
        topic: 'Geometria Plana: Áreas de Figuras e Triângulos',
        presence: 'presente',
      },
      {
        id: `hist-oct-2-${student.id}`,
        date: '2026-10-21',
        timeRange: '19:00 às 21:00',
        subjectName: 'Redação',
        teacherName: 'Profa. Beatriz Souza Carvalho',
        topic: 'Repertório Sociocultural e Citações na Redação do ENEM',
        presence: isMariana ? 'justificada' : 'presente',
        justification: isMariana
          ? 'Atraso na saída do trabalho avisado previamente à coordenação'
          : undefined,
      },
      {
        id: `hist-oct-3-${student.id}`,
        date: '2026-10-15',
        timeRange: '19:00 às 20:30',
        subjectName: 'História',
        teacherName: 'Prof. Marcos Vinícius Ferreira',
        topic: 'Segundo Reinado e Abolição da Escravatura no Brasil',
        presence: isMariana ? 'falta' : 'presente',
      },
      {
        id: `hist-sep-1-${student.id}`,
        date: '2026-09-24',
        timeRange: '19:00 às 20:30',
        subjectName: 'Biologia',
        teacherName: 'Profa. Juliana Castro Mendes',
        topic: 'Citologia e Genética Básica no ENEM',
        presence: 'presente',
      },
      {
        id: `hist-sep-2-${student.id}`,
        date: '2026-09-17',
        timeRange: '19:00 às 20:30',
        subjectName: 'Português',
        teacherName: 'Profa. Beatriz Souza Carvalho',
        topic: 'Funções da Linguagem e Interpretação de Poemas',
        presence: 'presente',
      },
    ];

    return [...realRecords, ...historicalMonthsRecords].sort((a, b) =>
      b.date.localeCompare(a.date)
    );
  }, [db.attendances, db.lessons, db.subjects, db.persons, student]);

  // Aplica o filtro de mês selecionado
  const filteredRows = useMemo(() => {
    if (selectedMonth === 'all') return allAttendanceRows;
    return allAttendanceRows.filter((row) => row.date.startsWith(selectedMonth));
  }, [allAttendanceRows, selectedMonth]);

  // Contagem explicada do período filtrado
  const counts = useMemo(() => {
    const total = filteredRows.length;
    const present = filteredRows.filter((r) => r.presence === 'presente').length;
    const justified = filteredRows.filter((r) => r.presence === 'justificada').length;
    const absent = filteredRows.filter((r) => r.presence === 'falta').length;
    const percentage = total > 0 ? Math.round(((present + justified) / total) * 100) : 100;

    return { total, present, justified, absent, percentage };
  }, [filteredRows]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Cabeçalho Linear */}
      <header className="space-y-2">
        <Badge variant="primary" icon={<CalendarCheck className="h-4 w-4" />}>
          Acompanhamento de Presença nas Aulas
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Frequência e Histórico de Aulas
        </h1>
        <p className="text-base sm:text-lg text-slate-700 dark:text-slate-200 leading-relaxed">
          Esta página mostra cada aula em que o(a) estudante esteve <strong>Presente</strong>, quando{' '}
          <strong>Faltou</strong> ou quando teve uma <strong>Falta Justificada</strong>.
        </p>
      </header>

      {/* Seletor de Estudante Vinculado */}
      <GuardianStudentSelectorBar />

      {student && linkedStudentsForGuardian.length > 0 && (
        <>
          {/* Filtro por Mês + Contagem Total Explicada por Extenso */}
          <Card
            as="section"
            title={`Resumo de Presença de ${getDisplayName(student)}`}
            subtitle="Você pode escolher um mês abaixo para filtrar as aulas e ver a contagem explicada."
          >
            <div className="space-y-5">
              <div className="max-w-md">
                <Select
                  label="Escolher mês para consultar as aulas:"
                  value={selectedMonth}
                  onChange={(e) =>
                    setSelectedMonth(
                      e.target.value as GuardianSimulatedMonthAttendance['monthKey']
                    )
                  }
                  leftIcon={<Calendar className="h-5 w-5" />}
                  options={GUARDIAN_MONTH_FILTERS.map((m) => ({
                    value: m.monthKey,
                    label: m.monthLabel,
                  }))}
                />
              </div>

              {/* Explicação em frase clara (Heurística de Reconhecimento) */}
              <CalloutAlert
                variant={counts.percentage < 75 ? 'warning' : 'success'}
                title={`Presença no período selecionado: ${counts.percentage}% (${
                  counts.present + counts.justified
                } presenças em ${counts.total} aulas)`}
              >
                No período exibido abaixo, <strong>{getDisplayName(student)}</strong> compareceu a{' '}
                <strong>{counts.present} aulas</strong>, teve{' '}
                <strong>
                  {counts.justified}{' '}
                  {counts.justified === 1 ? 'falta justificada' : 'faltas justificadas'}
                </strong>{' '}
                e{' '}
                <strong>
                  {counts.absent} {counts.absent === 1 ? 'falta sem justificativa' : 'faltas'}
                </strong>
                . Lembramos que a meta do cursinho é manter pelo menos <strong>75% de presença</strong>.
              </CalloutAlert>

              {/* 3 Cartões grandes de contagem */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border-2 border-emerald-400/70 bg-emerald-50/70 p-4 dark:border-emerald-700 dark:bg-emerald-950/30">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-950 dark:text-emerald-200">
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Aulas Presente</span>
                  </span>
                  <p className="mt-1 text-2xl font-extrabold text-emerald-950 dark:text-white">
                    {counts.present} {counts.present === 1 ? 'aula' : 'aulas'}
                  </p>
                </div>

                <div className="rounded-2xl border-2 border-amber-400/70 bg-amber-50/70 p-4 dark:border-amber-700 dark:bg-amber-950/30">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-amber-950 dark:text-amber-200">
                    <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Faltas Justificadas</span>
                  </span>
                  <p className="mt-1 text-2xl font-extrabold text-amber-950 dark:text-white">
                    {counts.justified} {counts.justified === 1 ? 'aula' : 'aulas'}
                  </p>
                </div>

                <div className="rounded-2xl border-2 border-red-400/70 bg-red-50/70 p-4 dark:border-red-700 dark:bg-red-950/30">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-red-950 dark:text-red-200">
                    <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Faltas Registradas</span>
                  </span>
                  <p className="mt-1 text-2xl font-extrabold text-red-950 dark:text-white">
                    {counts.absent} {counts.absent === 1 ? 'aula' : 'aulas'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Lista Linear de Aulas Dia por Dia */}
          <Card
            as="section"
            title="Histórico Detalhado Dia por Dia"
            subtitle="Cada linha abaixo representa uma aula dada no cursinho e informa se o(a) estudante compareceu."
          >
            {filteredRows.length > 0 ? (
              <div className="space-y-3.5">
                {filteredRows.map((row) => (
                  <article
                    key={row.id}
                    className="rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-950/50 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-base font-extrabold text-slate-900 dark:text-white">
                        <Calendar className="h-4 w-4 text-primary-700 dark:text-primary-400" aria-hidden="true" />
                        <span>Dia {formatDateBR(row.date)}</span>
                      </span>

                      {row.presence === 'presente' && (
                        <Badge variant="success" icon={<CheckCircle2 className="h-4 w-4" />}>
                          Presente na aula
                        </Badge>
                      )}
                      {row.presence === 'justificada' && (
                        <Badge variant="warning" icon={<Info className="h-4 w-4" />}>
                          Falta Justificada
                        </Badge>
                      )}
                      {row.presence === 'falta' && (
                        <Badge variant="danger" icon={<XCircle className="h-4 w-4" />}>
                          Faltou à aula
                        </Badge>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-extrabold text-primary-900 dark:text-primary-300">
                        Matéria: {row.subjectName}
                      </h3>
                      <p className="text-base font-medium text-slate-800 dark:text-slate-100 mt-0.5">
                        Assunto estudado: {row.topic}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-300 pt-1">
                      <span className="inline-flex items-center gap-1 font-semibold">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        <span>Horário: {row.timeRange}</span>
                      </span>
                      <span>Professor(a): {row.teacherName}</span>
                    </div>

                    {row.justification && (
                      <div className="mt-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-slate-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
                        <strong>Motivo informado para a falta:</strong> {row.justification}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Nenhuma aula registrada neste mês"
                description="Escolha a opção 'Todo o 2º Semestre de 2026' acima para ver todas as aulas."
              />
            )}
          </Card>
        </>
      )}

      {/* Canal de Apoio Fixo */}
      <GuardianCoordinationSupportBox />
    </div>
  );
};
