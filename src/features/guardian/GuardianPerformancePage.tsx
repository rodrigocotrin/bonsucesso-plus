import React, { useMemo } from 'react';
import {
  Award,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import {
  Badge,
  Card,
  MetricCard,
  ProgressBarGroup,
} from '../../components/ui';
import { useSession } from '../../contexts/SessionContext';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import {
  formatDateBR,
  formatEnemScore,
} from '../../utils/formatters';
import {
  GuardianCoordinationSupportBox,
  GuardianStudentSelectorBar,
} from './GuardianSharedComponents';

export const GuardianPerformancePage: React.FC = () => {
  const { selectedStudentForGuardian, linkedStudentsForGuardian } = useSession();
  const { db } = useMockDatabase();

  const student = selectedStudentForGuardian;

  const studentSimulados = useMemo(() => {
    if (!student) return [];
    return db.grades
      .filter((g) => g.studentPersonId === student.id)
      .map((grade) => {
        const assessment = db.assessments.find((a) => a.id === grade.assessmentId);
        return { grade, assessment };
      })
      .filter(
        (item): item is { grade: (typeof db.grades)[0]; assessment: NonNullable<typeof item.assessment> } =>
          Boolean(item.assessment)
      )
      .sort((a, b) => a.assessment.date.localeCompare(b.assessment.date));
  }, [db.grades, db.assessments, student]);

  const latestSimulado =
    studentSimulados.length > 0 ? studentSimulados[studentSimulados.length - 1] : null;
  const previousSimulado =
    studentSimulados.length >= 2 ? studentSimulados[studentSimulados.length - 2] : null;
  const firstSimulado = studentSimulados.length > 0 ? studentSimulados[0] : null;

  const overallScore = latestSimulado?.grade.score ?? 0;
  const redacaoScore = latestSimulado?.grade.areaScores?.redacao ?? 0;
  const deltaFromPrevious = previousSimulado
    ? overallScore - previousSimulado.grade.score
    : 0;
  const deltaFromFirst = firstSimulado
    ? overallScore - firstSimulado.grade.score
    : 0;

  // Transforma as 5 áreas do ENEM do último simulado em itens claros para o ProgressBarGroup reutilizável
  const areaItemsForProgressBar = useMemo(() => {
    const scores = latestSimulado?.grade.areaScores ?? {
      redacao: 860,
      humanas: 740,
      linguagens: 680,
      natureza: 660,
      matematica: 640,
    };

    return [
      {
        id: 'area-red',
        label: '1. Redação (Texto Dissertativo)',
        sublabel: 'Capacidade de escrever um texto claro sobre um tema importante para o país (vale até 1.000 pontos).',
        value: Math.round((scores.redacao / 1000) * 100),
        max: 100,
        unit: '%',
        rawScoreText: formatEnemScore(scores.redacao),
      },
      {
        id: 'area-hum',
        label: '2. Ciências Humanas (História e Geografia)',
        sublabel: 'Questões sobre História do Brasil, Geografia, atualidades e cidadania (vale até 1.000 pontos).',
        value: Math.round((scores.humanas / 1000) * 100),
        max: 100,
        unit: '%',
        rawScoreText: formatEnemScore(scores.humanas),
      },
      {
        id: 'area-lin',
        label: '3. Linguagens (Português e Interpretação de Texto)',
        sublabel: 'Leitura e interpretação de textos, notícias, poemas e literatura (vale até 1.000 pontos).',
        value: Math.round((scores.linguagens / 1000) * 100),
        max: 100,
        unit: '%',
        rawScoreText: formatEnemScore(scores.linguagens),
      },
      {
        id: 'area-nat',
        label: '4. Ciências da Natureza (Biologia, Química e Física)',
        sublabel: 'Questões práticas sobre saúde, meio ambiente, energia e ciências (vale até 1.000 pontos).',
        value: Math.round((scores.natureza / 1000) * 100),
        max: 100,
        unit: '%',
        rawScoreText: formatEnemScore(scores.natureza),
      },
      {
        id: 'area-mat',
        label: '5. Matemática',
        sublabel: 'Cálculos do dia a dia, porcentagem, gráficos e geometria (vale até 1.000 pontos).',
        value: Math.round((scores.matematica / 1000) * 100),
        max: 100,
        unit: '%',
        rawScoreText: formatEnemScore(scores.matematica),
      },
    ];
  }, [latestSimulado]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Cabeçalho enxuto (Regra 2) */}
      <h1>Avaliações</h1>

      <GuardianStudentSelectorBar />

      {student && linkedStudentsForGuardian.length > 0 && (
        <>
          {latestSimulado && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <MetricCard
                title="Último Simulado ENEM"
                value={overallScore}
                scale="enem"
                accentColor="assess"
                trend={{
                  direction: deltaFromPrevious >= 0 ? 'up' : 'down',
                  label: `+${deltaFromPrevious} pts vs. anterior (+${deltaFromFirst} no semestre)`,
                  variant: 'success',
                }}
              />

              <MetricCard
                title="Nota de Redação"
                value={redacaoScore}
                scale="enem"
                accentColor="academic"
                subtitle="Escala oficial 0–1000"
              />
            </div>
          )}

          {/* Notas por Área do ENEM explicadas com vocabulário cotidiano */}
          <Card
            as="section"
            title="Notas Detalhadas nas 5 Áreas da Prova"
            subtitle="Esta seção mostra a pontuação em cada grupo de matérias cobradas no ENEM (de 0 a 1.000 pontos)."
          >
            <div className="space-y-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 flex items-start gap-2.5">
                <HelpCircle className="h-5 w-5 text-primary-700 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Quanto mais preenchida estiver a barra abaixo, mais próximo de{' '}
                  <strong>1.000 pontos</strong> o(a) estudante chegou naquela matéria.
                </span>
              </div>

              <ProgressBarGroup
                items={areaItemsForProgressBar.map((item) => ({
                  id: item.id,
                  label: `${item.label} — Nota: ${item.rawScoreText}`,
                  sublabel: item.sublabel,
                  value: item.value,
                  max: 100,
                  unit: '%',
                  thresholdPercentage: 60, // 600 pontos como referência base no ENEM
                }))}
                showThresholdMarker={false}
              />
            </div>
          </Card>

          {/* Histórico de Todos os Simulados Realizados no Semestre */}
          <Card
            as="section"
            title="Histórico de Todos os Simulados Realizados"
            subtitle="Esta seção lista todas as provas de treino que o(a) estudante já fez, da mais recente para a mais antiga, com o comentário dos professores."
          >
            <div className="space-y-4">
              {[...studentSimulados].reverse().map(({ assessment, grade }, idx) => (
                <article
                  key={grade.id}
                  className="rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-extrabold text-primary-900">
                      Realizado em {formatDateBR(assessment.date)}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {idx === 0 && (
                        <Badge variant="primary" icon={<TrendingUp className="h-4 w-4" />}>
                          Mais recente
                        </Badge>
                      )}
                      <Badge variant="secondary" icon={<Award className="h-4 w-4" />}>
                        Nota Geral: {formatEnemScore(grade.score)}
                      </Badge>
                    </div>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900">
                    {assessment.title}
                  </h3>

                  <p className="text-base text-slate-700">
                    Nota da Redação nesta prova:{' '}
                    <strong>{formatEnemScore(grade.areaScores?.redacao ?? 0)}</strong> (de 1.000
                    pontos).
                  </p>

                  {grade.feedback && (
                    <div className="rounded-xl border border-primary-200 bg-white p-3.5 text-base text-slate-800">
                      <span className="block text-xs font-extrabold uppercase tracking-wider text-primary-900 mb-1">
                        Recado dos Professores sobre esta prova:
                      </span>
                      "{grade.feedback}"
                    </div>
                  )}
                </article>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Canal de Apoio Fixo */}
      <GuardianCoordinationSupportBox />
    </div>
  );
};
