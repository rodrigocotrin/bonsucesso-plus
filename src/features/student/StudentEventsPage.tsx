import React, { useMemo, useState } from 'react';
import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  MapPin,
  Megaphone,
  RefreshCw,
  Sparkles,
  User,
} from 'lucide-react';
import {
  Badge,
  BadgeVariant,
  Button,
  Card,
  EmptyState,
} from '../../components/ui';
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
  const { showToast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<EventCategoryFilter>('todos');
  const [readIds, setReadIds] = useState<string[]>([]);

  const filteredFeed = useMemo(() => {
    if (selectedCategory === 'todos') return STUDENT_ANNOUNCEMENTS_FEED;
    return STUDENT_ANNOUNCEMENTS_FEED.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

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
      {/* Cabeçalho */}
      <div>
        <Badge variant="primary" icon={<Megaphone className="h-4 w-4" />}>
          Mural Comunitário & Agenda ENEM
        </Badge>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Eventos Presenciais e Avisos da Coordenação
        </h1>
        <p className="mt-1 max-w-3xl text-base text-slate-600 dark:text-slate-300">
          Fique por dentro dos comunicados da equipe pedagógica, datas dos simulados presenciais,
          aulões de sábado, visitas à universidade e feriados.
        </p>
      </div>

      {/* Filtros por Categoria */}
      <Card
        as="section"
        title="Filtrar por Categoria"
        subtitle="Selecione o tipo de comunicado ou evento presencial que deseja visualizar."
      >
        <div
          role="group"
          aria-label="Filtrar eventos e avisos por categoria"
          className="flex flex-wrap gap-2"
        >
          {CATEGORY_FILTER_OPTIONS.map((option) => {
            const isActive = selectedCategory === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedCategory(option.value)}
                aria-pressed={isActive}
                className={`min-h-[44px] rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all ${
                  isActive
                    ? 'border-primary-700 bg-primary-700 text-white shadow-xs dark:border-primary-500 dark:bg-primary-600'
                    : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </Card>

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
                    ? 'border-primary-600 bg-primary-50/40 shadow-sm dark:border-primary-500 dark:bg-primary-950/30'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
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

                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-300">
                    <Calendar className="h-4 w-4 text-primary-700 dark:text-primary-400" aria-hidden="true" />
                    <span>Data: {formatDateBR(item.date)}</span>
                  </span>
                </div>

                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {item.title}
                </h2>

                <p className="mt-2 text-base text-slate-700 dark:text-slate-200 leading-relaxed">
                  {item.summary}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <User className="h-4 w-4 text-primary-700 dark:text-primary-400" aria-hidden="true" />
                      <span>{item.author}</span>
                    </span>

                    {item.timeRange && (
                      <span className="inline-flex items-center gap-1.5 font-semibold">
                        <Clock className="h-4 w-4 text-primary-700 dark:text-primary-400" aria-hidden="true" />
                        <span>{item.timeRange}</span>
                      </span>
                    )}

                    {item.location && (
                      <span className="inline-flex items-center gap-1.5 font-semibold">
                        <MapPin className="h-4 w-4 text-primary-700 dark:text-primary-400" aria-hidden="true" />
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
