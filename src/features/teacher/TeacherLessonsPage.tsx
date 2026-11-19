import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ClipboardCheck,
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
      {/* Cabeçalho enxuto (Regra 2) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1>Aulas &amp; Classroom</h1>

        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={handleOpenNewLessonModal}
        >
          Nova Aula
        </Button>
      </div>

      {/* Filtros inline */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Turma"
          value={filterClassRoomId}
          onChange={(e) => setFilterClassRoomId(e.target.value)}
          options={[
            { value: 'all', label: 'Todas as Turmas' },
            ...db.classRooms.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />

        <Select
          label="Situação"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          options={[
            { value: 'all', label: 'Todas' },
            { value: 'agendada', label: 'Agendadas' },
            { value: 'ministrada', label: 'Ministradas' },
            { value: 'cancelada', label: 'Canceladas' },
          ]}
        />
      </div>

      {/* Lista de Aulas em Linhas Horizontais Limpas (Regra 5) */}
      {filteredLessons.length > 0 ? (
        <Card noPadding>
          <ul className="divide-y divide-line">
            {filteredLessons.map((lesson) => {
              const classRoom = db.classRooms.find((c) => c.id === lesson.classRoomId);
              const subject = db.subjects.find((s) => s.id === lesson.subjectId);
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
                <li
                  key={lesson.id}
                  className="flex flex-col gap-3 p-5 transition-colors hover:bg-subtle sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-ink tabular-nums">
                        {formatDateBR(lesson.date)} • {lesson.startTime}–{lesson.endTime}
                      </span>
                      <Badge variant="academic">{subject?.name ?? 'Disciplina'}</Badge>
                      <Badge variant="neutral">{classRoom?.name ?? 'Turma'}</Badge>
                      <Badge
                        variant={
                          lesson.status === 'ministrada'
                            ? 'progress'
                            : lesson.status === 'agendada'
                            ? 'assess'
                            : 'critical'
                        }
                      >
                        {lesson.status}
                      </Badge>
                    </div>

                    <h2 className="text-base font-semibold text-ink">{lesson.topic}</h2>

                    <p className="text-xs text-ink-muted">
                      Presença:{' '}
                      <span className="font-mono tabular-nums">
                        {recordedAttendancesCount}/{enrolledCount}
                      </span>{' '}
                      registrados
                      {lesson.notes ? ` • ${lesson.notes}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {effectiveUrl && (
                      <a
                        href={effectiveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 items-center gap-1.5 rounded-md bg-academic-bg px-3 text-xs font-medium text-academic hover:bg-academic hover:text-white"
                      >
                        <span>Classroom</span>
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditLessonModal(lesson)}
                      leftIcon={<FilePenLine className="h-4 w-4" />}
                    >
                      Editar
                    </Button>

                    <Link
                      to={`/professor/chamada?lessonId=${lesson.id}`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-surface px-3 text-xs font-medium text-ink hover:bg-subtle"
                    >
                      <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Chamada</span>
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
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
