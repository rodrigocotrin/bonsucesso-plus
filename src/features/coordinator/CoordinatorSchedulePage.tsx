import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Plus,
  Save,
} from 'lucide-react';
import {
  Badge,
  Button,
  CalloutAlert,
  Card,
  Input,
  MetricCard,
  Modal,
  Select,
} from '../../components/ui';
import { ScheduleMatrix } from '../../components/shared/ScheduleMatrix';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import { useToast } from '../../contexts/ToastContext';
import { Lesson } from '../../types';
import { getDisplayName } from '../../utils/formatters';
import {
  detectScheduleConflicts,
  MATRIX_DAYS,
  MatrixDayOfWeek,
  resolveDayOfWeekFromIsoDate,
  resolveShiftFromStartTime,
  ScheduleMatrixEntry,
} from '../../utils/scheduleConflicts';
import { validateLessonTimeRange } from '../../utils/validators';

/**
 * Grade semanal base das 3 turmas do Cursinho Bonsucesso (combinada com as aulas do banco)
 * para garantir que a Matriz Semanal (Seg a Sáb x Manhã, Tarde, Noite) esteja rica e interativa.
 */
const BASE_WEEKLY_TEMPLATE_ENTRIES: Array<{
  id: string;
  dayOfWeek: MatrixDayOfWeek;
  dateIso: string;
  startTime: string;
  endTime: string;
  subjectId: string;
  classRoomId: string;
  teacherPersonId: string;
  topic: string;
  status: Lesson['status'];
}> = [
  {
    id: 'tpl-seg-esp-1',
    dayOfWeek: 'Seg',
    dateIso: '2026-11-16',
    startTime: '19:00',
    endTime: '20:30',
    subjectId: 'sub-mat',
    classRoomId: 'cls-esperanca',
    teacherPersonId: 'per-prof-01',
    topic: 'Funções e Gráficos Estatísticos no ENEM',
    status: 'ministrada',
  },
  {
    id: 'tpl-seg-ta-1',
    dayOfWeek: 'Seg',
    dateIso: '2026-11-16',
    startTime: '19:00',
    endTime: '20:30',
    subjectId: 'sub-por',
    classRoomId: 'cls-turma-a',
    teacherPersonId: 'per-prof-02',
    topic: 'Gêneros Textuais e Estratégias Argumentativas',
    status: 'ministrada',
  },
  {
    id: 'tpl-ter-esp-1',
    dayOfWeek: 'Ter',
    dateIso: '2026-11-17',
    startTime: '19:00',
    endTime: '21:00',
    subjectId: 'sub-red',
    classRoomId: 'cls-esperanca',
    teacherPersonId: 'per-prof-02',
    topic: 'Oficina de Redação: Competência 5',
    status: 'ministrada',
  },
  {
    id: 'tpl-ter-ta-2',
    dayOfWeek: 'Ter',
    dateIso: '2026-11-17',
    startTime: '20:45',
    endTime: '22:15',
    subjectId: 'sub-mat',
    classRoomId: 'cls-turma-a',
    teacherPersonId: 'per-prof-01',
    topic: 'Porcentagem e Matemática Financeira',
    status: 'ministrada',
  },
  {
    id: 'tpl-qua-esp-1',
    dayOfWeek: 'Qua',
    dateIso: '2026-11-18',
    startTime: '19:00',
    endTime: '20:30',
    subjectId: 'sub-mat',
    classRoomId: 'cls-esperanca',
    teacherPersonId: 'per-prof-01',
    topic: 'Geometria Plana e Espacial',
    status: 'ministrada',
  },
  {
    id: 'tpl-qua-ta-1',
    dayOfWeek: 'Qua',
    dateIso: '2026-11-18',
    startTime: '19:00',
    endTime: '20:30',
    subjectId: 'sub-qui',
    classRoomId: 'cls-turma-a',
    teacherPersonId: 'per-prof-06',
    topic: 'Funções Orgânicas e Estequiometria',
    status: 'ministrada',
  },
  {
    id: 'tpl-qui-esp-1',
    dayOfWeek: 'Qui',
    dateIso: '2026-11-19',
    startTime: '19:00',
    endTime: '20:30',
    subjectId: 'sub-his',
    classRoomId: 'cls-esperanca',
    teacherPersonId: 'per-prof-03',
    topic: 'Era Vargas e Redemocratização',
    status: 'agendada',
  },
  {
    id: 'tpl-qui-ta-2',
    dayOfWeek: 'Qui',
    dateIso: '2026-11-19',
    startTime: '20:45',
    endTime: '22:15',
    subjectId: 'sub-geo',
    classRoomId: 'cls-turma-a',
    teacherPersonId: 'per-prof-03',
    topic: 'Urbanização e Matrizes Energéticas',
    status: 'agendada',
  },
  {
    id: 'tpl-sex-esp-1',
    dayOfWeek: 'Sex',
    dateIso: '2026-11-20',
    startTime: '19:00',
    endTime: '20:30',
    subjectId: 'sub-bio',
    classRoomId: 'cls-esperanca',
    teacherPersonId: 'per-prof-04',
    topic: 'Ecologia e Ciclos Biogeoquímicos',
    status: 'agendada',
  },
  {
    id: 'tpl-sab-tc-1',
    dayOfWeek: 'Sáb',
    dateIso: '2026-11-21',
    startTime: '09:30',
    endTime: '12:00',
    subjectId: 'sub-fis',
    classRoomId: 'cls-turma-c',
    teacherPersonId: 'per-prof-05',
    topic: 'Eletrodinâmica e Consumo Residencial (kWh)',
    status: 'agendada',
  },
  {
    id: 'tpl-sab-tc-2',
    dayOfWeek: 'Sáb',
    dateIso: '2026-11-21',
    startTime: '13:30',
    endTime: '16:00',
    subjectId: 'sub-red',
    classRoomId: 'cls-turma-c',
    teacherPersonId: 'per-prof-02',
    topic: 'Redação Intensiva de Sábado: Repertório Legítimo',
    status: 'agendada',
  },
];

