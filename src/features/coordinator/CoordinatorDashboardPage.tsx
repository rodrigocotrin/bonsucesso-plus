import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Download, Phone, Printer } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  MetricCard,
} from '../../components/ui';
import { PrintReportHeader } from '../../components/shared/PrintReportHeader';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import { useToast } from '../../contexts/ToastContext';
import { exportToCsv, triggerPrintReport } from '../../lib/exportCsv';
import { SPRINGS, TRANSITIONS, VARIANTS } from '../../lib/motion';
import { getDisplayName } from '../../lib/person';
import {
  cn,
  getInitials,
} from '../../utils/formatters';
import { CoordinatorOperationsSection } from './components/CoordinatorOperationsSection';

export const CoordinatorDashboardPage: React.FC = () => {
  const { db, getStudentAttendancePercentage } = useMockDatabase();
  const { showToast } = useToast();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isPerformanceRoute = location.pathname === '/coordenacao/desempenho';

  const [activeTab, setActiveTab] = useState<'overview' | 'operations'>('overview');

  useEffect(() => {
    if (searchParams.get('action') === 'new-donation') {
      setActiveTab('operations');
    }
  }, [searchParams]);

  const activeStudents = useMemo(
    () => db.persons.filter((p) => p.id.startsWith('per-est-') && p.status === 'active'),
    [db.persons]
  );

  const activeTeachers = useMemo(
    () => db.persons.filter((p) => p.id.startsWith('per-prof-') && p.status === 'active'),
    [db.persons]
  );

  const overallAttendanceAverage = useMemo(() => {
    if (activeStudents.length === 0) return 100;
    const sum = activeStudents.reduce(
      (acc, student) => acc + getStudentAttendancePercentage(student.id),
      0
    );
    return Math.round(sum / activeStudents.length);
  }, [activeStudents, getStudentAttendancePercentage]);

  const latestAssessment = useMemo(() => {
    const sorted = [...db.assessments].sort((a, b) => a.date.localeCompare(b.date));
    return sorted[sorted.length - 1];
  }, [db.assessments]);

  const latestSimuladoAverage = useMemo(() => {
    if (!latestAssessment) return 0;
    const gradesForLatest = db.grades.filter((g) => g.assessmentId === latestAssessment.id);
    if (gradesForLatest.length === 0) return 0;
    const sum = gradesForLatest.reduce((acc, g) => acc + g.score, 0);
    return Math.round(sum / gradesForLatest.length);
  }, [db.grades, latestAssessment]);

  const priorityCareStudents = useMemo(() => {
    return activeStudents
      .map((student) => {
        const attendancePct = getStudentAttendancePercentage(student.id);
        const enrollment = db.enrollments.find((e) => e.studentPersonId === student.id);
        const classRoom = db.classRooms.find((c) => c.id === enrollment?.classRoomId);
        const responsibility = db.responsibilities.find((r) => r.studentPersonId === student.id);
        const guardian = responsibility
          ? db.persons.find((p) => p.id === responsibility.guardianPersonId)
          : undefined;

        return {
          student,
          attendancePct,
          enrollmentCode: enrollment?.enrollmentCode ?? 'BS-2026',
          classRoomName: classRoom?.name ?? 'Turma Esperança',
          guardian,
          relationship: responsibility?.relationship,
        };
      })
      .filter((item) => item.attendancePct < 75)
      .sort((a, b) => a.attendancePct - b.attendancePct);
  }, [
    activeStudents,
    getStudentAttendancePercentage,
    db.enrollments,
    db.classRooms,
    db.responsibilities,
    db.persons,
  ]);

  const enemAreasAnalytics = useMemo(() => {
    const firstSimulado = db.assessments[0];
    const latestSim = latestAssessment;

    const latestGrades = db.grades.filter(
      (g) => g.assessmentId === latestSim?.id && g.areaScores
    );
    const firstGrades = db.grades.filter(
      (g) => g.assessmentId === firstSimulado?.id && g.areaScores
    );

    const calcAreaAvg = (
      list: typeof latestGrades,
      key: keyof NonNullable<(typeof latestGrades)[0]['areaScores']>
    ) => {
      if (list.length === 0) return 650;
      const sum = list.reduce((acc, g) => acc + (g.areaScores?.[key] ?? 0), 0);
      return Math.round(sum / list.length);
    };

    const areas = [
      {
        key: 'redacao' as const,
        label: 'Redação',
        currentAvg: calcAreaAvg(latestGrades, 'redacao'),
        firstAvg: calcAreaAvg(firstGrades, 'redacao'),
      },
      {
        key: 'humanas' as const,
        label: 'Ciências Humanas',
        currentAvg: calcAreaAvg(latestGrades, 'humanas'),
        firstAvg: calcAreaAvg(firstGrades, 'humanas'),
      },
      {
        key: 'natureza' as const,
        label: 'Ciências da Natureza',
        currentAvg: calcAreaAvg(latestGrades, 'natureza'),
        firstAvg: calcAreaAvg(firstGrades, 'natureza'),
      },
      {
        key: 'matematica' as const,
        label: 'Matemática',
        currentAvg: calcAreaAvg(latestGrades, 'matematica'),
        firstAvg: calcAreaAvg(firstGrades, 'matematica'),
      },
      {
        key: 'linguagens' as const,
        label: 'Linguagens',
        currentAvg: calcAreaAvg(latestGrades, 'linguagens'),
        firstAvg: calcAreaAvg(firstGrades, 'linguagens'),
      },
    ].map((item) => ({
      ...item,
      delta: item.currentAvg - item.firstAvg,
    }));

    const needsReinforcement = [...areas].sort((a, b) => a.currentAvg - b.currentAvg)[0];

    return {
      areas,
      needsReinforcement,
    };
  }, [db.assessments, db.grades, latestAssessment]);

  const handleExportPerformanceCsv = () => {
    exportToCsv({
      filename: 'bonsucesso-frequencia-desempenho',
      headers: [
        'Área do ENEM',
        'Média 1º Simulado (pts)',
        'Média Simulado Atual (pts)',
        'Evolução (pts)',
      ],
      rows: enemAreasAnalytics.areas.map((area) => [
        area.label,
        area.firstAvg,
        area.currentAvg,
        area.delta >= 0 ? `+${area.delta}` : area.delta,
      ]),
    });
    showToast({
      variant: 'success',
      title: 'Relatório CSV exportado',
      description: 'Arquivo bonsucesso-frequencia-desempenho.csv gerado.',
    });
  };

  return (
    <div className="space-y-8">
      <PrintReportHeader
        title="Relatório Pedagógico de Frequência e Desempenho ENEM"
        subtitle={`Frequência Média: ${overallAttendanceAverage}% • Último Simulado: ${latestSimuladoAverage} pts`}
      />

      {/* Cabeçalho enxuto (Regra 2: Título curto em 1 linha + Abas minimalistas sem pills pretas) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-3">
        <h1>{isPerformanceRoute ? 'Desempenho Geral' : 'Painel'}</h1>

        <div className="no-print flex flex-wrap items-center gap-4">
          {!isPerformanceRoute && (
            <div role="tablist" aria-label="Visões do painel" className="-mb-3 flex items-center gap-6">
            {(
              [
                { id: 'overview', label: 'Acompanhamento Pedagógico' },
                { id: 'operations', label: 'Copa & Doações' },
              ] as const
            ).map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative inline-flex h-10 items-center text-sm transition-colors duration-150',
                    isSelected
                      ? 'font-semibold text-ink'
                      : 'font-medium text-ink-muted hover:text-ink'
                  )}
                >
                  <span>{tab.label}</span>
                  {isSelected && (
                    <motion.span
                      layoutId="coordinator-dashboard-tab-underline"
                      transition={SPRINGS.indicator}
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-ink"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={handleExportPerformanceCsv}
            >
              Exportar CSV
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Printer className="h-4 w-4" />}
              onClick={triggerPrintReport}
            >
              Imprimir
            </Button>
          </div>
        </div>
      </div>

      {/* 4 KPI Cards Ultra-Limpos (Máximo 3 elementos por card — Regra 2) */}
      <section aria-label="Indicadores principais">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Alunos Ativos"
            value={`${activeStudents.length} alunos`}
            accentColor="progress"
            subtitle={`${db.classRooms.length} turmas`}
          />

          <MetricCard
            title="Professores Voluntários"
            value={`${activeTeachers.length} docentes`}
            accentColor="academic"
            subtitle={`${db.subjects.length} disciplinas`}
          />

          <MetricCard
            title="Frequência Média"
            value={overallAttendanceAverage}
            scale="percentage"
            accentColor={overallAttendanceAverage < 75 ? 'assess' : 'progress'}
            statusBadge={{
              label:
                priorityCareStudents.length > 0
                  ? `${priorityCareStudents.length} abaixo de 75%`
                  : 'Meta 75% atingida',
              variant: priorityCareStudents.length > 0 ? 'critical' : 'progress',
            }}
          />

          <MetricCard
            title="Último Simulado ENEM"
            value={latestSimuladoAverage}
            scale="enem"
            accentColor="assess"
            trend={{
              direction: 'up',
              label: '+48 pts no semestre',
              variant: 'progress',
            }}
          />
        </div>
      </section>

      <AnimatePresence mode="wait" initial={false}>
        {activeTab === 'overview' || isPerformanceRoute ? (
          <motion.div
            key="coord-overview"
            variants={VARIANTS.page}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-8"
          >
          {/* Lista em Linhas Horizontais Limpas (Regra 3 e 5: Sem card vermelho gigante, sem box-ception) */}
          <Card
            as="section"
            title="Atenção de Frequência (< 75%)"
            headerAction={
              <Link
                to="/coordenacao/alunos"
                className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink"
              >
                <span>Ver todos os alunos</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            }
            noPadding
          >
            {priorityCareStudents.length > 0 ? (
              <ul className="divide-y divide-line">
                {priorityCareStudents.map((item) => (
                  <li
                    key={item.student.id}
                    className="flex flex-col gap-3 px-5 py-3.5 transition-colors hover:bg-subtle sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="font-mono flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-subtle text-xs font-semibold text-ink"
                        aria-hidden="true"
                      >
                        {getInitials(getDisplayName(item.student))}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/coordenacao/alunos?studentId=${item.student.id}`}
                            className="truncate text-sm font-semibold text-ink hover:underline"
                          >
                            {getDisplayName(item.student)}
                          </Link>
                          <span className="font-mono text-xs text-ink-muted">
                            {item.enrollmentCode}
                          </span>
                        </div>
                        <p className="truncate text-xs text-ink-muted">
                          {item.classRoomName}
                          {item.guardian
                            ? ` • ${item.relationship}: ${getDisplayName(item.guardian)} (${item.guardian.phone})`
                            : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                      <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
                        <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="font-mono tabular-nums">{item.student.phone}</span>
                      </span>

                      <Badge variant="critical">
                        <span className="font-mono tabular-nums">{item.attendancePct}%</span> presença
                      </Badge>

                      <Link
                        to={`/coordenacao/alunos?studentId=${item.student.id}`}
                        className="inline-flex h-8 items-center rounded-md border border-line bg-surface px-3 text-xs font-medium text-ink hover:bg-subtle"
                      >
                        Ver perfil
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-5 text-sm text-ink-muted">
                Todos os alunos ativos estão com frequência igual ou superior a 75%.
              </p>
            )}
          </Card>

          {/* Desempenho por Área do ENEM (Linhas horizontais limpas, sem caixas aninhadas) */}
          <Card
            as="section"
            title="Média por Área do ENEM"
            headerAction={
              <span className="text-xs text-ink-muted">
                Reforço prioritário: <strong className="text-ink">{enemAreasAnalytics.needsReinforcement.label}</strong>
              </span>
            }
          >
            <ul className="divide-y divide-line">
              {enemAreasAnalytics.areas.map((area) => {
                const pct = Math.max(8, Math.min(100, Math.round((area.currentAvg / 1000) * 100)));
                const isLowest = area.key === enemAreasAnalytics.needsReinforcement.key;

                return (
                  <li key={area.key} className="py-3.5 first:pt-0 last:pb-0">
                    <div className="mb-1.5 flex items-baseline justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-ink">{area.label}</span>
                        {isLowest && <Badge variant="assess">Priorizar revisão</Badge>}
                      </div>

                      <div className="flex items-baseline gap-3">
                        <span className="font-mono text-xs text-progress tabular-nums">
                          {area.delta >= 0 ? `+${area.delta}` : area.delta} pts
                        </span>
                        <span className="font-mono text-sm font-semibold text-ink tabular-nums">
                          {area.currentAvg}
                        </span>
                        <span className="text-xs text-ink-muted">/ 1000</span>
                      </div>
                    </div>

                    <div
                      role="progressbar"
                      aria-label={`${area.label}: ${area.currentAvg} de 1000`}
                      aria-valuenow={area.currentAvg}
                      aria-valuemin={0}
                      aria-valuemax={1000}
                      className="h-2 w-full overflow-hidden rounded-sm bg-subtle"
                    >
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: pct / 100 }}
                        transition={TRANSITIONS.progressBar}
                        style={{ transformOrigin: 'left' }}
                        className={cn(
                          'h-full w-full rounded-sm',
                          isLowest ? 'bg-assess' : 'bg-academic'
                        )}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
          </motion.div>
        ) : (
          <motion.div
            key="coord-operations"
            variants={VARIANTS.page}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <CoordinatorOperationsSection />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
