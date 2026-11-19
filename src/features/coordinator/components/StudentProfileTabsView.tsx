import React, { useState } from 'react';
import {
  ArrowLeft,
  Award,
  CalendarCheck,
  FilePenLine,
  FileText,
  GraduationCap,
  History,
  Power,
  RotateCcw,
  Users,
} from 'lucide-react';
import {
  Badge,
  Button,
  CalloutAlert,
  Card,
  ProgressBarGroup,
} from '../../../components/ui';
import { useMockDatabase } from '../../../contexts/MockDatabaseContext';
import { Enrollment, Person, Responsibility } from '../../../types';
import {
  formatDateBR,
  formatEnemScore,
  getDisplayName,
} from '../../../utils/formatters';
import { calculateAgeYears } from '../../../utils/validators';

export interface EnrichedStudentRow {
  person: Person;
  enrollment?: Enrollment;
  classRoomId: string;
  classRoomName: string;
  attendancePct: number;
  enemAvg: number;
  guardian?: Person;
  relationship?: Responsibility['relationship'];
}

type StudentProfileTab =
  | 'dados_pessoais'
  | 'matriculas'
  | 'frequencia'
  | 'boletim_simulados'
  | 'historico_ocorrencias';

export interface StudentProfileTabsViewProps {
  studentRow: EnrichedStudentRow;
  onBack: () => void;
  onEdit: (row: EnrichedStudentRow) => void;
  onToggleStatusRequest: (person: Person) => void;
}

/**
 * Subcomponente coeso (SRP): Ficha Acadêmica Detalhada do Aluno em 5 Abas (inspirada no SUAP).
 */
