import React from 'react';
import {
  CheckCircle2,
  Clock,
  HeartHandshake,
  MapPin,
  Phone,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
} from '../../components/ui';
import { useSession } from '../../contexts/SessionContext';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import { useToast } from '../../contexts/ToastContext';
import { getDisplayName } from '../../utils/formatters';
import { COORDINATION_SUPPORT_CONTACT } from './guardianData';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * 1. Seletor de Estudante Vinculado (no topo de todas as telas do Responsável)
 * - Se houver mais de 1 aluno vinculado (via Responsibility), exibe cartões/abas grandes e claros
 *   com iniciais, nome completo, turma e relação familiar para alternar facilmente.
 * - Se houver apenas 1 aluno vinculado, exibe um cartão claro identificando quem está sendo acompanhado.
 * - Se não houver nenhum aluno vinculado, exibe um EmptyState acolhedor explicando como solicitar o vínculo.
 */
export const GuardianStudentSelectorBar: React.FC = () => {
  const {
    currentPerson,
    linkedStudentsForGuardian,
    selectedStudentForGuardian,
    setSelectedStudentIdForGuardian,
  } = useSession();
  const { db } = useMockDatabase();
  const { showToast } = useToast();

  if (!currentPerson) return null;

  if (linkedStudentsForGuardian.length === 0) {
    return (
      <EmptyState
        title="Nenhum estudante está vinculado ao seu cadastro no momento"
        description="Para acompanhar a presença nas aulas e as notas dos simulados do seu filho, filha ou familiar, peça à secretaria do Cursinho Comunitário Bonsucesso para vincular o CPF do estudante ao seu cadastro de responsável."
        icon={<UserPlus className="h-7 w-7" />}
        action={
          <Button
            variant="primary"
            size="lg"
            leftIcon={<Phone className="h-5 w-5" />}
            onClick={() =>
              showToast({
                variant: 'info',
                title: 'Como solicitar o vínculo na secretaria',
                description: `Ligue ou envie mensagem para ${COORDINATION_SUPPORT_CONTACT.phoneAndWhatsapp} informando seu nome e o nome do estudante.`,
              })
            }
          >
            Ver telefone da Secretaria Comunitária
          </Button>
        }
      />
    );
  }

  return (
    <section
      aria-label="Escolha de qual estudante você deseja ver as informações"
      className="rounded-2xl border-2 border-primary-200 bg-white p-4 sm:p-5 shadow-2xs dark:border-primary-800 dark:bg-slate-900"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary-700 dark:text-primary-400 shrink-0" aria-hidden="true" />
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              {linkedStudentsForGuardian.length > 1
                ? 'Toque no nome do(a) estudante que você deseja acompanhar agora:'
                : 'Estudante vinculado(a) ao seu acompanhamento familiar:'}
            </h2>
          </div>

          {linkedStudentsForGuardian.length > 1 && (
            <Badge variant="primary">
              {linkedStudentsForGuardian.length} estudantes vinculados a você
            </Badge>
          )}
        </div>

        {/* Cartões/Abas Grandes para seleção com 1 toque (mínimo 64px de altura) */}
        <div
          role={linkedStudentsForGuardian.length > 1 ? 'tablist' : undefined}
          aria-label="Lista de estudantes vinculados"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {linkedStudentsForGuardian.map((student) => {
            const isSelected = selectedStudentForGuardian?.id === student.id;
            const enrollment = db.enrollments.find(
              (e) => e.studentPersonId === student.id && e.status === 'ativa'
            );
            const classRoom = db.classRooms.find((c) => c.id === enrollment?.classRoomId);
            const responsibility = db.responsibilities.find(
              (r) =>
                r.guardianPersonId === currentPerson.id &&
                r.studentPersonId === student.id
            );
            const studentName = getDisplayName(student);

            return (
              <button
                key={student.id}
                type="button"
                role={linkedStudentsForGuardian.length > 1 ? 'tab' : undefined}
                aria-selected={linkedStudentsForGuardian.length > 1 ? isSelected : undefined}
                onClick={() => {
                  if (!isSelected) {
                    setSelectedStudentIdForGuardian(student.id);
                    showToast({
                      variant: 'info',
                      title: `Agora você está vendo: ${studentName}`,
                      description: `Mostrando a presença e os simulados de ${studentName}.`,
                    });
                  }
                }}
                className={`w-full min-h-[72px] text-left rounded-2xl border-2 p-3.5 sm:p-4 transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-primary-700 bg-primary-50/90 shadow-sm dark:border-primary-400 dark:bg-primary-950/70'
                    : 'border-slate-300 bg-slate-50/70 hover:border-primary-500 hover:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Avatar grande com Iniciais */}
                  <div
                    className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl text-base font-extrabold ${
                      isSelected
                        ? 'bg-primary-700 text-white dark:bg-primary-500 dark:text-slate-950'
                        : 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100'
                    }`}
                    aria-hidden="true"
                  >
                    {getInitials(studentName)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
                        {studentName}
                      </span>
                      {responsibility && (
                        <span className="text-xs font-bold text-primary-800 dark:text-primary-300">
                          ({responsibility.relationship})
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {classRoom?.name ?? 'Turma Esperança • Noite'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {isSelected ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary-700 px-3 py-1.5 text-xs font-extrabold text-white dark:bg-primary-500 dark:text-slate-950">
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      <span>Selecionado(a)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                      Toque para ver
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/**
 * Caixa fixa de "Canal de Apoio da Coordenação" com horários de atendimento
 * e informações de contato direto do cursinho (sem jargões, pronta para leitura rápida).
 */
export const GuardianCoordinationSupportBox: React.FC = () => {
  return (
    <Card
      as="section"
      className="border-2 border-primary-300 bg-primary-50/50 dark:border-primary-800 dark:bg-primary-950/30"
      title="Canal de Apoio da Coordenação para as Famílias"
      subtitle="Esta caixa mostra os telefones, horários e endereço caso você queira conversar pessoalmente ou tirar dúvidas sobre seu filho(a)."
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-700 text-white dark:bg-primary-600"
            aria-hidden="true"
          >
            <HeartHandshake className="h-6 w-6" />
          </div>
          <div>
            <p className="text-base font-extrabold text-slate-900 dark:text-white">
              {COORDINATION_SUPPORT_CONTACT.coordinatorName}
            </p>
            <p className="text-base text-slate-700 dark:text-slate-200 mt-0.5">
              Estamos sempre de portas abertas para ouvir as famílias, justificar faltas por motivo
              de saúde ou trabalho e apoiar os estudos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-primary-200 bg-white p-4 dark:border-primary-800 dark:bg-slate-900">
            <p className="flex items-center gap-2 text-sm font-bold text-primary-900 dark:text-primary-300">
              <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Telefone e WhatsApp da Secretaria</span>
            </p>
            <p className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">
              {COORDINATION_SUPPORT_CONTACT.phoneAndWhatsapp}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
              Telefone fixo: {COORDINATION_SUPPORT_CONTACT.landlineSecretariat}
            </p>
          </div>

          <div className="rounded-xl border border-primary-200 bg-white p-4 dark:border-primary-800 dark:bg-slate-900">
            <p className="flex items-center gap-2 text-sm font-bold text-primary-900 dark:text-primary-300">
              <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Horário de Atendimento Presencial</span>
            </p>
            <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
              {COORDINATION_SUPPORT_CONTACT.inPersonHours}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
              <MapPin className="h-4 w-4 shrink-0 text-primary-700 dark:text-primary-400" aria-hidden="true" />
              <span>{COORDINATION_SUPPORT_CONTACT.address}</span>
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