const DAY_TO_SAMPLE_DATE: Record<MatrixDayOfWeek, string> = {
  Seg: '2026-11-16',
  Ter: '2026-11-17',
  Qua: '2026-11-18',
  Qui: '2026-11-19',
  Sex: '2026-11-20',
  Sáb: '2026-11-21',
};

export const CoordinatorSchedulePage: React.FC = () => {
  const { db, addLesson } = useMockDatabase();
  const { showToast } = useToast();

  const [filterClassRoomId, setFilterClassRoomId] = useState<string>('all');
  const [filterTeacherId, setFilterTeacherId] = useState<string>('all');

  const activeTeachers = useMemo(
    () =>
      db.persons.filter(
        (p) => p.id.startsWith('per-prof-') && p.status === 'active'
      ),
    [db.persons]
  );

  // Converte as aulas do template + aulas recém-criadas na Store em ScheduleMatrixEntry[]
  const allMatrixEntries = useMemo<ScheduleMatrixEntry[]>(() => {
    const customLessons = db.lessons.filter((l) => l.id.startsWith('les-coord-'));

    const combinedRaw = [
      ...BASE_WEEKLY_TEMPLATE_ENTRIES,
      ...customLessons.map((l) => ({
        id: l.id,
        dayOfWeek: resolveDayOfWeekFromIsoDate(l.date),
        dateIso: l.date,
        startTime: l.startTime,
        endTime: l.endTime,
        subjectId: l.subjectId,
        classRoomId: l.classRoomId,
        teacherPersonId: l.teacherPersonId,
        topic: l.topic,
        status: l.status,
      })),
    ];

    return combinedRaw.map((item) => {
      const subject = db.subjects.find((s) => s.id === item.subjectId);
      const classRoom = db.classRooms.find((c) => c.id === item.classRoomId);
      const teacher = db.persons.find((p) => p.id === item.teacherPersonId);

      return {
        id: item.id,
        dayOfWeek: item.dayOfWeek,
        shiftSlot: resolveShiftFromStartTime(item.startTime),
        dateIso: item.dateIso,
        startTime: item.startTime,
        endTime: item.endTime,
        subjectId: item.subjectId,
        subjectName: subject?.name ?? 'Disciplina',
        classRoomId: item.classRoomId,
        classRoomName: classRoom?.name ?? 'Turma',
        teacherPersonId: item.teacherPersonId,
        teacherName: getDisplayName(teacher),
        topic: item.topic,
        status: item.status,
      };
    });
  }, [db.lessons, db.subjects, db.classRooms, db.persons]);

  const filteredEntries = useMemo(() => {
    return allMatrixEntries.filter((entry) => {
      const matchesClass =
        filterClassRoomId === 'all' || entry.classRoomId === filterClassRoomId;
      const matchesTeacher =
        filterTeacherId === 'all' || entry.teacherPersonId === filterTeacherId;
      return matchesClass && matchesTeacher;
    });
  }, [allMatrixEntries, filterClassRoomId, filterTeacherId]);

  // Resumo Mensal (Aulas Agendadas, Realizadas e Chamadas Pendentes)
  const monthlySummary = useMemo(() => {
    const scheduledCount = db.lessons.filter((l) => l.status === 'agendada').length;
    const completedCount = db.lessons.filter(
      (l) => l.status === 'ministrada'
    ).length;
    const pendingAttendanceCount = db.lessons.filter((lesson) => {
      const enrolled = db.enrollments.filter(
        (e) => e.classRoomId === lesson.classRoomId && e.status === 'ativa'
      ).length;
      const recorded = db.attendances.filter(
        (a) => a.lessonId === lesson.id
      ).length;
      return lesson.status === 'agendada' || recorded < enrolled;
    }).length;

    return {
      scheduledCount: scheduledCount + 5,
      completedCount: completedCount + 12,
      pendingAttendanceCount,
    };
  }, [db.lessons, db.enrollments, db.attendances]);

  // Modal de "Agendar Aula"
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dayChoice, setDayChoice] = useState<MatrixDayOfWeek>('Seg');
  const [classRoomId, setClassRoomId] = useState('cls-esperanca');
  const [subjectId, setSubjectId] = useState('sub-mat');
  const [teacherPersonId, setTeacherPersonId] = useState('per-prof-01');
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('20:30');
  const [topic, setTopic] = useState('');
  const [timeError, setTimeError] = useState('');

  // Pré-visualização em tempo real se a nova aula gerará conflito de professor ou turma
  const liveConflictPreview = useMemo(() => {
    if (!isModalOpen) return [];
    const candidate: ScheduleMatrixEntry = {
      id: 'candidate-preview',
      dayOfWeek: dayChoice,
      shiftSlot: resolveShiftFromStartTime(startTime),
      dateIso: DAY_TO_SAMPLE_DATE[dayChoice],
      startTime,
      endTime,
      subjectId,
      subjectName:
        db.subjects.find((s) => s.id === subjectId)?.name ?? 'Disciplina',
      classRoomId,
      classRoomName:
        db.classRooms.find((c) => c.id === classRoomId)?.name ?? 'Turma',
      teacherPersonId,
      teacherName: getDisplayName(
        db.persons.find((p) => p.id === teacherPersonId)
      ),
      topic: topic || 'Nova Aula',
      status: 'agendada',
    };
    const { conflicts } = detectScheduleConflicts([
      ...allMatrixEntries,
      candidate,
    ]);
    return conflicts.filter((c) =>
      c.involvedEntryIds.includes('candidate-preview')
    );
  }, [
    isModalOpen,
    dayChoice,
    startTime,
    endTime,
    subjectId,
    classRoomId,
    teacherPersonId,
    topic,
    allMatrixEntries,
    db.subjects,
    db.classRooms,
    db.persons,
  ]);

  const handleScheduleLesson = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateLessonTimeRange(startTime, endTime);
    if (!check.isValid) {
      setTimeError(check.errorMessage ?? 'Horário inválido');
      return;
    }

    const newLesson: Lesson = {
      id: `les-coord-${Date.now()}`,
      classSubjectId: 'cs-esp-mat',
      classRoomId,
      subjectId,
      teacherPersonId,
      date: DAY_TO_SAMPLE_DATE[dayChoice],
      startTime,
      endTime,
      topic: topic.trim() || 'Aula Programada pela Coordenação',
      status: 'agendada',
    };

    addLesson(newLesson);
    setIsModalOpen(false);
    setTopic('');
    setTimeError('');

    if (liveConflictPreview.length > 0) {
      showToast({
        variant: 'warning',
        title: 'Aula agendada com alerta de conflito de horário!',
        description:
          'A matriz semanal destacou em vermelho as células sobrepostas para ajuste.',
      });
    } else {
      showToast({
        variant: 'success',
        title: 'Aula agendada na grade horária!',
        description: 'A matriz semanal foi atualizada sem conflitos.',
      });
    }
  };

  // Atalho rápido para simular um conflito na matriz e demonstrar a detecção visual
  const handleSimulateConflictDemo = () => {
    const conflictLesson: Lesson = {
      id: `les-coord-conflict-${Date.now()}`,
      classSubjectId: 'cs-ta-mat',
      classRoomId: 'cls-turma-a',
      subjectId: 'sub-mat',
      teacherPersonId: 'per-prof-01', // Prof. Carlos já dá aula na Turma Esperança na Segunda 19:00-20:30!
      date: '2026-11-16', // Segunda-feira
      startTime: '19:30',
      endTime: '20:30',
      topic: 'Simulação de Sobreposição Docente (Prof. Carlos em 2 turmas)',
      status: 'agendada',
    };
    addLesson(conflictLesson);
    setFilterClassRoomId('all');
    setFilterTeacherId('all');
    showToast({
      variant: 'warning',
      title: 'Conflito simulado inserido na Segunda-feira (Noite)!',
      description:
        'Veja o CalloutAlert no topo da matriz e o destaque vermelho nas células.',
    });
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="primary" icon={<CalendarCheck className="h-4 w-4" />}>
            Matriz de Horários & Detecção de Conflitos (UC15)
          </Badge>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Grade Horária e Aulas
          </h1>
          <p className="mt-1 max-w-3xl text-base text-slate-600 dark:text-slate-300">
            Visualize a matriz semanal (Segunda a Sábado x Manhã, Tarde e Noite). O sistema detecta
            automaticamente caso o mesmo professor ou a mesma turma tenham aulas sobrepostas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="ghost"
            onClick={handleSimulateConflictDemo}
            leftIcon={<AlertTriangle className="h-4 w-4" />}
          >
            Simular Conflito de Horário
          </Button>

          <Button
            variant="primary"
            size="lg"
            leftIcon={<Plus className="h-5 w-5" />}
            onClick={() => setIsModalOpen(true)}
          >
            Agendar Aula
          </Button>
        </div>
      </div>

      {/* Resumo Mensal (Aulas Agendadas, Realizadas e Chamadas Pendentes) */}
      <section aria-label="Resumo mensal de aulas do cursinho">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            title="Aulas Agendadas no Mês"
            value={`${monthlySummary.scheduledCount} aulas`}
            scale="raw"
            accentColor="primary"
            icon={<Calendar className="h-6 w-6" />}
            statusBadge={{ label: 'Cronograma ativo', variant: 'primary' }}
            subtitle="Encontros previstos na grade das 3 turmas."
          />

          <MetricCard
            title="Aulas Realizadas / Ministradas"
            value={`${monthlySummary.completedCount} aulas`}
            scale="raw"
            accentColor="success"
            icon={<CheckCircle2 className="h-6 w-6" />}
            statusBadge={{ label: 'Conteúdo registrado', variant: 'success' }}
            subtitle="Aulas concluídas com plano de ensino no diário."
          />

          <MetricCard
            title="Chamadas Pendentes"
            value={`${monthlySummary.pendingAttendanceCount} chamadas`}
            scale="raw"
            accentColor={
              monthlySummary.pendingAttendanceCount > 0 ? 'warning' : 'success'
            }
            icon={<ClipboardCheck className="h-6 w-6" />}
            statusBadge={{
              label:
                monthlySummary.pendingAttendanceCount > 0
                  ? 'Aguardando docente'
                  : '100% em dia',
              variant:
                monthlySummary.pendingAttendanceCount > 0 ? 'warning' : 'success',
            }}
            subtitle="Aulas aguardando fechamento da lista de presença."
          />
        </div>
      </section>

      {/* Filtros por Turma e por Professor + Componente Reutilizável ScheduleMatrix */}
      <Card
        as="section"
        title="Matriz Semanal de Horários (Seg a Sáb x Manhã, Tarde, Noite)"
        subtitle="Filtre por turma ou professor voluntário para inspecionar a alocação semanal."
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Filtrar por Turma"
              value={filterClassRoomId}
              onChange={(e) => setFilterClassRoomId(e.target.value)}
              options={[
                { value: 'all', label: 'Todas as Turmas (Visão Completa de Conflitos)' },
                ...db.classRooms.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />

            <Select
              label="Filtrar por Professor(a) Voluntário(a)"
              value={filterTeacherId}
              onChange={(e) => setFilterTeacherId(e.target.value)}
              options={[
                { value: 'all', label: 'Todos os Professores Voluntários' },
                ...activeTeachers.map((t) => ({
                  value: t.id,
                  label: getDisplayName(t),
                })),
              ]}
            />
          </div>

          <ScheduleMatrix entries={filteredEntries} />
        </div>
      </Card>

      {/* MODAL PARA AGENDAR AULA COM DETECÇÃO DE CONFLITO EM TEMPO REAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="lg"
        title="Agendar Aula na Grade Horária (UC15)"
        description="Escolha o dia da semana, horário, turma, disciplina e professor voluntário."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleScheduleLesson}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Confirmar Agendamento
            </Button>
          </>
        }
      >
        <form onSubmit={handleScheduleLesson} className="space-y-4" noValidate>
          {liveConflictPreview.length > 0 && (
            <CalloutAlert
              variant="warning"
              title="Atenção: Este horário gera sobreposição na grade semanal!"
            >
              <ul className="list-disc list-inside text-xs sm:text-sm space-y-1">
                {liveConflictPreview.map((c) => (
                  <li key={c.id}>{c.description}</li>
                ))}
              </ul>
            </CalloutAlert>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              label="Dia da Semana"
              required
              value={dayChoice}
              onChange={(e) => setDayChoice(e.target.value as MatrixDayOfWeek)}
              options={MATRIX_DAYS.map((d) => ({
                value: d.key,
                label: d.fullLabel,
              }))}
            />

            <Input
              label="Horário de Início"
              type="time"
              required
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                setTimeError('');
              }}
            />

            <Input
              label="Horário de Término"
              type="time"
              required
              value={endTime}
              onChange={(e) => {
                setEndTime(e.target.value);
                setTimeError('');
              }}
              errorText={timeError}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              label="Turma"
              required
              value={classRoomId}
              onChange={(e) => setClassRoomId(e.target.value)}
              options={db.classRooms.map((c) => ({ value: c.id, label: c.name }))}
            />

            <Select
              label="Disciplina ENEM"
              required
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              options={db.subjects.map((s) => ({ value: s.id, label: s.name }))}
            />

            <Select
              label="Professor(a) Voluntário(a)"
              required
              value={teacherPersonId}
              onChange={(e) => setTeacherPersonId(e.target.value)}
              options={activeTeachers.map((t) => ({
                value: t.id,
                label: getDisplayName(t),
              }))}
            />
          </div>

          <Input
            label="Tópico / Conteúdo Programático da Aula"
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex: Revisão Geral de Funções e Probabilidade para o ENEM"
          />
        </form>
      </Modal>
    </div>
  );
};
