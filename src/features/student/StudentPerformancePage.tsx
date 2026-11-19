import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BookOpen,
  HeartHandshake,
  TrendingUp,
} from 'lucide-react';
import {
  Badge,
  CalloutAlert,
  Card,
  MetricCard,
  ProgressBarGroup,
  Select,
} from '../../components/ui';
import { useSession } from '../../contexts/SessionContext';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import {
  evaluateAttendanceStatus,
  formatDateBR,
  formatEnemScore,
} from '../../utils/formatters';
import { STUDENT_MONTHLY_ATTENDANCE_HISTORY } from './studentData';

interface EnemAreaDetail {
  key: 'linguagens' | 'humanas' | 'natureza' | 'matematica' | 'redacao';
  label: string;
  recommendedSubjectFilter: string;
  score: number;
  previousScore?: number;
}

export const StudentPerformancePage: React.FC = () => {
  const { currentPerson } = useSession();
  const { db, getStudentAttendancePercentage } = useMockDatabase();

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(
    db.academicPeriods.find((p) => p.isCurrent)?.id ?? 'per-2026-2'
  );
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  if (!currentPerson) return null;

  // Simulados e Notas do Aluno ordenados cronologicamente
  const studentSimuladosHistory = useMemo(() => {
    const studentGrades = db.grades.filter(
      (g) => g.studentPersonId === currentPerson.id
    );

    const joined = studentGrades
      .map((grade) => {
        const assessment = db.assessments.find((a) => a.id === grade.assessmentId);
        return {
          grade,
          assessment,
        };
      })
      .filter(
        (item): item is { grade: (typeof studentGrades)[0]; assessment: NonNullable<typeof item.assessment> } =>
          Boolean(item.assessment)
      )
      .sort((a, b) => a.assessment.date.localeCompare(b.assessment.date));

    // Se o usuário selecionar o 1º semestre e só houver notas mockadas no 2º, exibe dados comparativos do 1º semestre
    if (selectedPeriodId === 'per-2026-1') {
      return joined.map((item, idx) => ({
        ...item,
        assessment: {
          ...item.assessment,
          title: `${idx + 1}º Simulado Diagnóstico (1º Semestre)`,
        },
        grade: {
          ...item.grade,
          score: Math.max(450, item.grade.score - 55),
          areaScores: item.grade.areaScores
            ? {
                linguagens: item.grade.areaScores.linguagens - 40,
                humanas: item.grade.areaScores.humanas - 50,
                natureza: item.grade.areaScores.natureza - 45,
                matematica: item.grade.areaScores.matematica - 50,
                redacao: item.grade.areaScores.redacao - 80,
              }
            : undefined,
        },
      }));
    }

    return joined;
  }, [db.grades, db.assessments, currentPerson.id, selectedPeriodId]);

  const latestSimulado =
    studentSimuladosHistory[studentSimuladosHistory.length - 1] ?? null;
  const previousSimulado =
    studentSimuladosHistory.length >= 2
      ? studentSimuladosHistory[studentSimuladosHistory.length - 2]
      : null;
  const firstSimulado = studentSimuladosHistory[0] ?? null;

  const latestOverallScore = latestSimulado?.grade.score ?? 716;
  const deltaFromPrevious = previousSimulado
    ? latestOverallScore - previousSimulado.grade.score
    : 0;
  const deltaFromFirst = firstSimulado
    ? latestOverallScore - firstSimulado.grade.score
    : 0;

  const latestRedacaoScore =
    latestSimulado?.grade.areaScores?.redacao ?? 860;
  const previousRedacaoScore =
    previousSimulado?.grade.areaScores?.redacao ?? latestRedacaoScore;
  const redacaoDelta = latestRedacaoScore - previousRedacaoScore;

  // Frequência Atual + Presenças e Faltas
  const studentAttendances = useMemo(
    () => db.attendances.filter((a) => a.studentPersonId === currentPerson.id),
    [db.attendances, currentPerson.id]
  );
  const totalPresences = studentAttendances.filter(
    (a) => a.presence === 'presente' || a.presence === 'justificada'
  ).length;
  const totalAbsences = studentAttendances.filter(
    (a) => a.presence === 'falta'
  ).length;
  const attendancePercentage =
    selectedPeriodId === 'per-2026-1'
      ? 90
      : getStudentAttendancePercentage(currentPerson.id);
  const attendanceEval = evaluateAttendanceStatus(attendancePercentage);

  // Notas nas 5 áreas do ENEM
  const fiveAreasBreakdown = useMemo<EnemAreaDetail[]>(() => {
    const scores = latestSimulado?.grade.areaScores ?? {
      linguagens: 680,
      humanas: 740,
      natureza: 660,
      matematica: 640,
      redacao: 860,
    };
    const prevScores = previousSimulado?.grade.areaScores;

    return [
      {
        key: 'linguagens',
        label: 'Linguagens, Códigos e suas Tecnologias',
        recommendedSubjectFilter: 'Português',
        score: scores.linguagens,
        previousScore: prevScores?.linguagens,
      },
      {
        key: 'humanas',
        label: 'Ciências Humanas e suas Tecnologias',
        recommendedSubjectFilter: 'História',
        score: scores.humanas,
        previousScore: prevScores?.humanas,
      },
      {
        key: 'natureza',
        label: 'Ciências da Natureza e suas Tecnologias',
        recommendedSubjectFilter: 'Biologia',
        score: scores.natureza,
        previousScore: prevScores?.natureza,
      },
      {
        key: 'matematica',
        label: 'Matemática e suas Tecnologias',
        recommendedSubjectFilter: 'Matemática',
        score: scores.matematica,
        previousScore: prevScores?.matematica,
      },
      {
        key: 'redacao',
        label: 'Redação Dissertativo-Argumentativa',
        recommendedSubjectFilter: 'Redação',
        score: scores.redacao,
        previousScore: prevScores?.redacao,
      },
    ];
  }, [latestSimulado, previousSimulado]);

  // Duas áreas de menor pontuação para o Card de Recomendação Pedagógica Dinâmica
  const twoLowestAreas = useMemo(() => {
    return [...fiveAreasBreakdown]
      .sort((a, b) => a.score - b.score)
      .slice(0, 2);
  }, [fiveAreasBreakdown]);

  // Assiduidade mês a mês (ProgressBarGroup)
  const monthlyProgressItems = useMemo(() => {
    const list =
      STUDENT_MONTHLY_ATTENDANCE_HISTORY[selectedPeriodId] ??
      STUDENT_MONTHLY_ATTENDANCE_HISTORY['per-2026-2'];

    return list.map((m) => ({
      id: m.id,
      label: m.monthLabel,
      sublabel: `${m.presentClasses} presenças em ${m.totalClasses} aulas ministradas (${
        m.totalClasses - m.presentClasses
      } faltas)`,
      value: m.percentage,
      max: 100,
      unit: '%',
      thresholdPercentage: 75,
    }));
  }, [selectedPeriodId]);

  // Coordenadas do Gráfico SVG Responsivo (Escala 0 a 1000)
  const chartPoints = useMemo(() => {
    const count = studentSimuladosHistory.length;
    if (count === 0) return [];
    const svgWidth = 640;
    const svgHeight = 230;
    const padX = 70;
    const padTop = 30;
    const padBottom = 45;
    const usableW = svgWidth - padX * 2;
    const usableH = svgHeight - padTop - padBottom;

    return studentSimuladosHistory.map((item, idx) => {
      const x =
        count === 1 ? svgWidth / 2 : padX + (idx / (count - 1)) * usableW;
      // Escala de 400 a 1000 para visualização clara das diferenças mantendo referência 0-1000
      const clampedScore = Math.max(0, Math.min(1000, item.grade.score));
      const y = padTop + usableH - (clampedScore / 1000) * usableH;
      return {
        x,
        y,
        score: item.grade.score,
        redacao: item.grade.areaScores?.redacao ?? 0,
        title: item.assessment.title,
        shortLabel: `${idx + 1}º Simulado`,
        date: formatDateBR(item.assessment.date),
      };
    });
  }, [studentSimuladosHistory]);

  const polylinePointsString = chartPoints.map((pt) => `${pt.x},${pt.y}`).join(' ');

  return (
    <div className="space-y-8">
      {/* Cabeçalho enxuto + Seletor de Período alinhado pela base (Regra 2) */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1>Meu Desempenho</h1>

        <div className="w-60">
          <Select
            label="Período"
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            options={db.academicPeriods.map((period) => ({
              value: period.id,
              label: period.name,
            }))}
          />
        </div>
      </div>

      {/* 1. OS 3 KPI CARDS ULTRA-LIMPOS (Regra 2) */}
      <section aria-label="Indicadores principais">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricCard
            title="Último Simulado ENEM"
            value={latestOverallScore}
            scale="enem"
            accentColor="assess"
            trend={{
              direction: deltaFromPrevious >= 0 ? 'up' : 'down',
              label: `${deltaFromPrevious >= 0 ? '+' : ''}${deltaFromPrevious} pts vs. anterior`,
              variant: deltaFromPrevious >= 0 ? 'success' : 'warning',
            }}
          />

          <MetricCard
            title="Nota de Redação"
            value={latestRedacaoScore}
            scale="enem"
            accentColor="academic"
            trend={{
              direction: redacaoDelta >= 0 ? 'up' : 'down',
              label: `${redacaoDelta >= 0 ? '+' : ''}${redacaoDelta} pts na última correção`,
              variant: 'success',
            }}
          />

          <MetricCard
            title="Frequência Acumulada"
            value={attendancePercentage}
            scale="percentage"
            accentColor={attendanceEval.status === 'critical' ? 'critical' : 'progress'}
            statusBadge={{
              label: `${totalPresences} presenças • ${totalAbsences} faltas`,
              variant: attendanceEval.status === 'critical' ? 'danger' : 'success',
            }}
          />
        </div>
      </section>

      {/* 2. CARD DE RECOMENDAÇÃO PEDAGÓGICA (Borda neutra, sem caixa pesada) */}
      <Card
        as="section"
        title="Recomendação da Semana"
        headerAction={<Badge variant="academic">Foco de Estudo</Badge>}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2 max-w-3xl">
            <p className="text-sm text-ink">
              Priorize 2 blocos de revisão nesta semana nas áreas com maior margem de evolução:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {twoLowestAreas.map((area, index) => (
                <div
                  key={area.key}
                  className="rounded-xl border border-primary-300 bg-white p-3.5"
                >
                  <span className="text-xs font-extrabold uppercase tracking-wider text-primary-800">
                    Prioridade {index + 1} • {formatEnemScore(area.score)}
                  </span>
                  <p className="mt-0.5 text-base font-bold text-slate-900">
                    {area.label}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Foco sugerido: resolver listas comentadas das questões fáceis e médias de{' '}
                    <strong>{area.recommendedSubjectFilter}</strong>.
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2.5 shrink-0">
            <Link
              to={`/aluno/materias?disciplina=${encodeURIComponent(
                twoLowestAreas[0]?.recommendedSubjectFilter ?? 'Matemática'
              )}`}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary-700 px-5 py-3 text-base font-bold text-white shadow-xs hover:bg-primary-800 transition-colors"
            >
              <BookOpen className="h-5 w-5" aria-hidden="true" />
              <span>
                Estudar {twoLowestAreas[0]?.recommendedSubjectFilter ?? 'Matemática'} em Meus
                Materiais
              </span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            <Link
              to="/aluno/materias"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100"
            >
              <span>Ver todos os materiais de revisão</span>
            </Link>
          </div>
        </div>
      </Card>

      {/* 3. GRÁFICO ACESSÍVEL DE EVOLUÇÃO NOS SIMULADOS (0 A 1.000) + TABELA ALTERNATIVA */}
      <Card
        as="section"
        title="Evolução da Sua Média Geral nos Simulados (Escala 0 a 1.000)"
        subtitle="Acompanhe seu crescimento simulado a simulado. Passe o mouse ou toque nos pontos para ver os detalhes."
        headerAction={
          <Badge variant="success" icon={<TrendingUp className="h-4 w-4" />}>
            +{deltaFromFirst} pontos de evolução
          </Badge>
        }
      >
        <div className="space-y-6">
          {/* Gráfico SVG Responsivo */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox="0 0 640 230"
              role="img"
              aria-label="Gráfico de linha mostrando a evolução das notas nos 3 simulados na escala de 0 a 1000 pontos"
              className="w-full min-w-[480px] h-auto select-none"
            >
              {/* Linhas horizontais de referência (0, 500, 750, 1000) */}
              {[0, 500, 750, 1000].map((refScore) => {
                const y = 30 + 155 - (refScore / 1000) * 155;
                return (
                  <g key={refScore}>
                    <line
                      x1={60}
                      y1={y}
                      x2={580}
                      y2={y}
                      stroke="currentColor"
                      className="text-slate-200"
                      strokeDasharray={refScore === 750 ? '4 4' : undefined}
                      strokeWidth={1.5}
                    />
                    <text
                      x={52}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-slate-500 text-[11px] font-semibold"
                    >
                      {refScore}
                    </text>
                  </g>
                );
              })}

              {/* Linha de conexão da evolução */}
              {chartPoints.length > 1 && (
                <polyline
                  fill="none"
                  stroke="var(--progress-fg)"
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={polylinePointsString}
                />
              )}

              {/* Pontos interativos de cada Simulado */}
              {chartPoints.map((pt, idx) => {
                const isHovered = hoveredPointIndex === idx;
                return (
                  <g
                    key={idx}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPointIndex(idx)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                    onClick={() => setHoveredPointIndex(idx)}
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 9 : 7}
                      className="fill-primary-700 stroke-white"
                      strokeWidth={3}
                    />
                    {/* Rótulo da Nota acima do ponto */}
                    <rect
                      x={pt.x - 34}
                      y={pt.y - 34}
                      width={68}
                      height={22}
                      rx={6}
                      className="fill-slate-900"
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 19}
                      textAnchor="middle"
                      className="fill-white text-[12px] font-extrabold"
                    >
                      {pt.score} pts
                    </text>

                    {/* Rótulo do Eixo X */}
                    <text
                      x={pt.x}
                      y={205}
                      textAnchor="middle"
                      className="fill-slate-800 text-[12px] font-bold"
                    >
                      {pt.shortLabel}
                    </text>
                    <text
                      x={pt.x}
                      y={220}
                      textAnchor="middle"
                      className="fill-slate-500 text-[10px]"
                    >
                      {pt.date}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Tabela Resumo Acessível do Gráfico (WCAG 2.1) */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Tabela acessível com as notas de cada simulado realizado
              </caption>
              <thead className="bg-slate-100 text-slate-800">
                <tr>
                  <th scope="col" className="px-4 py-3 font-bold">
                    Simulado
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    Data
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    Média Geral (0-1000)
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    Redação (0-1000)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {studentSimuladosHistory.map(({ assessment, grade }) => (
                  <tr
                    key={grade.id}
                    className="bg-white hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {assessment.title}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDateBR(assessment.date)}
                    </td>
                    <td className="px-4 py-3 font-extrabold text-primary-800">
                      {formatEnemScore(grade.score)}
                    </td>
                    <td className="px-4 py-3 font-bold text-secondary-800">
                      {formatEnemScore(grade.areaScores?.redacao ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* 4. DETALHAMENTO DAS NOTAS NAS 5 ÁREAS DO ENEM + HISTÓRICO COM COMENTÁRIOS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        <div className="lg:col-span-7">
          <Card
            as="section"
            title="Desempenho nas 5 Áreas do ENEM (Último Simulado)"
            subtitle="Pontuação de 0 a 1.000 em cada área de conhecimento avaliada na prova."
          >
            <div className="space-y-4">
              {fiveAreasBreakdown.map((area) => {
                const areaDelta =
                  area.previousScore !== undefined ? area.score - area.previousScore : 0;
                const widthPercent = Math.max(
                  10,
                  Math.min(100, Math.round((area.score / 1000) * 100))
                );

                return (
                  <div
                    key={area.key}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="text-base font-bold text-slate-900">
                        {area.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-extrabold text-slate-900">
                          {formatEnemScore(area.score)}
                        </span>
                        {areaDelta !== 0 && (
                          <Badge variant={areaDelta > 0 ? 'success' : 'warning'}>
                            {areaDelta > 0 ? `+${areaDelta} pts` : `${areaDelta} pts`}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div
                      role="progressbar"
                      aria-label={`${area.label}: ${area.score} de 1000 pontos`}
                      aria-valuenow={area.score}
                      aria-valuemin={0}
                      aria-valuemax={1000}
                      className="h-3.5 w-full overflow-hidden rounded-full bg-slate-200"
                    >
                      <div
                        className="h-full rounded-full bg-secondary-700 transition-all duration-300"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Histórico dos Simulados Anteriores com Devolutiva */}
        <div className="lg:col-span-5">
          <Card
            as="section"
            title="Histórico e Comentários dos Professores"
            subtitle="Observações pedagógicas deixadas na correção dos seus simulados."
          >
            <div className="space-y-4">
              {[...studentSimuladosHistory].reverse().map(({ assessment, grade }) => (
                <div
                  key={grade.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-primary-800">
                      {formatDateBR(assessment.date)}
                    </span>
                    <Badge variant="secondary" icon={<Award className="h-4 w-4" />}>
                      Média: {formatEnemScore(grade.score)}
                    </Badge>
                  </div>

                  <h4 className="text-base font-bold text-slate-900">
                    {assessment.title}
                  </h4>

                  {grade.feedback && (
                    <p className="text-sm text-slate-700 italic bg-white p-3 rounded-lg border border-slate-200/80">
                      "{grade.feedback}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* 5. ASSIDUIDADE MÊS A MÊS (ProgressBarGroup) + ALERTA ACOLHEDOR SE < 75% */}
      <Card
        as="section"
        title="Sua Frequência Mês a Mês"
        subtitle="Recomendamos manter pelo menos 75% de presença para acompanhar todos os conteúdos cobrados no ENEM."
      >
        <div className="space-y-5">
          {attendanceEval.status === 'critical' && (
            <CalloutAlert
              variant="warning"
              title="Vamos cuidar juntos da sua presença neste semestre?"
            >
              Notamos que nos últimos meses sua frequência ficou abaixo de 75%. Sabemos que conciliar
              trabalho, transporte e estudos não é fácil. Procure a coordenação ou seus professores
              voluntários: podemos organizar um plano de leitura e disponibilizar as listas das aulas
              em que você não pôde estar presente.
            </CalloutAlert>
          )}

          <ProgressBarGroup
            items={monthlyProgressItems}
            showThresholdMarker
            defaultThreshold={75}
          />

          <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
            <HeartHandshake className="h-4 w-4 text-primary-700 shrink-0" aria-hidden="true" />
            <span>
              Faltou por motivo de saúde ou trabalho? Apresente sua justificativa na secretaria do
              Cursinho Bonsucesso para abono pedagógico.
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
