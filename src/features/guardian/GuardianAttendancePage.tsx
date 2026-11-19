import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Info,
  XCircle,
} from 'lucide-react';
import {
  Badge,
  Card,
  EmptyState,
  MetricCard,
  Select,
} from '../../components/ui';
import { useSession } from '../../contexts/SessionContext';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import {
  formatDateBR,
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
      {/* Cabeçalho enxuto alinhado pela base (Regra 2) */}
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-end">
        <h1>Frequência</h1>

        <div className="w-full sm:w-60">
          <Select
            label="Mês"
            value={selectedMonth}
            onChange={(e) =>
              setSelectedMonth(
                e.target.value as GuardianSimulatedMonthAttendance['monthKey']
              )
            }
            options={GUARDIAN_MONTH_FILTERS.map((m) => ({
              value: m.monthKey,
              label: m.monthLabel,
            }))}
          />
        </div>
      </div>

      <GuardianStudentSelectorBar />

      {student && linkedStudentsForGuardian.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard
              title="Presenças"
              value={`${counts.present} ${counts.present === 1 ? 'aula' : 'aulas'}`}
              accentColor="progress"
              subtitle={`Taxa: ${counts.percentage}% (Meta ≥ 75%)`}
            />

            <MetricCard
              title="Faltas Justificadas"
              value={`${counts.justified} ${counts.justified === 1 ? 'aula' : 'aulas'}`}
              accentColor="assess"
              subtitle="Abonadas pela coordenação"
            />

            <MetricCard
              title="Faltas"
              value={`${counts.absent} ${counts.absent === 1 ? 'aula' : 'aulas'}`}
              accentColor={counts.absent > 0 ? 'critical' : 'progress'}
              subtitle={`Total: ${counts.total} aulas no período`}
            />
          </div>

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
                    className="rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-base font-extrabold text-slate-900">
                        <Calendar className="h-4 w-4 text-primary-700" aria-hidden="true" />
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
                      <h3 className="text-lg font-extrabold text-primary-900">
                        Matéria: {row.subjectName}
                      </h3>
                      <p className="text-base font-medium text-slate-800 mt-0.5">
                        Assunto estudado: {row.topic}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 pt-1">
                      <span className="inline-flex items-center gap-1 font-semibold">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        <span>Horário: {row.timeRange}</span>
                      </span>
                      <span>Professor(a): {row.teacherName}</span>
                    </div>

                    {row.justification && (
                      <div className="mt-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-slate-900">
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
