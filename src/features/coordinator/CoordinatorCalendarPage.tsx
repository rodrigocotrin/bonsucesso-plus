import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  FilePenLine,
  MapPin,
  Plus,
  Save,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  Badge,
  BadgeVariant,
  Button,
  CalloutAlert,
  Card,
  Input,
  Modal,
  Select,
} from '../../components/ui';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import { useToast } from '../../contexts/ToastContext';
import { CalendarEvent, CalendarEventCategory } from '../../types';
import { formatDateBR } from '../../utils/formatters';
import { validateLessonTimeRange } from '../../utils/validators';

const EVENT_CATEGORY_META: Record<
  CalendarEventCategory,
  { label: string; badgeVariant: BadgeVariant }
> = {
  simulado: { label: 'Simulado ENEM', badgeVariant: 'secondary' },
  reuniao_pedagogica: { label: 'Reunião Pedagógica', badgeVariant: 'primary' },
  reuniao_responsaveis: {
    label: 'Reunião de Pais / Responsáveis',
    badgeVariant: 'primary',
  },
  visita_pedagogica: {
    label: 'Visita Pedagógica / Universidade',
    badgeVariant: 'success',
  },
  aula_especial: { label: 'Aulão Especial / Revisão', badgeVariant: 'primary' },
  feriado: { label: 'Feriado / Roda Cultural', badgeVariant: 'warning' },
  prazo_enem: { label: 'Prazo Oficial INEP / ENEM', badgeVariant: 'danger' },
  comunidade: { label: 'Encontro Comunitário', badgeVariant: 'neutral' },
};

