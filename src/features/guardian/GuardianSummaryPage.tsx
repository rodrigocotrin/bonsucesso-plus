import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  Clock,
  FilePenLine,
  GraduationCap,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import {
  Badge,
  CalloutAlert,
  Card,
  MetricCard,
} from '../../components/ui';
import { useSession } from '../../contexts/SessionContext';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import {
  formatDateBR,
  formatEnemScore,
  getDisplayName,
} from '../../utils/formatters';
import {
  GuardianCoordinationSupportBox,
  GuardianStudentSelectorBar,
} from './GuardianSharedComponents';
import { GUARDIAN_NOTICES_AND_MEETINGS } from './guardianData';

export const GuardianSummaryPage: React.FC = () => {
  const {
    currentPerson,
    linkedStudentsForGuardian,
    selectedStudentForGuardian,
  } = useSession();
  const { db, getStudentAttendancePercentage } = useMockDatabase();

  const student = selectedStudentForGuardian;

  const studentClassRoom = useMemo(() => {
    if (!student) return null;
    const enrollment = db.enrollments.find(
      (e) => e.studentPersonId === student.id && e.status === 'ativa'
    );
    return db.classRooms.find((c) => c.id === enrollment?.classRoomId) ?? db.classRooms[0];
  }, [db.enrollments, db.classRooms, student]);

  // Cálculos claros de Presença e Faltas
  const attendanceStats = useMemo(() => {
    if (!student) {
      return {
        percentage: 100,
        presentCount: 0,
        justifiedCount: 0,
        absentCount: 0,
        totalClasses: 0,
        lastAttendedLessonText: 'Nenhuma aula registrada ainda',
      };
    }

    const records = db.attendances.filter((a) => a.studentPersonId === student.id);
    const presentCount = records.filter((a) => a.presence === 'presente').length;
    const justifiedCount = records.filter((a) => a.presence === 'justificada').length;
    const absentCount = records.filter((a) => a.presence === 'falta').length;
    const totalClasses = records.length;
    const percentage = getStudentAttendancePercentage(student.id);

    // Encontra a última aula em que o estudante esteve presente
    const attendedLessonIds = records
      .filter((a) => a.presence === 'presente' || a.presence === 'justificada')
      .map((a) => a.lessonId);

    const lastLesson = db.lessons
      .filter((l) => attendedLessonIds.includes(l.id))
      .sort((a, b) => b.date.localeCompare(a.date))[0];

    const lastSubject = lastLesson
      ? db.subjects.find((s) => s.id === lastLesson.subjectId)?.name
      : undefined;

    const lastAttendedLessonText = lastLesson
      ? `${lastSubject ?? 'Aula'} em ${formatDateBR(lastLesson.date)} (${lastLesson.topic})`
      : 'Sem registro recente';

    return {
      percentage,
      presentCount: presentCount + justifiedCount,
      justifiedCount,
      absentCount,
      totalClasses,
      lastAttendedLessonText,
    };
  }, [db.attendances, db.lessons, db.subjects, getStudentAttendancePercentage, student]);

  // Cálculos claros do Último Simulado ENEM
  const simuladoSummary = useMemo(() => {
    if (!student) return null;
    const studentGrades = db.grades
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

    if (studentGrades.length === 0) return null;

    const latest = studentGrades[studentGrades.length - 1];
    const previous = studentGrades.length >= 2 ? studentGrades[studentGrades.length - 2] : null;
    const first = studentGrades[0];

    const deltaFromPrevious = previous ? latest.grade.score - previous.grade.score : 0;
    const deltaFromFirst = latest.grade.score - first.grade.score;

    return {
      latestTitle: latest.assessment.title,
      latestDate: formatDateBR(latest.assessment.date),
      overallScore: latest.grade.score,
      redacaoScore: latest.grade.areaScores?.redacao ?? 0,
      deltaFromPrevious,
      deltaFromFirst,
      totalSimuladosDone: studentGrades.length,
    };
  }, [db.grades, db.assessments, student]);

  if (!currentPerson) return null;

  const guardianGreetingName = getDisplayName(currentPerson);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Cabeçalho enxuto (Regra 2) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1>Acompanhamento</h1>
        <span className="text-xs text-ink-muted">Responsável: {guardianGreetingName}</span>
      </div>

      <GuardianStudentSelectorBar />

      {student && linkedStudentsForGuardian.length > 0 && (
        <>
          {/* KPIs Ultra-Limpos */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard
              title="Frequência nas Aulas"
              value={attendanceStats.percentage}
              scale="percentage"
              accentColor={attendanceStats.percentage < 75 ? 'assess' : 'progress'}
              statusBadge={{
                label: `${attendanceStats.presentCount} presenças • ${attendanceStats.absentCount} faltas`,
                variant: attendanceStats.percentage < 75 ? 'warning' : 'success',
              }}
            />

            <MetricCard
              title="Último Simulado ENEM"
              value={simuladoSummary?.overallScore ?? 0}
              scale="enem"
              accentColor="assess"
              trend={
                simuladoSummary
                  ? {
                      direction: simuladoSummary.deltaFromPrevious >= 0 ? 'up' : 'down',
                      label: `+${simuladoSummary.deltaFromFirst} pts no semestre`,
                      variant: 'success',
                    }
                  : undefined
              }
            />

            <MetricCard
              title="Redação ENEM"
              value={simuladoSummary?.redacaoScore ?? 0}
              scale="enem"
              accentColor="academic"
              subtitle={simuladoSummary?.latestTitle ?? 'Última correção'}
            />
          </div>

          <Card
            as="section"
            title="Presença nas Aulas"
            headerAction={
              <Link
                to="/responsavel/frequencia"
                className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink"
              >
                <span>Ver histórico</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            }
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-ink">
                  Última aula frequentada: {attendanceStats.lastAttendedLessonText}
                </p>
                <p className="text-xs text-ink-muted">
                  Horário da turma: {studentClassRoom?.scheduleSummary}
                </p>
              </div>
              <Badge variant={attendanceStats.percentage < 75 ? 'assess' : 'progress'}>
                {attendanceStats.percentage < 75 ? 'Abaixo de 75%' : 'Frequência em dia'}
              </Badge>
            </div>
          </Card>

          {/* 4. RESUMO DO ÚLTIMO SIMULADO ENEM (Explicado de forma simples) */}
          <Card
            as="section"
            title="Resultado no Último Simulado do ENEM"
            subtitle="Esta seção mostra a nota do(a) estudante no último teste de treino para o ENEM (as notas vão de 0 até 1.000 pontos)."
          >
            {simuladoSummary ? (
              <div className="space-y-5">
                <CalloutAlert
                  variant="success"
                  title={
                    simuladoSummary.deltaFromPrevious > 0
                      ? `Boa notícia: subiu +${simuladoSummary.deltaFromPrevious} pontos em relação ao simulado anterior!`
                      : 'Participação registrada com sucesso no simulado!'
                  }
                >
                  No <strong>{simuladoSummary.latestTitle}</strong> (realizado em{' '}
                  {simuladoSummary.latestDate}), {getDisplayName(student).split(' ')[0]} alcançou{' '}
                  <strong>{formatEnemScore(simuladoSummary.overallScore)}</strong> na média geral e{' '}
                  <strong>{formatEnemScore(simuladoSummary.redacaoScore)}</strong> na Redação. Desde
                  o começo do semestre, já evoluiu{' '}
                  <strong>+{simuladoSummary.deltaFromFirst} pontos</strong>!
                </CalloutAlert>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <MetricCard
                    title="Nota Geral no Simulado (0 a 1.000)"
                    value={simuladoSummary.overallScore}
                    scale="enem"
                    accentColor="secondary"
                    icon={<GraduationCap className="h-6 w-6" />}
                    trend={{
                      direction: 'up',
                      label: `Subiu +${simuladoSummary.deltaFromPrevious} pontos desde o último teste`,
                      variant: 'success',
                    }}
                    subtitle="Soma das notas de Português, Matemática, História/Geografia, Ciências e Redação."
                  />

                  <MetricCard
                    title="Nota da Redação (0 a 1.000)"
                    value={simuladoSummary.redacaoScore}
                    scale="enem"
                    accentColor="primary"
                    icon={<FilePenLine className="h-6 w-6" />}
                    statusBadge={{
                      label: 'Ótimo resultado',
                      variant: 'success',
                    }}
                    subtitle="A redação vale até 1.000 pontos e tem grande peso para entrar na universidade."
                  />
                </div>

                <Link
                  to="/responsavel/simulados"
                  className="inline-flex w-full min-h-[52px] items-center justify-center gap-2.5 rounded-xl border-2 border-secondary-700 bg-secondary-50/70 px-6 py-3 text-base sm:text-lg font-extrabold text-secondary-950 hover:bg-secondary-100 transition-colors"
                >
                  <TrendingUp className="h-5 w-5" aria-hidden="true" />
                  <span>Ver todas as notas por matéria</span>
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <p className="text-base text-slate-700">
                Ainda não há notas de simulados lançadas para este estudante neste semestre.
              </p>
            )}
          </Card>

          {/* 5. PRÓXIMOS COMPROMISSOS IMPORTANTES */}
          <Card
            as="section"
            title="Próximos Compromissos Importantes"
            subtitle="Esta seção mostra as próximas reuniões de pais/responsáveis, simulados de sábado e feriados."
          >
            <div className="space-y-4">
              {GUARDIAN_NOTICES_AND_MEETINGS.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge
                      variant={
                        item.category === 'reuniao_familia'
                          ? 'primary'
                          : item.category === 'simulado_presencial'
                          ? 'secondary'
                          : 'warning'
                      }
                    >
                      {item.categoryLabel}
                    </Badge>
                    <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-slate-800">
                      <Calendar className="h-4 w-4 text-primary-700" aria-hidden="true" />
                      <span>Data: {formatDateBR(item.date)}</span>
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900">
                    {item.title}
                  </h3>

                  <p className="text-base text-slate-700 leading-relaxed">
                    {item.plainExplanation}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-700">
                    {item.timeRange && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-primary-700" aria-hidden="true" />
                        <span>Horário: {item.timeRange}</span>
                      </span>
                    )}
                    {item.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary-700" aria-hidden="true" />
                        <span>Local: {item.location}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}

              <Link
                to="/responsavel/calendario"
                className="inline-flex w-full min-h-[52px] items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-3 text-base font-extrabold text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <Calendar className="h-5 w-5" aria-hidden="true" />
                <span>Ver todos os avisos e reuniões de pais</span>
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </div>
          </Card>
        </>
      )}

      {/* 6. CAIXA FIXA DE CANAL DE APOIO DA COORDENAÇÃO */}
      <GuardianCoordinationSupportBox />
    </div>
  );
};
