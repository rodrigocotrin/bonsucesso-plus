import React, { useMemo, useState } from 'react';
import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  MapPin,
  RefreshCw,
  Sparkles,
  User,
} from 'lucide-react';
import {
  Badge,
  BadgeVariant,
  Button,
  EmptyState,
} from '../../components/ui';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import { useToast } from '../../contexts/ToastContext';
import { formatDateBR } from '../../utils/formatters';
import { STUDENT_ANNOUNCEMENTS_FEED, StudentAnnouncement } from './studentData';

type EventCategoryFilter =
  | 'todos'
  | 'comunicado'
  | 'simulado'
  | 'aula_especial'
  | 'visita_pedagogica'
  | 'feriado';

const CATEGORY_FILTER_OPTIONS: Array<{ value: EventCategoryFilter; label: string }> = [
  { value: 'todos', label: 'Todos os Avisos e Eventos' },
  { value: 'simulado', label: 'Simulados ENEM' },
  { value: 'comunicado', label: 'Comunicados da Coordenação' },
  { value: 'aula_especial', label: 'Aulões Especiais' },
  { value: 'visita_pedagogica', label: 'Visitas Pedagógicas' },
  { value: 'feriado', label: 'Feriados e Rodas Culturais' },
];

export const StudentEventsPage: React.FC = () => {
  const { db } = useMockDatabase();
  const { showToast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<EventCategoryFilter>('todos');
  const [readIds, setReadIds] = useState<string[]>([]);

  // Combina os eventos criados/editados no Calendário Institucional da Coordenação (db.calendarEvents) com o feed de comunicados
  const combinedFeed = useMemo<StudentAnnouncement[]>(() => {
    const fromCoordinatorEvents: StudentAnnouncement[] = db.calendarEvents.map((evt) => {
      const mappedCategory: StudentAnnouncement['category'] =
        evt.category === 'simulado'
          ? 'simulado'
          : evt.category === 'aula_especial'
          ? 'aula_especial'
          : evt.category === 'visita_pedagogica'
          ? 'visita_pedagogica'
          : evt.category === 'feriado'
          ? 'feriado'
          : 'comunicado';

      const mappedLabel =
        evt.category === 'simulado'
          ? 'Simulado ENEM'
          : evt.category === 'aula_especial'
          ? 'Aulão Especial'
          : evt.category === 'visita_pedagogica'
          ? 'Visita Pedagógica'
          : evt.category === 'feriado'
          ? 'Feriado / Atividade Cultural'
          : 'Calendário da Coordenação';

      return {
        id: `coord-evt-${evt.id}`,
        title: evt.title,
        summary: evt.description,
        date: evt.date,
        author: 'Coordenação Pedagógica Bonsucesso',
        category: mappedCategory,
        categoryLabel: mappedLabel,
        location: evt.location,
        timeRange: evt.timeRange,
        isNew: true,
      };
    });

    // Evita duplicar títulos idênticos do seed inicial
    const coordTitles = new Set(
      fromCoordinatorEvents.map((e) => e.title.trim().toLowerCase())
    );
    const nonDuplicateStatic = STUDENT_ANNOUNCEMENTS_FEED.filter(
      (s) => !coordTitles.has(s.title.trim().toLowerCase())
    );

    return [...fromCoordinatorEvents, ...nonDuplicateStatic].sort((a, b) =>
      b.date.localeCompare(a.date)
    );
  }, [db.calendarEvents]);

  const filteredFeed = useMemo(() => {
    if (selectedCategory === 'todos') return combinedFeed;
    return combinedFeed.filter((item) => item.category === selectedCategory);
  }, [selectedCategory, combinedFeed]);

  const getCategoryBadgeVariant = (
    category: StudentAnnouncement['category']
  ): BadgeVariant => {
    switch (category) {
      case 'simulado':
        return 'secondary';
      case 'aula_especial':
        return 'primary';
      case 'visita_pedagogica':
        return 'success';
      case 'feriado':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  const handleMarkAsRead = (item: StudentAnnouncement) => {
    if (!readIds.includes(item.id)) {
      setReadIds((prev) => [...prev, item.id]);
      showToast({
        variant: 'success',
        title: 'Aviso marcado como lido!',
        description: `"${item.title}" foi registrado nos seus avisos conferidos.`,
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho enxuto + Segmented Control Suave (Regra 1 e 2) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1>Calendário</h1>

        <div
          role="group"
          aria-label="Filtrar eventos por categoria"
          className="flex flex-wrap gap-1 rounded-md bg-track p-1"
        >
          {CATEGORY_FILTER_OPTIONS.map((option) => {
            const isActive = selectedCategory === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedCategory(option.value)}
                aria-pressed={isActive}
                className={`h-8 rounded px-2.5 text-xs transition-colors ${
                  isActive
                    ? 'bg-surface font-semibold text-ink shadow-xs'
                    : 'font-medium text-ink-muted hover:text-ink'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed Cronológico de Comunicados e Eventos */}
      {filteredFeed.length > 0 ? (
        <div className="space-y-4">
          {filteredFeed.map((item) => {
            const isUnreadNew = Boolean(item.isNew && !readIds.includes(item.id));
            return (
              <article
                key={item.id}
                className={`rounded-2xl border-2 p-5 sm:p-6 transition-all ${
                  isUnreadNew
                    ? 'border-primary-600 bg-primary-50/40 shadow-sm'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={getCategoryBadgeVariant(item.category)}
                      icon={
                        item.category === 'simulado' ? (
                          <GraduationCap className="h-4 w-4" />
                        ) : (
                          <Bell className="h-4 w-4" />
                        )
                      }
                    >
                      {item.categoryLabel}
                    </Badge>

                    {isUnreadNew && (
                      <Badge variant="success" icon={<Sparkles className="h-4 w-4" />}>
                        Aviso Novo
                      </Badge>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700">
                    <Calendar className="h-4 w-4 text-primary-700" aria-hidden="true" />
                    <span>Data: {formatDateBR(item.date)}</span>
                  </span>
                </div>

                <h2 className="text-xl font-extrabold text-slate-900">
                  {item.title}
                </h2>

                <p className="mt-2 text-base text-slate-700 leading-relaxed">
                  {item.summary}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <User className="h-4 w-4 text-primary-700" aria-hidden="true" />
                      <span>{item.author}</span>
                    </span>

                    {item.timeRange && (
                      <span className="inline-flex items-center gap-1.5 font-semibold">
                        <Clock className="h-4 w-4 text-primary-700" aria-hidden="true" />
                        <span>{item.timeRange}</span>
                      </span>
                    )}

                    {item.location && (
                      <span className="inline-flex items-center gap-1.5 font-semibold">
                        <MapPin className="h-4 w-4 text-primary-700" aria-hidden="true" />
                        <span>{item.location}</span>
                      </span>
                    )}
                  </div>

                  {isUnreadNew && (
                    <Button
                      variant="ghost"
                      onClick={() => handleMarkAsRead(item)}
                      leftIcon={<CheckCircle2 className="h-4 w-4" />}
                    >
                      Marcar como lido
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Nenhum evento ou aviso nesta categoria"
          description="Não há comunicados registrados para o filtro selecionado no momento."
          action={
            <Button
              variant="primary"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => setSelectedCategory('todos')}
            >
              Mostrar Todos os Avisos
            </Button>
          }
        />
      )}
    </div>
  );
};
