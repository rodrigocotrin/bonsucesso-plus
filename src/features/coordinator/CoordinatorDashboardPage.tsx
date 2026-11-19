import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  Coffee,
  Eye,
  GraduationCap,
  Phone,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Badge,
  CalloutAlert,
  Card,
  MetricCard,
} from '../../components/ui';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import {
  formatEnemScore,
  getDisplayName,
} from '../../utils/formatters';
import { CoordinatorOperationsSection } from './components/CoordinatorOperationsSection';

export const CoordinatorDashboardPage: React.FC = () => {
  const {
    db,
    getStudentAttendancePercentage,
  } = useMockDatabase();

  const [activeDashboardTab, setActiveDashboardTab] = useState<'pedagogical' | 'operations'>(
    'pedagogical'
  );

  // 1. KPIs Principais
  const activeStudents = useMemo(() => {
    return db.persons.filter(
      (p) => p.id.startsWith('per-est-') && p.status === 'active'
    );
  }, [db.persons]);

  const activeTeachers = useMemo(() => {
    return db.persons.filter(
      (p) => p.id.startsWith('per-prof-') && p.status === 'active'
    );
  }, [db.persons]);

  const overallAttendanceAverage = useMemo(() => {
    if (activeStudents.length === 0) return 100;
    const sum = activeStudents.reduce(
      (acc, student) => acc + getStudentAttendancePercentage(student.id),
      0
    );
    return Math.round(sum / activeStudents.length);
  }, [activeStudents, getStudentAttendancePercentage]);

  const latestAssessment = useMemo(() => {
    const sorted = [...db.assessments].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    return sorted[sorted.length - 1];
  }, [db.assessments]);

  const latestSimuladoAverage = useMemo(() => {
    if (!latestAssessment) return 0;
    const gradesForLatest = db.grades.filter(
      (g) => g.assessmentId === latestAssessment.id
    );
    if (gradesForLatest.length === 0) return 0;
    const sum = gradesForLatest.reduce((acc, g) => acc + g.score, 0);
    return Math.round(sum / gradesForLatest.length);
  }, [db.grades, latestAssessment]);

  // 2. Bloco "Acolhimento como prioridade": alunos com frequência < 75%
  const priorityCareStudents = useMemo(() => {
    return activeStudents
      .map((student) => {
        const attendancePct = getStudentAttendancePercentage(student.id);
        const enrollment = db.enrollments.find(
          (e) => e.studentPersonId === student.id
        );
        const classRoom = db.classRooms.find(
          (c) => c.id === enrollment?.classRoomId
        );
        const responsibility = db.responsibilities.find(
          (r) => r.studentPersonId === student.id
        );
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

  // 3. Gráfico "Da informação à ação": Média do Cursinho nas 5 Áreas do ENEM + Resumo Textual Automático
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
        label: 'Redação Dissertativa',
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
        label: 'Linguagens e Códigos',
        currentAvg: calcAreaAvg(latestGrades, 'linguagens'),
        firstAvg: calcAreaAvg(firstGrades, 'linguagens'),
      },
    ].map((item) => ({
      ...item,
      delta: item.currentAvg - item.firstAvg,
    }));

    const highestEvolution = [...areas].sort((a, b) => b.delta - a.delta)[0];
    const needsReinforcement = [...areas].sort(
      (a, b) => a.currentAvg - b.currentAvg
    )[0];

    return {
      areas,
      highestEvolution,
      needsReinforcement,
    };
  }, [db.assessments, db.grades, latestAssessment]);

  return (
    <div className="space-y-8">
      {/* Cabeçalho Institucional e Seletor de Abas do Dashboard */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="primary">
            Coordenação Pedagógica & Operações • 2º Semestre de 2026 (UC22)
          </Badge>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Painel da Coordenação — Cursinho Bonsucesso
          </h1>
          <p className="mt-1 max-w-3xl text-base text-slate-600 dark:text-slate-300">
            Visão integrada de acompanhamento estudantil, prevenção de evasão, evolução nos
            simulados ENEM e controle interno da copa e doações comunitárias.
          </p>
        </div>

        {/* Seletor de Abas do Dashboard */}
        <div
          role="tablist"
          aria-label="Seções do Painel da Coordenação"
          className="inline-flex flex-wrap gap-2 rounded-2xl border border-slate-300 bg-slate-100 p-1.5 dark:border-slate-700 dark:bg-slate-800 shrink-0"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeDashboardTab === 'pedagogical'}
            onClick={() => setActiveDashboardTab('pedagogical')}
            className={`min-h-[44px] inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold transition-all ${
              activeDashboardTab === 'pedagogical'
                ? 'bg-primary-700 text-white shadow-xs dark:bg-primary-600'
                : 'text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <GraduationCap className="h-4 w-4" aria-hidden="true" />
            <span>1. Visão Pedagógica & Acolhimento</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeDashboardTab === 'operations'}
            onClick={() => setActiveDashboardTab('operations')}
            className={`min-h-[44px] inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold transition-all ${
              activeDashboardTab === 'operations'
                ? 'bg-primary-700 text-white shadow-xs dark:bg-primary-600'
                : 'text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Coffee className="h-4 w-4" aria-hidden="true" />
            <span>2. Operações, Copa e Doações</span>
          </button>
        </div>
      </div>

      {/* OS 4 KPIs PRINCIPAIS (Sempre visíveis no topo) */}
      <section aria-label="Indicadores principais do cursinho">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total de Alunos Ativos"
            value={`${activeStudents.length} alunos`}
            scale="raw"
            accentColor="primary"
            icon={<Users className="h-6 w-6" />}
            statusBadge={{
              label: `${db.classRooms.length} turmas`,
              variant: 'primary',
            }}
            subtitle="Estudantes com matrícula ativa no 2º semestre de 2026."
          />

          <MetricCard
            title="Professores Voluntários Ativos"
            value={`${activeTeachers.length} docentes`}
            scale="raw"
            accentColor="success"
            icon={<BookOpen className="h-6 w-6" />}
            statusBadge={{
              label: `${db.subjects.length} disciplinas ENEM`,
              variant: 'success',
            }}
            subtitle="Educadores voluntários dedicados às aulas e monitorias."
          />

          <MetricCard
            title="Frequência Média Geral"
            value={overallAttendanceAverage}
            scale="percentage"
            accentColor={overallAttendanceAverage < 75 ? 'warning' : 'primary'}
            icon={<CalendarCheck className="h-6 w-6" />}
            statusBadge={{
              label: `${priorityCareStudents.length} em atenção (<75%)`,
              variant: priorityCareStudents.length > 0 ? 'danger' : 'success',
            }}
            subtitle="Meta institucional: manter assiduidade acima de 75%."
          />

          <MetricCard
            title="Média do Último Simulado"
            value={latestSimuladoAverage}
            scale="enem"
            accentColor="secondary"
            icon={<GraduationCap className="h-6 w-6" />}
            trend={{
              direction: 'up',
              label: '+48 pts desde o 1º Simulado',
              variant: 'success',
            }}
            subtitle={latestAssessment?.title ?? '3º Simulado Geral ENEM Bonsucesso'}
          />
        </div>
      </section>

      {activeDashboardTab === 'pedagogical' ? (
        <div className="space-y-8">
          {/* BLOCO "ACOLHIMENTO COMO PRIORIDADE" (Alunos com frequência < 75%) */}
          <Card
            as="section"
            className="border-2 border-danger-500/70 dark:border-red-600"
            title="Acolhimento como Prioridade — Estudantes com Frequência Abaixo de 75%"
            subtitle="Identifique rapidamente quem precisa de escuta ativa, apoio com transporte ou adaptação de rotina para evitar evasão."
            headerAction={
              <Link
                to="/coordenacao/alunos"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-primary-700 px-4 py-2 text-sm font-bold text-white hover:bg-primary-800 dark:bg-primary-600"
              >
                <span>Ir para Gestão de Alunos</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          >
            {priorityCareStudents.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {priorityCareStudents.map((item) => (
                  <div
                    key={item.student.id}
                    className="flex flex-col justify-between rounded-2xl border-2 border-danger-200 bg-danger-50/40 p-4 dark:border-red-900/70 dark:bg-danger-950/20 space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                          {item.enrollmentCode} • {item.classRoomName}
                        </span>
                        <Badge
                          variant="danger"
                          icon={<AlertTriangle className="h-3.5 w-3.5" />}
                        >
                          {item.attendancePct}% presença
                        </Badge>
                      </div>

                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                        {getDisplayName(item.student)}
                      </h3>

                      <div className="rounded-xl bg-white p-3 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-xs space-y-1.5">
                        <p className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                          <Phone className="h-3.5 w-3.5 text-primary-700 dark:text-primary-400" aria-hidden="true" />
                          <span>Contato Aluno(a): {item.student.phone}</span>
                        </p>
                        {item.guardian ? (
                          <p className="text-slate-600 dark:text-slate-300">
                            <strong>Responsável ({item.relationship}):</strong>{' '}
                            {getDisplayName(item.guardian)} • {item.guardian.phone}
                          </p>
                        ) : (
                          <p className="text-slate-500 dark:text-slate-400">
                            Maior de 18 anos / Sem responsável vinculado
                          </p>
                        )}
                      </div>

                      {item.student.generalNotes && (
                        <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                          "{item.student.generalNotes}"
                        </p>
                      )}
                    </div>

                    <Link
                      to={`/coordenacao/alunos?studentId=${item.student.id}`}
                      className="inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-white border-2 border-primary-700 px-3.5 py-2 text-sm font-extrabold text-primary-900 hover:bg-primary-50 dark:bg-slate-900 dark:border-primary-500 dark:text-primary-200 transition-colors"
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      <span>Abrir Ficha e Contato Familiar</span>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <CalloutAlert
                variant="success"
                title="Todos os estudantes ativos estão com frequência igual ou superior a 75%!"
              >
                Nenhum estudante encontra-se em faixa crítica de presença neste momento.
              </CalloutAlert>
            )}
          </Card>

          {/* GRÁFICO "DA INFORMAÇÃO À AÇÃO" (Média por Área do ENEM 0-1000 + Resumo Automático) */}
          <Card
            as="section"
            title="Da Informação à Ação — Média Geral do Cursinho por Área do ENEM (0 a 1.000)"
            subtitle="Diagnóstico pedagógico consolidado para orientar aulões de revisão e plantões de monitoria."
            headerAction={
              <Badge variant="secondary" icon={<TrendingUp className="h-4 w-4" />}>
                Escala Oficial INEP/ENEM
              </Badge>
            }
          >
            <div className="space-y-6">
              {/* Resumo Textual Automático */}
              <CalloutAlert
                variant="info"
                title="Síntese Automática para Tomada de Decisão Pedagógica"
              >
                <ul className="list-disc list-inside space-y-1 text-sm sm:text-base">
                  <li>
                    <strong>Maior Evolução no Semestre:</strong> A área de{' '}
                    <strong>{enemAreasAnalytics.highestEvolution.label}</strong> alcançou{' '}
                    <strong>{formatEnemScore(enemAreasAnalytics.highestEvolution.currentAvg)}</strong>{' '}
                    (crescimento de{' '}
                    <strong>+{enemAreasAnalytics.highestEvolution.delta} pontos</strong> desde o 1º
                    Simulado).
                  </li>
                  <li>
                    <strong>Área que Precisa de Reforço Prioritário:</strong>{' '}
                    <strong>{enemAreasAnalytics.needsReinforcement.label}</strong> apresenta a menor
                    média atual (
                    <strong>
                      {formatEnemScore(enemAreasAnalytics.needsReinforcement.currentAvg)}
                    </strong>
                    ). Sugestão de ação: organizar um aulão prático de resolução de questões fáceis e
                    médias no próximo sábado.
                  </li>
                </ul>
              </CalloutAlert>

              {/* Gráfico de Barras Horizontais Comparativas (0 a 1000) */}
              <div className="space-y-4">
                {enemAreasAnalytics.areas.map((area) => {
                  const pct = Math.max(
                    10,
                    Math.min(100, Math.round((area.currentAvg / 1000) * 100))
                  );
                  const isLowest =
                    area.key === enemAreasAnalytics.needsReinforcement.key;

                  return (
                    <div
                      key={area.key}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-extrabold text-slate-900 dark:text-white">
                            {area.label}
                          </span>
                          {isLowest && (
                            <Badge variant="warning">Foco de Reforço Recomendado</Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                            {formatEnemScore(area.currentAvg)}
                          </span>
                          <Badge variant={area.delta >= 0 ? 'success' : 'warning'}>
                            {area.delta >= 0 ? `+${area.delta} pts` : `${area.delta} pts`} no
                            semestre
                          </Badge>
                        </div>
                      </div>

                      <div
                        role="progressbar"
                        aria-label={`${area.label}: média ${area.currentAvg} de 1000 pontos`}
                        aria-valuenow={area.currentAvg}
                        aria-valuemin={0}
                        aria-valuemax={1000}
                        className="h-4 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
                      >
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isLowest
                              ? 'bg-warning-700 dark:bg-amber-500'
                              : 'bg-secondary-700 dark:bg-secondary-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="mt-1.5 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>0 pts</span>
                        <span>1º Simulado: {area.firstAvg} pts</span>
                        <span>1.000 pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <CoordinatorOperationsSection />
      )}
    </div>
  );
};
