import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  FilePenLine,
  Power,
  RotateCcw,
} from 'lucide-react';
import {
  Badge,
  Button,
  CalloutAlert,
  Card,
  ProgressBarGroup,
} from '../../../components/ui';
import { useMockDatabase } from '../../../contexts/MockDatabaseContext';
import { SPRINGS, VARIANTS } from '../../../lib/motion';
import { Enrollment, Person, Responsibility } from '../../../types';
import {
  cn,
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Voltar para Alunos
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit(studentRow)}
            leftIcon={<FilePenLine className="h-4 w-4" />}
          >
            Editar
          </Button>

          <Button
            variant={studentRow.person.status === 'active' ? 'danger' : 'secondary'}
            size="sm"
            onClick={() => onToggleStatusRequest(studentRow.person)}
            leftIcon={
              studentRow.person.status === 'active' ? (
                <Power className="h-4 w-4" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )
            }
          >
            {studentRow.person.status === 'active' ? 'Inativar' : 'Reativar'}
          </Button>
        </div>
      </div>

      {/* Cabeçalho Limpo da Ficha + Abas Minimalistas (Sem pills pretas e sem sub-caixas) */}
      <Card noPadding>
        <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={studentRow.person.status === 'active' ? 'progress' : 'neutral'}>
                {studentRow.person.status === 'active' ? 'Ativo' : 'Inativo'}
              </Badge>
              <Badge variant="academic">{studentRow.classRoomName}</Badge>
              <span className="font-mono text-xs text-ink-muted">
                {studentRow.enrollment?.enrollmentCode ?? 'BS-2026'}
              </span>
            </div>

            <h1 className="text-xl font-bold text-ink">
              {getDisplayName(studentRow.person)}
            </h1>

            <p className="break-words text-xs text-ink-muted">
              CPF <span className="font-mono">{studentRow.person.cpf}</span> •{' '}
              <span className="font-mono">{studentRow.person.phone}</span> •{' '}
              <span className="break-all">{studentRow.person.email}</span>
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <span className="block text-xs text-ink-muted">Frequência</span>
              <span
                className={cn(
                  'font-mono text-2xl font-semibold tabular-nums',
                  studentRow.attendancePct < 75 ? 'text-critical' : 'text-ink'
                )}
              >
                {studentRow.attendancePct}%
              </span>
            </div>

            <div className="h-8 w-px bg-line" aria-hidden="true" />

            <div>
              <span className="block text-xs text-ink-muted">Média ENEM</span>
              <span className="font-mono text-2xl font-semibold text-ink tabular-nums">
                {studentRow.enemAvg > 0 ? studentRow.enemAvg : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Abas Horizontais Minimalistas (Regra 1) */}
        <div
          role="tablist"
          aria-label="Abas da ficha acadêmica"
          className="no-scrollbar flex w-full max-w-full gap-5 overflow-x-auto border-t border-line px-4 sm:px-5"
        >
          {(
            [
              { id: 'dados_pessoais', label: 'Dados Pessoais' },
              { id: 'matriculas', label: 'Matrículas' },
              { id: 'frequencia', label: 'Frequência' },
              { id: 'boletim_simulados', label: 'Boletins' },
              { id: 'historico_ocorrencias', label: 'Histórico' },
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
                  'relative inline-flex h-10 shrink-0 items-center text-sm transition-colors duration-150',
                  isSelected
                    ? 'font-semibold text-ink'
                    : 'font-medium text-ink-muted hover:text-ink'
                )}
              >
                <span>{tab.label}</span>
                {isSelected && (
                  <motion.span
                    layoutId="student-profile-tab-underline"
                    transition={SPRINGS.indicator}
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-ink"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          variants={VARIANTS.page}
          initial="initial"
          animate="animate"
          exit="exit"
        >
      {/* ABA 1: DADOS PESSOAIS (Sem sub-caixas com bordas — Regra 3) */}
      {activeTab === 'dados_pessoais' && (
        <Card title="Dados Pessoais e Vínculo Familiar">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs text-ink-muted">Nome Completo</dt>
              <dd className="mt-1 text-sm font-medium text-ink">{studentRow.person.fullName}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Nome Social</dt>
              <dd className="mt-1 text-sm font-medium text-ink">
                {studentRow.person.socialName || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Nascimento</dt>
              <dd className="mt-1 text-sm font-medium text-ink">
                <span className="font-mono tabular-nums">
                  {formatDateBR(studentRow.person.birthDate)}
                </span>{' '}
                ({calculateAgeYears(studentRow.person.birthDate)} anos)
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">CPF / RG</dt>
              <dd className="font-mono mt-1 text-sm font-medium text-ink tabular-nums">
                {studentRow.person.cpf} • {studentRow.person.rg}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Autodeclaração</dt>
              <dd className="mt-1 text-sm font-medium text-ink">{studentRow.person.race}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Responsável Familiar</dt>
              <dd className="mt-1 text-sm font-medium text-ink">
                {studentRow.guardian
                  ? `${getDisplayName(studentRow.guardian)} (${studentRow.relationship}) • ${studentRow.guardian.phone}`
                  : 'Sem responsável vinculado'}
              </dd>
            </div>
          </dl>

          {studentRow.person.generalNotes && (
            <div className="mt-5 rounded-md bg-subtle p-4">
              <span className="text-xs font-medium text-ink-muted">Observações</span>
              <p className="mt-1 text-sm text-ink">{studentRow.person.generalNotes}</p>
            </div>
          )}
        </Card>
      )}

      {/* ABA 2: MATRÍCULAS */}
      {activeTab === 'matriculas' && (
        <Card title="Histórico de Matrícula">
          {studentRow.enrollment ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-subtle p-4">
                <div>
                  <span className="font-mono text-xs text-ink-muted">
                    {studentRow.enrollment.enrollmentCode}
                  </span>
                  <h3 className="text-sm font-semibold text-ink">
                    {studentRow.classRoomName}
                  </h3>
                  <p className="text-xs text-ink-muted">
                    Ingresso em{' '}
                    <span className="font-mono">{formatDateBR(studentRow.enrollment.enrolledAt)}</span>
                  </p>
                </div>
                <Badge
                  variant={studentRow.enrollment.status === 'ativa' ? 'progress' : 'assess'}
                >
                  {studentRow.enrollment.status}
                </Badge>
              </div>

              <ul className="divide-y divide-line">
                {studentRow.enrollment.statusHistory.map((hist, idx) => (
                  <li key={idx} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="neutral">{hist.status}</Badge>
                      <span className="text-ink">{hist.reason}</span>
                    </div>
                    <span className="font-mono text-xs text-ink-muted">
                      {formatDateBR(hist.changedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Nenhuma matrícula localizada.</p>
          )}
        </Card>
      )}

      {/* ABA 3: FREQUÊNCIA */}
      {activeTab === 'frequencia' && (
        <Card title="Frequência">
          <div className="space-y-4">
            <ProgressBarGroup
              items={[
                {
                  id: studentRow.person.id,
                  label: 'Assiduidade Acumulada',
                  sublabel: studentRow.classRoomName,
                  value: studentRow.attendancePct,
                  max: 100,
                  unit: '%',
                  thresholdPercentage: 75,
                },
              ]}
            />

            <ul className="divide-y divide-line pt-2">
              {db.attendances
                .filter((a) => a.studentPersonId === studentRow.person.id)
                .map((att) => {
                  const lesson = db.lessons.find((l) => l.id === att.lessonId);
                  const subject = db.subjects.find((s) => s.id === lesson?.subjectId);
                  return (
                    <li
                      key={att.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-ink">
                          {subject?.name ?? 'Aula'} — {lesson?.topic ?? 'Encontro regular'}
                        </p>
                        <p className="text-xs text-ink-muted">
                          <span className="font-mono">
                            {formatDateBR(lesson?.date ?? att.recordedAt)}
                          </span>
                          {att.justification ? ` • ${att.justification}` : ''}
                        </p>
                      </div>
                      <Badge
                        variant={
                          att.presence === 'presente'
                            ? 'progress'
                            : att.presence === 'justificada'
                            ? 'assess'
                            : 'critical'
                        }
                      >
                        {att.presence}
                      </Badge>
                    </li>
                  );
                })}
            </ul>
          </div>
        </Card>
      )}

      {/* ABA 4: BOLETIM / SIMULADOS */}
      {activeTab === 'boletim_simulados' && (
        <Card title="Simulados ENEM" noPadding>
          <ul className="divide-y divide-line">
            {db.grades
              .filter((g) => g.studentPersonId === studentRow.person.id)
              .map((grade) => {
                const assessment = db.assessments.find((a) => a.id === grade.assessmentId);
                return (
                  <li key={grade.id} className="p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-ink">
                        {assessment?.title ?? 'Simulado ENEM'}
                      </h4>
                      <span className="font-mono text-sm font-semibold text-ink tabular-nums">
                        {formatEnemScore(grade.score)}
                      </span>
                    </div>

                    {grade.areaScores && (
                      <div className="grid grid-cols-2 gap-3 rounded-md bg-subtle p-3 sm:grid-cols-5 text-xs">
                        <div>
                          <span className="block text-ink-muted">Redação</span>
                          <strong className="font-mono text-sm text-ink tabular-nums">
                            {grade.areaScores.redacao}
                          </strong>
                        </div>
                        <div>
                          <span className="block text-ink-muted">Humanas</span>
                          <strong className="font-mono text-sm text-ink tabular-nums">
                            {grade.areaScores.humanas}
                          </strong>
                        </div>
                        <div>
                          <span className="block text-ink-muted">Linguagens</span>
                          <strong className="font-mono text-sm text-ink tabular-nums">
                            {grade.areaScores.linguagens}
                          </strong>
                        </div>
                        <div>
                          <span className="block text-ink-muted">Natureza</span>
                          <strong className="font-mono text-sm text-ink tabular-nums">
                            {grade.areaScores.natureza}
                          </strong>
                        </div>
                        <div>
                          <span className="block text-ink-muted">Matemática</span>
                          <strong className="font-mono text-sm text-ink tabular-nums">
                            {grade.areaScores.matematica}
                          </strong>
                        </div>
                      </div>
                    )}

                    {grade.feedback && (
                      <p className="text-xs text-ink-muted">{grade.feedback}</p>
                    )}
                  </li>
                );
              })}
          </ul>
        </Card>
      )}

      {/* ABA 5: HISTÓRICO */}
      {activeTab === 'historico_ocorrencias' && (
        <Card title="Histórico e Observações">
          <div className="space-y-4">
            <p className="text-sm text-ink">
              {studentRow.person.generalNotes || 'Nenhuma observação cadastrada.'}
            </p>

            {studentRow.attendancePct < 75 && (
              <CalloutAlert variant="warning" title="Frequência abaixo de 75%">
                Presença atual em <strong className="font-mono">{studentRow.attendancePct}%</strong>.
                Contato: <span className="font-mono">{studentRow.person.phone}</span>.
              </CalloutAlert>
            )}
          </div>
        </Card>
      )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
