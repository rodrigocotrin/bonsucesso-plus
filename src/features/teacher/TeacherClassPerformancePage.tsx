import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Users,
} from 'lucide-react';
import {
  Badge,
  CalloutAlert,
  Card,
  MetricCard,
  ProgressBarGroup,
  Select,
} from '../../components/ui';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import {
  calculateSimpleEnemAverage,
  evaluateAttendanceStatus,
  formatEnemScore,
  getDisplayName,
} from '../../utils/formatters';

export const TeacherClassPerformancePage: React.FC = () => {
  const { db, getStudentAttendancePercentage } = useMockDatabase();
  const [selectedClassRoomId, setSelectedClassRoomId] = useState<string>('all');

  const consolidatedStudentRows = useMemo(() => {
    const activeEnrollments = db.enrollments.filter(
      (e) =>
        e.status === 'ativa' &&
        (selectedClassRoomId === 'all' || e.classRoomId === selectedClassRoomId)
    );

    return activeEnrollments
      .map((enrollment) => {
        const person = db.persons.find((p) => p.id === enrollment.studentPersonId);
        const classRoom = db.classRooms.find((c) => c.id === enrollment.classRoomId);
        if (!person) return null;

        const attendancePct = getStudentAttendancePercentage(person.id);
        const attendanceEval = evaluateAttendanceStatus(attendancePct);
        const studentGrades = db.grades.filter((g) => g.studentPersonId === person.id);
        const enemAverage = calculateSimpleEnemAverage(studentGrades);

        return {
          person,
          enrollment,
          classRoomName: classRoom?.name ?? 'Turma Esperança',
          attendancePct,
          attendanceEval,
          enemAverage,
          gradesCount: studentGrades.length,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => a.attendancePct - b.attendancePct); // Mostra os mais críticos (<75%) primeiro
  }, [
    db.enrollments,
    db.persons,
    db.classRooms,
    db.grades,
    getStudentAttendancePercentage,
    selectedClassRoomId,
  ]);

  const lowAttendanceStudents = useMemo(
    () => consolidatedStudentRows.filter((row) => row.attendancePct < 75),
    [consolidatedStudentRows]
  );

  const classAverageAttendance = useMemo(() => {
    if (consolidatedStudentRows.length === 0) return 100;
    const sum = consolidatedStudentRows.reduce(
      (acc, r) => acc + r.attendancePct,
      0
    );
    return Math.round(sum / consolidatedStudentRows.length);
  }, [consolidatedStudentRows]);

  const classAverageEnem = useMemo(() => {
    const withGrades = consolidatedStudentRows.filter((r) => r.enemAverage > 0);
    if (withGrades.length === 0) return 0;
    const sum = withGrades.reduce((acc, r) => acc + r.enemAverage, 0);
    return Math.round(sum / withGrades.length);
  }, [consolidatedStudentRows]);

  const progressBarItems = useMemo(() => {
    return consolidatedStudentRows.map((row) => ({
      id: row.person.id,
      label: `${getDisplayName(row.person)} (${row.enrollment.enrollmentCode})`,
      sublabel: `${row.classRoomName} • Média Simulados: ${
        row.enemAverage > 0
          ? formatEnemScore(row.enemAverage)
          : 'Sem simulado lançado'
      }`,
      value: row.attendancePct,
      max: 100,
      unit: '%',
      thresholdPercentage: 75,
    }));
  }, [consolidatedStudentRows]);

  return (
    <div className="space-y-8">
      {/* Cabeçalho + Filtro de Turma */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="primary" icon={<BarChart3 className="h-4 w-4" />}>
            Acompanhamento Pedagógico Consolidado (UC18 / UC21)
          </Badge>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Desempenho e Assiduidade das Turmas
          </h1>
          <p className="mt-1 max-w-2xl text-base text-slate-600 dark:text-slate-300">
            Visão consolidada da frequência acumulada e da média nos simulados ENEM. Estudantes com
            presença abaixo de 75% aparecem destacados no topo para acolhimento preventivo.
          </p>
        </div>

        <div className="w-full md:w-80 shrink-0">
          <Select
            label="Filtrar por Turma"
            value={selectedClassRoomId}
            onChange={(e) => setSelectedClassRoomId(e.target.value)}
            options={[
              { value: 'all', label: 'Todas as Turmas (Visão Consolidada)' },
              ...db.classRooms.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>
      </div>

      {/* KPIs Consolidados */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="Frequência Média da Turma"
          value={classAverageAttendance}
          scale="percentage"
          accentColor={classAverageAttendance < 75 ? 'warning' : 'primary'}
          icon={<CalendarCheck className="h-6 w-6" />}
          statusBadge={{
            label: `Meta: ≥ 75%`,
            variant: classAverageAttendance >= 75 ? 'success' : 'warning',
          }}
          subtitle={`Calculada sobre ${consolidatedStudentRows.length} estudantes com matrícula ativa.`}
        />

        <MetricCard
          title="Média Geral nos Simulados"
          value={classAverageEnem}
          scale="enem"
          accentColor="secondary"
          icon={<GraduationCap className="h-6 w-6" />}
          subtitle="Média simples na escala oficial do ENEM (0 a 1.000 pontos)."
        />

        <MetricCard
          title="Alunos em Alerta (< 75%)"
          value={`${lowAttendanceStudents.length} ${
            lowAttendanceStudents.length === 1 ? 'estudante' : 'estudantes'
          }`}
          scale="raw"
          accentColor={lowAttendanceStudents.length > 0 ? 'danger' : 'success'}
          icon={<Users className="h-6 w-6" />}
          statusBadge={{
            label:
              lowAttendanceStudents.length > 0
                ? 'Acompanhamento prioritário'
                : 'Todos regulares',
            variant: lowAttendanceStudents.length > 0 ? 'danger' : 'success',
          }}
          subtitle="Estudantes que precisam de contato preventivo e envio de listas de revisão."
        />
      </div>

      {/* Destaque de Alunos com Frequência Abaixo de 75% */}
      {lowAttendanceStudents.length > 0 && (
        <CalloutAlert
          variant="warning"
          title={`${lowAttendanceStudents.length} ${
            lowAttendanceStudents.length === 1
              ? 'estudante está com frequência abaixo de 75%'
              : 'estudantes estão com frequência abaixo de 75%'
          }`}
          action={
            <Link
              to="/professor/chamada"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-primary-700 px-4 py-2 text-sm font-bold text-white hover:bg-primary-800 dark:bg-primary-600"
            >
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              <span>Abrir Diário de Chamada</span>
            </Link>
          }
        >
          Estudantes em ponto de atenção:{' '}
          <strong>
            {lowAttendanceStudents
              .map(
                (s) => `${getDisplayName(s.person)} (${s.attendancePct}%)`
              )
              .join(', ')}
          </strong>
          . Converse com a coordenação pedagógica para verificar se há necessidade de abono ou
          apoio com material impresso.
        </CalloutAlert>
      )}

      {/* Tabela / Lista Consolidada de Frequência e Notas */}
      <Card
        as="section"
        title="Quadro Consolidado de Estudantes (Ordenado por Prioridade de Frequência)"
        subtitle="Compare a assiduidade e a média nos simulados de cada estudante."
      >
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
              <tr>
                <th scope="col" className="px-4 py-3 font-bold">
                  Estudante / Matrícula
                </th>
                <th scope="col" className="px-4 py-3 font-bold">
                  Turma
                </th>
                <th scope="col" className="px-4 py-3 font-bold">
                  Frequência Acumulada
                </th>
                <th scope="col" className="px-4 py-3 font-bold">
                  Situação de Presença
                </th>
                <th scope="col" className="px-4 py-3 font-bold">
                  Média Simulados ENEM
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {consolidatedStudentRows.map((row) => {
                const isCritical = row.attendanceEval.status === 'critical';
                return (
                  <tr
                    key={row.person.id}
                    className={
                      isCritical
                        ? 'bg-danger-50/40 hover:bg-danger-50/70 dark:bg-danger-950/20 dark:hover:bg-danger-950/40'
                        : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/60'
                    }
                  >
                    <td className="px-4 py-3.5">
                      <p className="font-extrabold text-slate-900 dark:text-white text-base">
                        {getDisplayName(row.person)}
                      </p>
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {row.enrollment.enrollmentCode}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-300">
                      {row.classRoomName}
                    </td>
                    <td className="px-4 py-3.5 text-base font-extrabold text-slate-900 dark:text-white">
                      {row.attendancePct}%
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        variant={isCritical ? 'danger' : 'success'}
                        icon={
                          isCritical ? (
                            <AlertTriangle className="h-3.5 w-3.5" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )
                        }
                      >
                        {row.attendanceEval.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 font-extrabold text-secondary-800 dark:text-secondary-300">
                      {row.enemAverage > 0 ? (
                        formatEnemScore(row.enemAverage)
                      ) : (
                        <span className="text-xs font-normal text-slate-500">
                          Aguardando lançamento
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Visualização em Barras de Progresso (ProgressBarGroup) */}
      <Card
        as="section"
        title="Mapa Visual de Assiduidade por Estudante"
        subtitle="Barras horizontais rotuladas com referência na meta mínima recomendada de 75%."
      >
        <ProgressBarGroup
          items={progressBarItems}
          showThresholdMarker
          defaultThreshold={75}
        />
      </Card>
    </div>
  );
};
