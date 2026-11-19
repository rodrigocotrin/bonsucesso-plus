import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  ClipboardCheck,
  Clock,
  ExternalLink,
  FilePenLine,
  Link2,
  Plus,
  RefreshCw,
  Save,
} from 'lucide-react';
import {
  Badge,
  Button,
  CalloutAlert,
  Card,
  EmptyState,
  Input,
  Modal,
  Select,
} from '../../components/ui';
import { useSession } from '../../contexts/SessionContext';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import { useToast } from '../../contexts/ToastContext';
import { Lesson } from '../../types';
import { formatDateBR } from '../../utils/formatters';
import {
  validateLessonTimeRange,
  validateOptionalExternalUrl,
} from '../../utils/validators';
import { Link } from 'react-router-dom';

export const TeacherLessonsPage: React.FC = () => {
  const { currentPerson } = useSession();
  const { db, addLesson, updateLesson } = useMockDatabase();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filterClassRoomId, setFilterClassRoomId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Estado do Modal de Cadastrar/Editar Aula
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [formClassRoomId, setFormClassRoomId] = useState<string>('cls-esperanca');
  const [formSubjectId, setFormSubjectId] = useState<string>('sub-mat');
  const [formTopic, setFormTopic] = useState<string>('');
  const [formDate, setFormDate] = useState<string>('2026-11-20');
  const [formStartTime, setFormStartTime] = useState<string>('19:00');
  const [formEndTime, setFormEndTime] = useState<string>('20:30');
  const [formStatus, setFormStatus] = useState<Lesson['status']>('agendada');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formExternalUrl, setFormExternalUrl] = useState<string>('');

  // Erros de validação em tempo real
  const [topicError, setTopicError] = useState<string>('');
  const [timeError, setTimeError] = useState<string>('');
  const [urlError, setUrlError] = useState<string>('');

  useEffect(() => {
    if (searchParams.get('nova') === '1') {
      handleOpenNewLessonModal();
      searchParams.delete('nova');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  if (!currentPerson) return null;

  const filteredLessons = useMemo(() => {
    return db.lessons
      .filter((lesson) => {
        const matchesClass =
          filterClassRoomId === 'all' || lesson.classRoomId === filterClassRoomId;
        const matchesStatus =
          filterStatus === 'all' || lesson.status === filterStatus;
        return matchesClass && matchesStatus;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [db.lessons, filterClassRoomId, filterStatus]);

  const handleOpenNewLessonModal = () => {
    setEditingLessonId(null);
    setFormClassRoomId('cls-esperanca');
    setFormSubjectId('sub-mat');
    setFormTopic('');
    setFormDate('2026-11-20');
    setFormStartTime('19:00');
    setFormEndTime('20:30');
    setFormStatus('agendada');
    setFormNotes('');
    setFormExternalUrl('');
    setTopicError('');
    setTimeError('');
    setUrlError('');
    setIsModalOpen(true);
  };

  const handleOpenEditLessonModal = (lesson: Lesson) => {
    setEditingLessonId(lesson.id);
    setFormClassRoomId(lesson.classRoomId);
    setFormSubjectId(lesson.subjectId);
    setFormTopic(lesson.topic);
    setFormDate(lesson.date);
    setFormStartTime(lesson.startTime);
    setFormEndTime(lesson.endTime);
    setFormStatus(lesson.status);
    setFormNotes(lesson.notes ?? '');
    setFormExternalUrl(lesson.externalUrl ?? '');
    setTopicError('');
    setTimeError('');
    setUrlError('');
    setIsModalOpen(true);
  };

  const handleExternalUrlChange = (value: string) => {
    setFormExternalUrl(value);
    const check = validateOptionalExternalUrl(value);
    setUrlError(check.isValid ? '' : check.errorMessage ?? 'URL inválida');
  };

  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    if (formTopic.trim().length < 5) {
      setTopicError('Informe o título ou tópico do plano de ensino (mínimo 5 caracteres).');
      hasError = true;
    } else {
      setTopicError('');
    }

    const timeCheck = validateLessonTimeRange(formStartTime, formEndTime);
    if (!timeCheck.isValid) {
      setTimeError(timeCheck.errorMessage ?? 'Horário inválido');
      hasError = true;
    } else {
      setTimeError('');
    }

    const urlCheck = validateOptionalExternalUrl(formExternalUrl);
    if (!urlCheck.isValid) {
      setUrlError(urlCheck.errorMessage ?? 'Link inválido');
      hasError = true;
    } else {
      setUrlError('');
    }

    if (hasError) return;

    const matchingClassSubject = db.classSubjects.find(
      (cs) =>
        cs.classRoomId === formClassRoomId && cs.subjectId === formSubjectId
    );

    const payload: Lesson = {
      id: editingLessonId ?? `les-${Date.now()}`,
      classSubjectId: matchingClassSubject?.id ?? 'cs-esp-mat',
      classRoomId: formClassRoomId,
      subjectId: formSubjectId,
      teacherPersonId: currentPerson.id,
      date: formDate,
      startTime: formStartTime,
      endTime: formEndTime,
      topic: formTopic.trim(),
      notes: formNotes.trim() || undefined,
      externalUrl: formExternalUrl.trim() || undefined,
      status: formStatus,
    };

    if (editingLessonId) {
      updateLesson(payload);
      showToast({
        variant: 'success',
        title: 'Aula atualizada com sucesso!',
        description: `"${payload.topic}" foi salva no diário da turma.`,
      });
    } else {
      addLesson(payload);
      showToast({
        variant: 'success',
        title: 'Nova aula cadastrada no diário!',
        description: `"${payload.topic}" já está visível para os alunos da turma.`,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="primary" icon={<BookOpen className="h-4 w-4" />}>
            Gestão de Aulas e Plano de Ensino (UC15)
          </Badge>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Minhas Aulas
          </h1>
          <p className="mt-1 max-w-2xl text-base text-slate-600 dark:text-slate-300">
            Cadastre o conteúdo programático das aulas, adicione links do Google Sala de Aula ou
            YouTube e acesse rapidamente a lista de chamada.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          leftIcon={<Plus className="h-5 w-5" />}
          onClick={handleOpenNewLessonModal}
        >
          Cadastrar Nova Aula
        </Button>
      </div>

      {/* Filtros por Turma e Status */}
      <Card
        as="section"
        title="Filtrar Aulas do Diário"
        subtitle="Selecione a turma ou o status da aula para localizar um encontro rapidamente."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Filtrar por Turma"
            value={filterClassRoomId}
            onChange={(e) => setFilterClassRoomId(e.target.value)}
            options={[
              { value: 'all', label: 'Todas as Turmas do Cursinho' },
              ...db.classRooms.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />

          <Select
            label="Filtrar por Status da Aula"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: 'all', label: 'Todos os Status (Ministradas e Agendadas)' },
              { value: 'agendada', label: 'Aulas Agendadas (Próximos Encontros)' },
              { value: 'ministrada', label: 'Aulas Ministradas (Concluídas)' },
              { value: 'cancelada', label: 'Aulas Canceladas / Feriado' },
            ]}
          />
        </div>
      </Card>

      {/* Lista de Aulas */}
      {filteredLessons.length > 0 ? (
        <div className="space-y-4">
          {filteredLessons.map((lesson) => {
            const classRoom = db.classRooms.find((c) => c.id === lesson.classRoomId);
            const subject = db.subjects.find((s) => s.id === lesson.subjectId);
            const teacher = db.persons.find((p) => p.id === lesson.teacherPersonId);
            const classSubject = db.classSubjects.find(
              (cs) => cs.id === lesson.classSubjectId
            );
            const effectiveUrl = lesson.externalUrl || classSubject?.classroomUrl;

            const enrolledCount = db.enrollments.filter(
              (e) => e.classRoomId === lesson.classRoomId && e.status === 'ativa'
            ).length;
            const recordedAttendancesCount = db.attendances.filter(
              (a) => a.lessonId === lesson.id
            ).length;

            return (
              <article
                key={lesson.id}
                className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-primary-900 dark:text-primary-300">
                      <Calendar className="h-4 w-4" aria-hidden="true" />
                      <span>{formatDateBR(lesson.date)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-600 dark:text-slate-300">
                      <Clock className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {lesson.startTime} às {lesson.endTime}
                      </span>
                    </span>
                    <Badge variant="primary">{subject?.name ?? 'Disciplina'}</Badge>
                    <Badge variant="neutral">{classRoom?.name ?? 'Turma'}</Badge>
                  </div>

                  <Badge
                    variant={
                      lesson.status === 'ministrada'
                        ? 'success'
                        : lesson.status === 'agendada'
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {lesson.status === 'ministrada'
                      ? 'Aula Ministrada'
                      : lesson.status === 'agendada'
                      ? 'Aula Agendada'
                      : 'Aula Cancelada'}
                  </Badge>
                </div>

                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    {lesson.topic}
                  </h2>
                  {lesson.notes && (
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                      {lesson.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    <span>Docente: <strong>{teacher?.fullName ?? 'Professor(a)'}</strong></span>
                    <span className="mx-2">•</span>
                    <span>
                      Chamada:{' '}
                      <strong>
                        {recordedAttendancesCount} de {enrolledCount} alunos registrados
                      </strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {effectiveUrl && (
                      <a
                        href={effectiveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        <span>Material / Classroom</span>
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </a>
                    )}

                    <Button
                      variant="ghost"
                      onClick={() => handleOpenEditLessonModal(lesson)}
                      leftIcon={<FilePenLine className="h-4 w-4" />}
                    >
                      Editar Aula
                    </Button>

                    <Link
                      to={`/professor/chamada?lessonId=${lesson.id}`}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-primary-700 px-4 py-2 text-sm font-bold text-white hover:bg-primary-800 dark:bg-primary-600"
                    >
                      <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                      <span>Fazer Chamada</span>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Nenhuma aula encontrada para este filtro"
          description="Altere o filtro de turma ou cadastre uma nova aula no botão acima."
          action={
            <Button
              variant="primary"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => {
                setFilterClassRoomId('all');
                setFilterStatus('all');
              }}
            >
              Limpar Filtros
            </Button>
          }
        />
      )}

      {/* MODAL PARA CADASTRAR OU EDITAR AULA (Com validação real de URL e horários) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="lg"
        title={editingLessonId ? 'Editar Aula do Plano de Ensino' : 'Cadastrar Nova Aula'}
        description="Preencha os dados da aula. Ela ficará disponível imediatamente para chamada e para consulta pelos alunos."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveLesson}
              leftIcon={<Save className="h-4 w-4" />}
            >
              {editingLessonId ? 'Salvar Alterações' : 'Cadastrar Aula'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveLesson} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Turma"
              required
              value={formClassRoomId}
              onChange={(e) => setFormClassRoomId(e.target.value)}
              options={db.classRooms.map((c) => ({ value: c.id, label: c.name }))}
            />

            <Select
              label="Disciplina (Alinhada ao ENEM)"
              required
              value={formSubjectId}
              onChange={(e) => setFormSubjectId(e.target.value)}
              options={db.subjects.map((s) => ({
                value: s.id,
                label: `${s.name} (${s.area})`,
              }))}
            />
          </div>

          <Input
            label="Título / Tópico do Plano de Ensino"
            required
            value={formTopic}
            onChange={(e) => {
              setFormTopic(e.target.value);
              if (e.target.value.trim().length >= 5) setTopicError('');
            }}
            errorText={topicError}
            placeholder="Ex: Geometria Espacial e Probabilidade — Resolução de Questões ENEM"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Data da Aula"
              type="date"
              required
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
            />

            <Input
              label="Horário de Início"
              type="time"
              required
              value={formStartTime}
              onChange={(e) => {
                setFormStartTime(e.target.value);
                setTimeError('');
              }}
            />

            <Input
              label="Horário de Término"
              type="time"
              required
              value={formEndTime}
              onChange={(e) => {
                setFormEndTime(e.target.value);
                setTimeError('');
              }}
              errorText={timeError}
            />
          </div>

          <Select
            label="Status da Aula"
            required
            value={formStatus}
            onChange={(e) => setFormStatus(e.target.value as Lesson['status'])}
            options={[
              { value: 'agendada', label: 'Agendada (Próxima aula)' },
              { value: 'ministrada', label: 'Ministrada (Aula concluída)' },
              { value: 'cancelada', label: 'Cancelada' },
            ]}
          />

          <Input
            label="Descrição ou Orientações de Estudo para os Alunos"
            optionalText="Opcional"
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            placeholder="Ex: Trazer lista impressa nº 04 e revisar fórmulas de volume de cilindro."
          />

          <Input
            label="Link Externo (Google Sala de Aula, YouTube ou Material Complementar)"
            optionalText="Opcional"
            type="url"
            value={formExternalUrl}
            onChange={(e) => handleExternalUrlChange(e.target.value)}
            errorText={urlError}
            leftIcon={<Link2 className="h-5 w-5" />}
            placeholder="Ex: https://classroom.google.com/c/bonsucesso-matematica"
            helperText="Se informado, deve começar com https:// ou http:// para abrir com segurança no celular dos alunos."
          />

          {urlError && (
            <CalloutAlert variant="error" title="Verifique o formato do Link Externo">
              {urlError}
            </CalloutAlert>
          )}
        </form>
      </Modal>
    </div>
  );
};
