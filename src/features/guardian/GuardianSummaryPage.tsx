import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CalendarCheck,
  CheckCircle2,
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
  evaluateAttendanceStatus,
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
      {/* Saudação Linear e Respeitosa */}
      <header className="space-y-2">
        <Badge variant="primary">Portal da Família e Responsáveis</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Olá, {guardianGreetingName}! Bem-vindo(a) ao acompanhamento escolar.
        </h1>
        <p className="text-base sm:text-lg text-slate-700 dark:text-slate-200 leading-relaxed">
          Aqui você acompanha de forma simples a presença nas aulas, as notas nos simulados do ENEM
          e os avisos importantes do <strong>Cursinho Comunitário Bonsucesso</strong>.
        </p>
      </header>

      {/* 1. SELETOR DE ESTUDANTE VINCULADO (OU EMPTY STATE SE NÃO HOUVER VÍNCULO) */}
      <GuardianStudentSelectorBar />

      {/* Se houver estudante selecionado, exibe os blocos lineares */}
      {student && linkedStudentsForGuardian.length > 0 && (
        <>
          {/* 2. CARTÃO DE "SITUAÇÃO GERAL" (Semáforo textual e visual claro) */}
          {(() => {
            const evalStatus = evaluateAttendanceStatus(attendanceStats.percentage);
            const isCritical = evalStatus.status === 'critical';
            const studentFirstName = getDisplayName(student).split(' ')[0];

            return (
              <Card
                as="section"
                className={
                  isCritical
                    ? 'border-2 border-warning-500 bg-warning-50/40 dark:border-amber-600 dark:bg-warning-900/20'
                    : 'border-2 border-emerald-500 bg-emerald-50/40 dark:border-emerald-600 dark:bg-emerald-950/20'
                }
                title={`Situação Geral de ${getDisplayName(student)}`}
                subtitle="Esta seção mostra um resumo direto de como está a participação do(a) estudante neste semestre."
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    {isCritical ? (
                      <span className="inline-flex items-center gap-2 rounded-xl bg-warning-700 px-4 py-2 text-base font-extrabold text-white dark:bg-amber-500 dark:text-slate-950">
                        <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
                        <span>Ponto de atenção na frequência ({attendanceStats.percentage}%)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-base font-extrabold text-white dark:bg-emerald-500 dark:text-slate-950">
                        <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
                        <span>Acompanhamento e presença em dia ({attendanceStats.percentage}%)</span>
                      </span>
                    )}

                    <Badge variant="neutral">
                      {studentClassRoom?.name ?? 'Turma Esperança • Noite'}
                    </Badge>
                  </div>

                  <p className="text-base sm:text-lg text-slate-800 dark:text-slate-100 leading-relaxed">
                    {isCritical ? (
                      <>
                        <strong>O que isso significa:</strong> {studentFirstName} está indo muito
                        bem nos simulados do ENEM, mas a presença nas aulas está em{' '}
                        <strong>{attendanceStats.percentage}%</strong> (faltou a{' '}
                        <strong>
                          {attendanceStats.absentCount}{' '}
                          {attendanceStats.absentCount === 1 ? 'aula' : 'aulas'}
                        </strong>{' '}
                        de {attendanceStats.totalClasses} registradas). O ideal é manter pelo menos{' '}
                        <strong>75% de presença</strong> para não perder explicações importantes.
                      </>
                    ) : (
                      <>
                        <strong>O que isso significa:</strong> {studentFirstName} está com ótima
                        participação nas aulas (<strong>{attendanceStats.percentage}% de presença</strong>)
                        e entregando os simulados preparatórios para o ENEM em dia. Continue
                        incentivando essa rotina em casa!
                      </>
                    )}
                  </p>
                </div>
              </Card>
            );
          })()}

          {/* 3. RESUMO DE FREQUÊNCIA (Explicado por extenso + Botão grande para detalhes) */}
          <Card
            as="section"
            title="Presença nas Aulas"
            subtitle="Esta seção mostra quantas aulas o(a) estudante assistiu, quantas faltou e qual foi a última aula frequentada."
          >
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <MetricCard
                  title={`Presença nas aulas: ${attendanceStats.percentage}%`}
                  value={`${attendanceStats.presentCount} presenças`}
                  scale="raw"
                  accentColor={attendanceStats.percentage < 75 ? 'warning' : 'success'}
                  icon={<CalendarCheck className="h-6 w-6" />}
                  statusBadge={{
                    label:
                      attendanceStats.percentage < 75
                        ? `Atenção: faltou a ${attendanceStats.absentCount} aulas`
                        : 'Presença acima de 75%',
                    variant: attendanceStats.percentage < 75 ? 'warning' : 'success',
                  }}
                  subtitle={`De um total de ${attendanceStats.totalClasses} aulas registradas neste semestre, compareceu a ${attendanceStats.presentCount} e faltou a ${attendanceStats.absentCount}.`}
                />

                <div className="rounded-2xl border-2 border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/50 flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-800 dark:text-primary-300">
                      <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>Última aula frequentada</span>
                    </span>
                    <p className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                      {attendanceStats.lastAttendedLessonText}
                    </p>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 border-t border-slate-200 pt-2.5 dark:border-slate-800">
                    Horário da turma: {studentClassRoom?.scheduleSummary}
                  </p>
                </div>
              </div>

              <Link
                to="/responsavel/frequencia"
                className="inline-flex w-full min-h-[52px] items-center justify-center gap-2.5 rounded-xl bg-primary-700 px-6 py-3 text-base sm:text-lg font-extrabold text-white shadow-xs hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-500 transition-colors"
              >
                <CalendarCheck className="h-5 w-5" aria-hidden="true" />
                <span>Ver detalhes de presença dia por dia</span>
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
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
                  className="inline-flex w-full min-h-[52px] items-center justify-center gap-2.5 rounded-xl border-2 border-secondary-700 bg-secondary-50/70 px-6 py-3 text-base sm:text-lg font-extrabold text-secondary-950 hover:bg-secondary-100 dark:border-secondary-500 dark:bg-secondary-950/60 dark:text-secondary-100 dark:hover:bg-secondary-900 transition-colors"
                >
                  <TrendingUp className="h-5 w-5" aria-hidden="true" />
                  <span>Ver todas as notas por matéria</span>
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <p className="text-base text-slate-700 dark:text-slate-300">
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
                  className="rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-950/50 space-y-2"
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
                    <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-slate-800 dark:text-slate-200">
                      <Calendar className="h-4 w-4 text-primary-700 dark:text-primary-400" aria-hidden="true" />
                      <span>Data: {formatDateBR(item.date)}</span>
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>

                  <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed">
                    {item.plainExplanation}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {item.timeRange && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-primary-700 dark:text-primary-400" aria-hidden="true" />
                        <span>Horário: {item.timeRange}</span>
                      </span>
                    )}
                    {item.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary-700 dark:text-primary-400" aria-hidden="true" />
                        <span>Local: {item.location}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}

              <Link
                to="/responsavel/calendario"
                className="inline-flex w-full min-h-[52px] items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-3 text-base font-extrabold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition-colors"
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