export const StudentProfileTabsView: React.FC<StudentProfileTabsViewProps> = ({
  studentRow,
  onBack,
  onEdit,
  onToggleStatusRequest,
}) => {
  const { db } = useMockDatabase();
  const [activeTab, setActiveTab] = useState<StudentProfileTab>('dados_pessoais');

  return (
    <div className="space-y-6">
      {/* Topo da Ficha: Voltar + Identificação + Ações de Editar e Inativar/Reativar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          variant="ghost"
          onClick={onBack}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Voltar para a Lista de Alunos
        </Button>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="ghost"
            onClick={() => onEdit(studentRow)}
            leftIcon={<FilePenLine className="h-4 w-4" />}
          >
            Editar Cadastro
          </Button>

          <Button
            variant={studentRow.person.status === 'active' ? 'danger' : 'primary'}
            onClick={() => onToggleStatusRequest(studentRow.person)}
            leftIcon={
              studentRow.person.status === 'active' ? (
                <Power className="h-4 w-4" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )
            }
          >
            {studentRow.person.status === 'active'
              ? 'Inativar Aluno (Preservar Histórico)'
              : 'Reativar Cadastro do Aluno'}
          </Button>
        </div>
      </div>

      {/* Cabeçalho Estilo SUAP do Perfil Acadêmico */}
      <Card className="border-t-4 border-t-primary-700 dark:border-t-primary-500">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  studentRow.person.status === 'active' ? 'success' : 'neutral'
                }
              >
                {studentRow.person.status === 'active'
                  ? 'Cadastro Ativo'
                  : 'Cadastro Inativo / Trancado'}
              </Badge>
              <Badge variant="primary">{studentRow.classRoomName}</Badge>
              <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                Matrícula: {studentRow.enrollment?.enrollmentCode ?? 'BS-2026'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {getDisplayName(studentRow.person)}
            </h1>

            {studentRow.person.socialName && (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Nome de registro civil: <strong>{studentRow.person.fullName}</strong>
              </p>
            )}

            <p className="text-sm text-slate-600 dark:text-slate-300">
              CPF: <strong>{studentRow.person.cpf}</strong> • Telefone:{' '}
              <strong>{studentRow.person.phone}</strong> • E-mail:{' '}
              <strong>{studentRow.person.email}</strong>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center dark:border-slate-800 dark:bg-slate-950">
              <span className="block text-xs font-bold text-slate-500">Frequência</span>
              <span
                className={`text-xl font-extrabold ${
                  studentRow.attendancePct < 75
                    ? 'text-danger-700 dark:text-red-400'
                    : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {studentRow.attendancePct}%
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center dark:border-slate-800 dark:bg-slate-950">
              <span className="block text-xs font-bold text-slate-500">Média ENEM</span>
              <span className="text-xl font-extrabold text-secondary-800 dark:text-secondary-300">
                {studentRow.enemAvg > 0 ? formatEnemScore(studentRow.enemAvg) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Barra de Abas do Perfil Acadêmico (5 Abas) */}
        <div
          role="tablist"
          aria-label="Abas da ficha acadêmica do estudante"
          className="mt-6 flex flex-wrap gap-2 border-t border-slate-200 pt-4 dark:border-slate-800"
        >
          {(
            [
              {
                id: 'dados_pessoais',
                label: '1. Dados Pessoais',
                icon: <Users className="h-4 w-4" />,
              },
              {
                id: 'matriculas',
                label: '2. Matrículas',
                icon: <FileText className="h-4 w-4" />,
              },
              {
                id: 'frequencia',
                label: '3. Frequência',
                icon: <CalendarCheck className="h-4 w-4" />,
              },
              {
                id: 'boletim_simulados',
                label: '4. Boletim / Simulados',
                icon: <GraduationCap className="h-4 w-4" />,
              },
              {
                id: 'historico_ocorrencias',
                label: '5. Histórico / Ocorrências',
                icon: <History className="h-4 w-4" />,
              },
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
                className={`min-h-[44px] inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold transition-all ${
                  isSelected
                    ? 'bg-primary-700 text-white shadow-xs dark:bg-primary-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span aria-hidden="true">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* CONTEÚDO DA ABA 1: DADOS PESSOAIS */}
      {activeTab === 'dados_pessoais' && (
        <Card
          title="Dados Pessoais, Contato e Vínculo Familiar"
          subtitle="Informações cadastrais completas do(a) estudante no Cursinho Comunitário Bonsucesso."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500">Nome Completo</span>
              <p className="mt-1 font-extrabold text-slate-900 dark:text-white">
                {studentRow.person.fullName}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500">Nome Social</span>
              <p className="mt-1 font-bold text-slate-900 dark:text-white">
                {studentRow.person.socialName || 'Não informado'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500">
                Data de Nascimento e Idade
              </span>
              <p className="mt-1 font-bold text-slate-900 dark:text-white">
                {formatDateBR(studentRow.person.birthDate)} (
                {calculateAgeYears(studentRow.person.birthDate)} anos)
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500">CPF e RG</span>
              <p className="mt-1 font-bold text-slate-900 dark:text-white">
                CPF: {studentRow.person.cpf} • RG: {studentRow.person.rg}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500">Autodeclaração Racial</span>
              <p className="mt-1 font-bold text-slate-900 dark:text-white">
                {studentRow.person.race}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500">Responsável Familiar</span>
              <p className="mt-1 font-bold text-slate-900 dark:text-white">
                {studentRow.guardian
                  ? `${getDisplayName(studentRow.guardian)} (${
                      studentRow.relationship
                    }) • ${studentRow.guardian.phone}`
                  : 'Sem responsável vinculado'}
              </p>
            </div>
          </div>

          {studentRow.person.generalNotes && (
            <div className="mt-4 rounded-xl border border-primary-200 bg-primary-50/50 p-4 dark:border-primary-800 dark:bg-primary-950/30">
              <span className="text-xs font-extrabold uppercase tracking-wider text-primary-900 dark:text-primary-300">
                Informações Gerais e Observações de Acolhimento
              </span>
              <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
                {studentRow.person.generalNotes}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* CONTEÚDO DA ABA 2: MATRÍCULAS */}
      {activeTab === 'matriculas' && (
        <Card
          title="Vínculo de Matrícula e Histórico de Situação"
          subtitle="Registro completo de ingresso, turma atribuída e alterações de status."
        >
          {studentRow.enrollment ? (
            <div className="space-y-4">
              <div className="rounded-xl border-2 border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    Código: {studentRow.enrollment.enrollmentCode}
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {studentRow.classRoomName} — 2º semestre de 2026
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Data de matrícula: {formatDateBR(studentRow.enrollment.enrolledAt)}
                  </p>
                </div>

                <Badge
                  variant={
                    studentRow.enrollment.status === 'ativa' ? 'success' : 'warning'
                  }
                >
                  Situação da Matrícula: {studentRow.enrollment.status.toUpperCase()}
                </Badge>
              </div>

              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                Linha do Tempo da Matrícula
              </h4>
              <div className="space-y-2.5">
                {studentRow.enrollment.statusHistory.map((hist, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 p-3.5 text-sm dark:border-slate-800"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="neutral">{hist.status.toUpperCase()}</Badge>
                      <span className="text-xs font-bold text-slate-500">
                        Em {formatDateBR(hist.changedAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-slate-800 dark:text-slate-200">
                      {hist.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">Nenhuma matrícula localizada.</p>
          )}
        </Card>
      )}

      {/* CONTEÚDO DA ABA 3: FREQUÊNCIA */}
      {activeTab === 'frequencia' && (
        <Card
          title="Histórico de Presença nas Aulas"
          subtitle={`Frequência acumulada atual: ${studentRow.attendancePct}% (Meta mínima recomendada: 75%).`}
        >
          <div className="space-y-4">
            <ProgressBarGroup
              items={[
                {
                  id: studentRow.person.id,
                  label: `Presença Geral de ${getDisplayName(studentRow.person)}`,
                  sublabel: studentRow.classRoomName,
                  value: studentRow.attendancePct,
                  max: 100,
                  unit: '%',
                  thresholdPercentage: 75,
                },
              ]}
            />

            <div className="space-y-2.5 pt-2">
              {db.attendances
                .filter((a) => a.studentPersonId === studentRow.person.id)
                .map((att) => {
                  const lesson = db.lessons.find((l) => l.id === att.lessonId);
                  const subject = db.subjects.find((s) => s.id === lesson?.subjectId);
                  return (
                    <div
                      key={att.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3.5 dark:border-slate-800"
                    >
                      <div>
                        <span className="text-xs font-bold text-primary-800 dark:text-primary-300">
                          {formatDateBR(lesson?.date ?? att.recordedAt)} •{' '}
                          {subject?.name ?? 'Aula'}
                        </span>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {lesson?.topic ?? 'Encontro regular'}
                        </p>
                        {att.justification && (
                          <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                            Justificativa: {att.justification}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={
                          att.presence === 'presente'
                            ? 'success'
                            : att.presence === 'justificada'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {att.presence.toUpperCase()}
                      </Badge>
                    </div>
                  );
                })}
            </div>
          </div>
        </Card>
      )}

      {/* CONTEÚDO DA ABA 4: BOLETIM / SIMULADOS */}
      {activeTab === 'boletim_simulados' && (
        <Card
          title="Boletim de Simulados ENEM (Escala 0 a 1.000)"
          subtitle="Resultados alcançados pelo(a) estudante nas avaliações do cursinho."
        >
          <div className="space-y-4">
            {db.grades
              .filter((g) => g.studentPersonId === studentRow.person.id)
              .map((grade) => {
                const assessment = db.assessments.find(
                  (a) => a.id === grade.assessmentId
                );
                return (
                  <div
                    key={grade.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                        {assessment?.title ?? 'Simulado ENEM'}
                      </h4>
                      <Badge variant="secondary" icon={<Award className="h-4 w-4" />}>
                        Média Geral: {formatEnemScore(grade.score)}
                      </Badge>
                    </div>

                    {grade.areaScores && (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 pt-2 text-xs">
                        <div className="rounded-lg bg-white p-2 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                          <span className="block text-slate-500">Redação</span>
                          <strong className="text-sm">{grade.areaScores.redacao} pts</strong>
                        </div>
                        <div className="rounded-lg bg-white p-2 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                          <span className="block text-slate-500">Humanas</span>
                          <strong className="text-sm">{grade.areaScores.humanas} pts</strong>
                        </div>
                        <div className="rounded-lg bg-white p-2 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                          <span className="block text-slate-500">Linguagens</span>
                          <strong className="text-sm">{grade.areaScores.linguagens} pts</strong>
                        </div>
                        <div className="rounded-lg bg-white p-2 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                          <span className="block text-slate-500">Natureza</span>
                          <strong className="text-sm">{grade.areaScores.natureza} pts</strong>
                        </div>
                        <div className="rounded-lg bg-white p-2 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                          <span className="block text-slate-500">Matemática</span>
                          <strong className="text-sm">{grade.areaScores.matematica} pts</strong>
                        </div>
                      </div>
                    )}

                    {grade.feedback && (
                      <p className="text-xs italic text-slate-700 dark:text-slate-300 pt-1">
                        Comentário dos professores: "{grade.feedback}"
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {/* CONTEÚDO DA ABA 5: HISTÓRICO / OCORRÊNCIAS PEDAGÓGICAS */}
      {activeTab === 'historico_ocorrencias' && (
        <Card
          title="Histórico de Acolhimento e Observações Pedagógicas"
          subtitle="Registros internos da coordenação sobre acompanhamento individual e familiar."
        >
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <span className="text-xs font-bold text-primary-800 dark:text-primary-300">
                Observação Cadastral Permanente
              </span>
              <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
                {studentRow.person.generalNotes ||
                  'Nenhuma observação especial registrada até o momento.'}
              </p>
            </div>

            {studentRow.attendancePct < 75 && (
              <CalloutAlert
                variant="warning"
                title="Registro Automático de Acompanhamento de Presença"
              >
                Estudante encontra-se com presença acumulada de{' '}
                <strong>{studentRow.attendancePct}%</strong>. Recomendado contato via WhatsApp (
                {studentRow.person.phone}) para oferecer listas de revisão.
              </CalloutAlert>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