export const CoordinatorCalendarPage: React.FC = () => {
  const { db, addCalendarEvent, updateCalendarEvent } = useMockDatabase();
  const { showToast } = useToast();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredEvents = useMemo(() => {
    return [...db.calendarEvents]
      .filter(
        (evt) => categoryFilter === 'all' || evt.category === categoryFilter
      )
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [db.calendarEvents, categoryFilter]);

  // Modal de Cadastro / Edição de Evento Institucional
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CalendarEventCategory>('simulado');
  const [date, setDate] = useState('2026-11-28');
  const [startTime, setStartTime] = useState('13:00');
  const [endTime, setEndTime] = useState('18:30');
  const [location, setLocation] = useState(
    'Auditório Comunitário Bonsucesso'
  );
  const [targetAudience, setTargetAudience] =
    useState<CalendarEvent['targetAudience']>('todos');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  const handleOpenCreateModal = () => {
    setEditingEventId(null);
    setTitle('');
    setCategory('simulado');
    setDate('2026-11-29');
    setStartTime('09:00');
    setEndTime('12:30');
    setLocation('Sala 01 — Térreo do Cursinho Bonsucesso');
    setTargetAudience('todos');
    setDescription('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (evt: CalendarEvent) => {
    setEditingEventId(evt.id);
    setTitle(evt.title);
    setCategory(evt.category);
    setDate(evt.date);
    // Tenta extrair HH:mm de timeRange caso esteja no formato "09:00 às 12:30" ou "09h00 às 12h30"
    const normalizedTimes = evt.timeRange
      .replace(/h/g, ':')
      .split(/\s+às\s+|\s*-\s*/);
    setStartTime(normalizedTimes[0]?.trim() || '09:00');
    setEndTime(normalizedTimes[1]?.trim() || '12:00');
    setLocation(evt.location);
    setTargetAudience(evt.targetAudience);
    setDescription(evt.description);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (title.trim().length < 5) {
      setFormError('Informe o título do evento (mínimo 5 caracteres).');
      return;
    }

    const timeCheck = validateLessonTimeRange(startTime, endTime);
    if (!timeCheck.isValid) {
      setFormError(timeCheck.errorMessage ?? 'Horário inválido.');
      return;
    }

    if (location.trim().length < 3) {
      setFormError('Informe o local do evento.');
      return;
    }

    const formattedTimeRange = `${startTime.replace(':', 'h')} às ${endTime.replace(
      ':',
      'h'
    )}`;

    const payload: CalendarEvent = {
      id: editingEventId ?? `evt-${Date.now()}`,
      title: title.trim(),
      category,
      date,
      timeRange: formattedTimeRange,
      location: location.trim(),
      targetAudience,
      description:
        description.trim() ||
        'Evento institucional organizado pela Coordenação do Cursinho Comunitário Bonsucesso.',
    };

    if (editingEventId) {
      updateCalendarEvent(payload);
      showToast({
        variant: 'success',
        title: 'Evento institucional atualizado!',
        description: `"${payload.title}" já foi atualizado nos portais de Alunos e Responsáveis.`,
      });
    } else {
      addCalendarEvent(payload);
      showToast({
        variant: 'success',
        title: 'Novo evento publicado no calendário!',
        description: `"${payload.title}" já está visível automaticamente na aba Eventos e Avisos de Alunos e Responsáveis!`,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="primary" icon={<Calendar className="h-4 w-4" />}>
            Agenda Comunitária Sincronizada (UC16)
          </Badge>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Calendário Institucional de Eventos
          </h1>
          <p className="mt-1 max-w-3xl text-base text-slate-600 dark:text-slate-300">
            Cadastre e edite Simulados ENEM, Reuniões Pedagógicas, Reuniões de Pais/Responsáveis,
            Visitas Pedagógicas e Feriados. Tudo o que é publicado aqui aparece imediatamente para
            os Alunos e Responsáveis.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          leftIcon={<Plus className="h-5 w-5" />}
          onClick={handleOpenCreateModal}
        >
          Cadastrar Novo Evento
        </Button>
      </div>

      <CalloutAlert
        variant="info"
        title="Sincronização Instantânea com o Portal do Aluno e do Responsável"
      >
        Quando você cadastra um evento como <strong>Simulado ENEM</strong>,{' '}
        <strong>Reunião de Responsáveis</strong> ou <strong>Visita Pedagógica</strong>, ele passa a
        ser exibido automaticamente na tela <em>"Eventos e Avisos"</em> do perfil Aluno e na tela{' '}
        <em>"Avisos e Reuniões"</em> do perfil Responsável.
      </CalloutAlert>

      {/* Filtro por Tipo de Evento */}
      <Card
        as="section"
        title="Filtrar Calendário por Tipo de Evento"
        subtitle="Selecione uma categoria para visualizar os compromissos agendados."
      >
        <div className="max-w-md">
          <Select
            label="Tipo de Evento Institucional"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Todos os Eventos do Semestre' },
              { value: 'simulado', label: 'Simulados ENEM' },
              { value: 'reuniao_pedagogica', label: 'Reuniões Pedagógicas (Docentes)' },
              { value: 'reuniao_responsaveis', label: 'Reuniões de Pais e Responsáveis' },
              { value: 'visita_pedagogica', label: 'Visitas Pedagógicas / Universidades' },
              { value: 'aula_especial', label: 'Aulões Especiais' },
              { value: 'feriado', label: 'Feriados e Rodas Culturais' },
            ]}
          />
        </div>
      </Card>

      {/* Lista de Eventos */}
      <div className="grid grid-cols-1 gap-4">
        {filteredEvents.map((evt) => {
          const meta =
            EVENT_CATEGORY_META[evt.category] ?? EVENT_CATEGORY_META.comunidade;

          return (
            <article
              key={evt.id}
              className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
                  <Badge variant="neutral" icon={<Users className="h-3.5 w-3.5" />}>
                    Público: {evt.targetAudience.toUpperCase()}
                  </Badge>
                </div>

                <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-primary-900 dark:text-primary-300">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  <span>Data: {formatDateBR(evt.date)}</span>
                </span>
              </div>

              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {evt.title}
              </h2>

              <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                {evt.description}
              </p>

              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary-700 dark:text-primary-400" aria-hidden="true" />
                    <span>Horário: {evt.timeRange}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary-700 dark:text-primary-400" aria-hidden="true" />
                    <span>Local: {evt.location}</span>
                  </span>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => handleOpenEditModal(evt)}
                  leftIcon={<FilePenLine className="h-4 w-4" />}
                >
                  Editar Evento
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      {/* MODAL PARA CADASTRAR / EDITAR EVENTO DO CALENDÁRIO */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="lg"
        title={
          editingEventId
            ? 'Editar Evento do Calendário Institucional'
            : 'Cadastrar Novo Evento Institucional (UC16)'
        }
        description="Preencha os detalhes do evento. Ele ficará visível automaticamente para os estudantes e responsáveis."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveEvent}
              leftIcon={<Save className="h-4 w-4" />}
            >
              {editingEventId ? 'Salvar Alterações' : 'Publicar Evento no Calendário'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveEvent} className="space-y-4" noValidate>
          {formError && (
            <CalloutAlert variant="error" title="Verifique os dados do evento">
              {formError}
            </CalloutAlert>
          )}

          <Input
            label="Título do Evento ou Comunicado"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: 5º Simulado Geral ENEM ou Reunião de Pais e Responsáveis"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Tipo de Evento"
              required
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as CalendarEventCategory)
              }
              options={[
                { value: 'simulado', label: 'Simulado ENEM' },
                { value: 'reuniao_pedagogica', label: 'Reunião Pedagógica (Professores)' },
                { value: 'reuniao_responsaveis', label: 'Reunião de Pais e Responsáveis' },
                { value: 'visita_pedagogica', label: 'Visita Pedagógica / Universidade' },
                { value: 'aula_especial', label: 'Aulão Especial / Revisão' },
                { value: 'feriado', label: 'Feriado / Atividade Cultural' },
              ]}
            />

            <Select
              label="Público-Alvo Principal"
              required
              value={targetAudience}
              onChange={(e) =>
                setTargetAudience(
                  e.target.value as CalendarEvent['targetAudience']
                )
              }
              options={[
                { value: 'todos', label: 'Toda a Comunidade (Alunos, Famílias e Docentes)' },
                { value: 'alunos', label: 'Estudantes' },
                { value: 'responsaveis', label: 'Pais, Mães e Responsáveis' },
                { value: 'professores', label: 'Professores Voluntários' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Data do Evento"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <Input
              label="Horário de Início"
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />

            <Input
              label="Horário de Término"
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <Input
            label="Local do Evento"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ex: Auditório Comunitário Bonsucesso ou Sala 01 — Térreo"
          />

          <Input
            label="Descrição e Orientações Práticas"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Traga documento com foto e caneta preta de tubo transparente. Lanche comunitário servido na copa."
          />

          <div className="flex items-center gap-2 text-xs text-primary-800 dark:text-primary-300 pt-1">
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Dica de teste: Após publicar, troque para o perfil <strong>Aluno</strong> ou{' '}
              <strong>Responsável</strong> na barra superior para ver este evento publicado!
            </span>
          </div>
        </form>
      </Modal>
    </div>
  );
};
