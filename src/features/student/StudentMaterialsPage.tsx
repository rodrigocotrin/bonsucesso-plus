import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  ExternalLink,
  FileText,
  FolderOpen,
  ListChecks,
  RefreshCw,
  Video,
} from 'lucide-react';
import {
  Badge,
  Button,
  CalloutAlert,
  Card,
  EmptyState,
  SearchBar,
} from '../../components/ui';
import { useSession } from '../../contexts/SessionContext';
import { useMockDatabase } from '../../contexts/MockDatabaseContext';
import { formatDateBR } from '../../utils/formatters';
import { STUDENT_STUDY_MATERIALS, StudentStudyMaterial } from './studentData';

const SUBJECT_FILTER_CHIPS = [
  'Todas',
  'Redação',
  'Matemática',
  'Português',
  'História',
  'Geografia',
  'Física',
  'Química',
  'Biologia',
] as const;

type SubjectFilterChip = (typeof SUBJECT_FILTER_CHIPS)[number];

export const StudentMaterialsPage: React.FC = () => {
  const { currentPerson } = useSession();
  const { db } = useMockDatabase();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialChipFromUrl = (searchParams.get('disciplina') as SubjectFilterChip) || 'Todas';
  const [selectedSubject, setSelectedSubject] = useState<SubjectFilterChip>(
    SUBJECT_FILTER_CHIPS.includes(initialChipFromUrl) ? initialChipFromUrl : 'Todas'
  );
  const [searchQuery, setSearchQuery] = useState('');

  if (!currentPerson) return null;

  const activeEnrollment = db.enrollments.find(
    (e) => e.studentPersonId === currentPerson.id && e.status === 'ativa'
  );
  const studentClassRoom =
    db.classRooms.find((c) => c.id === activeEnrollment?.classRoomId) ??
    db.classRooms[0];

  const handleSelectSubjectChip = (chip: SubjectFilterChip) => {
    setSelectedSubject(chip);
    if (chip === 'Todas') {
      searchParams.delete('disciplina');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ disciplina: chip }, { replace: true });
    }
  };

  // Filtra materiais por disciplina e termo de busca
  const filteredMaterials = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return STUDENT_STUDY_MATERIALS.filter((item) => {
      const matchesSubject =
        selectedSubject === 'Todas' || item.subjectName === selectedSubject;
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.subjectName.toLowerCase().includes(query) ||
        item.teacherName.toLowerCase().includes(query);
      return matchesSubject && matchesSearch;
    });
  }, [selectedSubject, searchQuery]);

  // Agrupa materiais filtrados por disciplina para leitura estruturada
  const groupedBySubject = useMemo(() => {
    const map = new Map<string, StudentStudyMaterial[]>();
    for (const mat of filteredMaterials) {
      const existing = map.get(mat.subjectName) ?? [];
      existing.push(mat);
      map.set(mat.subjectName, existing);
    }
    return Array.from(map.entries());
  }, [filteredMaterials]);

  const getMaterialTypeIcon = (type: StudentStudyMaterial['type']) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5" aria-hidden="true" />;
      case 'lista_exercicios':
        return <ListChecks className="h-5 w-5" aria-hidden="true" />;
      default:
        return <FileText className="h-5 w-5" aria-hidden="true" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <Badge variant="primary" icon={<BookOpen className="h-4 w-4" />}>
          {studentClassRoom.name} • Caderno Digital de Estudos
        </Badge>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Meus Materiais de Estudo e Revisão
        </h1>
        <p className="mt-1 max-w-3xl text-base text-slate-600 dark:text-slate-300">
          Encontre todas as apostilas, resumos, listas de exercícios comentadas e vídeos organizados
          pelos professores voluntários para fortalecer sua preparação para o ENEM.
        </p>
      </div>

      {/* 1. BANNER INFORMATIVO DO GOOGLE SALA DE AULA */}
      <CalloutAlert
        variant="info"
        title={`Integração oficial com o Google Sala de Aula (${studentClassRoom.name})`}
        action={
          <a
            href="https://classroom.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-secondary-700 px-4 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-secondary-800 dark:bg-secondary-600 dark:hover:bg-secondary-500 transition-colors"
          >
            <FolderOpen className="h-4 w-4" aria-hidden="true" />
            <span>Acessar Google Sala de Aula da Turma</span>
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        }
      >
        Todos os nossos cadernos em PDF e listas de exercícios do Cursinho Comunitário Bonsucesso
        ficam armazenados gratuitamente no <strong>Google Sala de Aula</strong>. Ao clicar em{' '}
        <strong>"Abrir material"</strong> abaixo, você será direcionado(a) diretamente para a pasta
        da disciplina.
      </CalloutAlert>

      {/* 2. BARRA DE BUSCA POR ASSUNTO + CHIPS DE FILTRO POR DISCIPLINA */}
      <Card
        as="section"
        title="Buscar e Filtrar Materiais"
        subtitle="Procure por um tema específico (ex: Funções, Redação, Vargas, Ecologia) ou escolha uma disciplina."
      >
        <div className="space-y-5">
          <div className="max-w-2xl">
            <SearchBar
              label="Buscar por assunto, título do material ou nome do(a) professor(a)"
              value={searchQuery}
              onValueChange={setSearchQuery}
              placeholder="Ex: Competência 5, Funções, Ecologia, Era Vargas..."
            />
          </div>

          <div>
            <span className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2.5">
              Filtrar por disciplina do ENEM:
            </span>
            <div
              role="group"
              aria-label="Filtrar materiais por disciplina"
              className="flex flex-wrap gap-2"
            >
              {SUBJECT_FILTER_CHIPS.map((chip) => {
                const isActive = selectedSubject === chip;
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleSelectSubjectChip(chip)}
                    aria-pressed={isActive}
                    className={`min-h-[44px] rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all ${
                      isActive
                        ? 'border-primary-700 bg-primary-700 text-white shadow-xs dark:border-primary-500 dark:bg-primary-600'
                        : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* 3. LISTA ORGANIZADA POR DISCIPLINA */}
      {groupedBySubject.length > 0 ? (
        <div className="space-y-6">
          {groupedBySubject.map(([subjectName, materials]) => {
            const areaLabel = materials[0]?.area ?? 'Área do ENEM';
            const classSubjectLink = db.classSubjects.find((cs) => {
              const subj = db.subjects.find((s) => s.id === cs.subjectId);
              return subj?.name === subjectName;
            })?.classroomUrl;

            return (
              <Card
                key={subjectName}
                as="section"
                title={`${subjectName} (${materials.length} ${
                  materials.length === 1 ? 'material' : 'materiais'
                })`}
                subtitle={`Área do ENEM: ${areaLabel}`}
                headerAction={
                  classSubjectLink ? (
                    <a
                      href={classSubjectLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-primary-300 bg-primary-50 px-3.5 py-2 text-xs font-bold text-primary-900 hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-950 dark:text-primary-200"
                    >
                      <span>Pasta da disciplina no Classroom</span>
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  ) : undefined
                }
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {materials.map((item) => (
                    <article
                      key={item.id}
                      className="flex flex-col justify-between rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60"
                    >
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-primary-800 dark:text-primary-300">
                            {getMaterialTypeIcon(item.type)}
                            <span>{item.typeLabel}</span>
                          </div>
                          {item.isNew && <Badge variant="success">Novo material</Badge>}
                        </div>

                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                          {item.title}
                        </h4>

                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          {item.teacherName} • {formatDateBR(item.postedAt)}
                        </span>

                        {item.externalUrl && (
                          <a
                            href={item.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 py-2 text-sm font-bold text-white hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-500 transition-colors"
                          >
                            <span>Abrir material</span>
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Nenhum material encontrado com esses filtros"
          description={`Não encontramos apostilas ou vídeos para "${
            searchQuery || selectedSubject
          }". Limpe a busca ou selecione "Todas" as disciplinas para ver o acervo completo.`}
          action={
            <Button
              variant="primary"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => {
                setSearchQuery('');
                handleSelectSubjectChip('Todas');
              }}
            >
              Ver Todos os Materiais
            </Button>
          }
        />
      )}
    </div>
  );
};
