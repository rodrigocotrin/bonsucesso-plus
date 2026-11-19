import React from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  MapPin,
  Phone,
  UserPlus,
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
import { SPRINGS } from '../../lib/motion';
import { cn, getDisplayName, getInitials } from '../../utils/formatters';
import { COORDINATION_SUPPORT_CONTACT } from './guardianData';

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
        title="Nenhum estudante vinculado"
        description="Solicite à secretaria a vinculação do CPF do(a) estudante ao seu cadastro."
        icon={<UserPlus className="h-6 w-6" />}
        action={
          <Button
            variant="primary"
            leftIcon={<Phone className="h-4 w-4" />}
            onClick={() =>
              showToast({
                variant: 'info',
                title: 'Contato da Secretaria',
                description: COORDINATION_SUPPORT_CONTACT.phoneAndWhatsapp,
              })
            }
          >
            Ver telefone da Secretaria
          </Button>
        }
      />
    );
  }

  return (
    <div
      role={linkedStudentsForGuardian.length > 1 ? 'tablist' : undefined}
      aria-label="Alternar estudante"
      className="flex flex-wrap items-center gap-2 rounded-lg bg-track p-1.5"
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
              }
            }}
            className={cn(
              'relative flex flex-1 min-w-[220px] items-center justify-between gap-3 rounded-md px-3.5 py-2.5 text-left transition-colors duration-150 active:scale-[0.99]',
              isSelected
                ? 'text-ink'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            {isSelected && (
              <motion.span
                layoutId="guardian-student-selector-pill"
                transition={SPRINGS.indicator}
                className="absolute inset-0 rounded-md bg-surface shadow-xs"
                aria-hidden="true"
              />
            )}
            <div className="relative z-10 flex min-w-0 items-center gap-2.5">
              <span
                className={cn(
                  'font-mono flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  isSelected ? 'bg-track text-ink' : 'bg-surface/60 text-ink-muted'
                )}
                aria-hidden="true"
              >
                {getInitials(studentName)}
              </span>

              <div className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">
                  {studentName}
                </span>
                <span className="block truncate text-xs text-ink-muted">
                  {classRoom?.name ?? 'Turma Esperança'}
                  {responsibility ? ` • ${responsibility.relationship}` : ''}
                </span>
              </div>
            </div>

            {isSelected && (
              <span className="relative z-10">
                <Badge variant="progress">Ativo</Badge>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export const GuardianCoordinationSupportBox: React.FC = () => {
  return (
    <Card title="Contato da Coordenação">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs text-ink-muted">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-ink">
            {COORDINATION_SUPPORT_CONTACT.coordinatorName}
          </p>
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{COORDINATION_SUPPORT_CONTACT.address}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{COORDINATION_SUPPORT_CONTACT.inPersonHours}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono font-medium text-ink">
            <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{COORDINATION_SUPPORT_CONTACT.phoneAndWhatsapp}</span>
          </span>
        </div>
      </div>
    </Card>
  );
};
