import React, { useMemo, useState } from 'react';
import {
  Bell,
  Calendar,
  Clock,
  MapPin,
  Users,
} from 'lucide-react';
import {
  Badge,
  Card,
} from '../../components/ui';
import { useSession } from '../../contexts/SessionContext';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import { formatDateBR } from '../../utils/formatters';
import {
  GuardianCoordinationSupportBox,
  GuardianStudentSelectorBar,
} from './GuardianSharedComponents';
import { GUARDIAN_NOTICES_AND_MEETINGS, GuardianNoticeItem } from './guardianData';

type GuardianNoticeFilter = 'todos' | 'reuniao_familia' | 'simulado_presencial' | 'comunicado_turma';

const FILTER_BUTTONS: Array<{ value: GuardianNoticeFilter; label: string }> = [
  { value: 'todos', label: 'Todos os Avisos' },
  { value: 'reuniao_familia', label: 'Reuniões de Pais e Responsáveis' },
  { value: 'simulado_presencial', label: 'Simulados de Sábado' },
  { value: 'comunicado_turma', label: 'Avisos da Turma' },
];

export const GuardianNoticesPage: React.FC = () => {
  const { selectedStudentForGuardian, linkedStudentsForGuardian } = useSession();
  const { db } = useMockDatabase();

  const [filter, setFilter] = useState<GuardianNoticeFilter>('todos');

  const student = selectedStudentForGuardian;

  const studentClassRoom = useMemo(() => {
    if (!student) return null;
    const enrollment = db.enrollments.find(
      (e) => e.studentPersonId === student.id && e.status === 'ativa'
    );
    return db.classRooms.find((c) => c.id === enrollment?.classRoomId) ?? db.classRooms[0];
  }, [db.enrollments, db.classRooms, student]);

  // Combina os eventos do Calendário Institucional da Coordenação (db.calendarEvents) com os avisos das famílias
  const combinedNotices = useMemo<GuardianNoticeItem[]>(() => {
    const fromCoordinator: GuardianNoticeItem[] = db.calendarEvents.map((evt) => {
      const mappedCategory: GuardianNoticeItem['category'] =
        evt.category === 'reuniao_responsaveis'
          ? 'reuniao_familia'
          : evt.category === 'simulado'
          ? 'simulado_presencial'
          : evt.category === 'feriado'
          ? 'feriado'
          : 'comunicado_turma';

      const mappedLabel =
        evt.category === 'reuniao_responsaveis'
          ? 'Encontro com as Famílias'
          : evt.category === 'simulado'
          ? 'Simulado Presencial de Sábado'
          : evt.category === 'feriado'
          ? 'Aviso de Feriado'
          : 'Comunicado da Coordenação';

      return {
        id: `coord-grd-${evt.id}`,
        title: evt.title,
        plainExplanation: evt.description,
        date: evt.date,
        timeRange: evt.timeRange,
        location: evt.location,
        category: mappedCategory,
        categoryLabel: mappedLabel,
        targetClassRoomId: 'all',
        isHighlighted: true,
      };
    });

    const coordTitles = new Set(
      fromCoordinator.map((e) => e.title.trim().toLowerCase())
    );
    const nonDuplicateStatic = GUARDIAN_NOTICES_AND_MEETINGS.filter(
      (s) => !coordTitles.has(s.title.trim().toLowerCase())
    );

    return [...fromCoordinator, ...nonDuplicateStatic].sort((a, b) =>
      b.date.localeCompare(a.date)
    );
  }, [db.calendarEvents]);

  const filteredNotices = useMemo(() => {
    if (filter === 'todos') return combinedNotices;
    return combinedNotices.filter((item) => item.category === filter);
  }, [filter, combinedNotices]);

  const getBadgeVariant = (category: GuardianNoticeItem['category']) => {
    switch (category) {
      case 'reuniao_familia':
        return 'primary' as const;
      case 'simulado_presencial':
        return 'secondary' as const;
      case 'feriado':
        return 'warning' as const;
      default:
        return 'success' as const;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Cabeçalho enxuto + Segmented Control Suave (Regra 1 e 2) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1>Calendário</h1>

        <div
          role="group"
          aria-label="Escolher tipo de aviso"
          className="flex flex-wrap gap-1 rounded-md bg-track p-1"
        >
          {FILTER_BUTTONS.map((btn) => {
            const isActive = filter === btn.value;
            return (
              <button
                key={btn.value}
                type="button"
                onClick={() => setFilter(btn.value)}
                aria-pressed={isActive}
                className={`h-8 rounded px-2.5 text-xs transition-all ${
                  isActive
                    ? 'bg-surface font-semibold text-ink shadow-xs'
                    : 'font-medium text-ink-muted hover:text-ink'
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
      </div>

      <GuardianStudentSelectorBar />

      {student && linkedStudentsForGuardian.length > 0 && (
        <>
          <Card
            as="section"
            title={`Comunicados — ${studentClassRoom?.name ?? 'Turma'}`}
          >
            <div className="space-y-4">
              {/* Lista Linear de Avisos */}
              <div className="space-y-3">
                {filteredNotices.map((notice) => (
                  <article
                    key={notice.id}
                    className={`rounded-2xl border-2 p-5 transition-all space-y-3 ${
                      notice.isHighlighted
                        ? 'border-primary-600 bg-primary-50/40'
                        : 'border-slate-200 bg-slate-50/70'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge
                        variant={getBadgeVariant(notice.category)}
                        icon={
                          notice.category === 'reuniao_familia' ? (
                            <Users className="h-4 w-4" />
                          ) : (
                            <Bell className="h-4 w-4" />
                          )
                        }
                      >
                        {notice.categoryLabel}
                      </Badge>

                      <span className="inline-flex items-center gap-1.5 text-base font-extrabold text-slate-900">
                        <Calendar className="h-4 w-4 text-primary-700" aria-hidden="true" />
                        <span>Data: {formatDateBR(notice.date)}</span>
                      </span>
                    </div>

                    <h3 className="text-xl font-extrabold text-slate-900">
                      {notice.title}
                    </h3>

                    <p className="text-base sm:text-lg text-slate-800 leading-relaxed">
                      {notice.plainExplanation}
                    </p>

                    <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-700">
                      {notice.timeRange && (
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-primary-700" aria-hidden="true" />
                          <span>Horário: {notice.timeRange}</span>
                        </span>
                      )}
                      {notice.location && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-primary-700" aria-hidden="true" />
                          <span>Local: {notice.location}</span>
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Canal de Apoio Fixo */}
      <GuardianCoordinationSupportBox />
    </div>
  );
};
