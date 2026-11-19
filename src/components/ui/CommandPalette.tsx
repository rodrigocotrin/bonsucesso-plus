import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  CornerDownLeft,
  GraduationCap,
  HeartHandshake,
  Layers,
  Moon,
  Plus,
  Printer,
  Search,
  Settings,
  Sun,
  UserCircle,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { VARIANTS } from '../../lib/motion';
import { getDisplayName } from '../../lib/person';
import { triggerPrintReport } from '../../lib/exportCsv';
import { ClassRoom, Enrollment, Person, Subject, UserRole } from '../../types';
import { cn } from '../../utils/formatters';
import { useFocusTrap } from './useFocusTrap';

export type CommandGroup = 'Ações Rápidas' | 'Navegação' | 'Registros';

export interface CommandItem {
  id: string;
  group: CommandGroup;
  label: string;
  sublabel?: string;
  keywords?: string;
  icon: React.ReactNode;
  badgeText?: string;
  onSelect: () => void;
}

export interface CommandPaletteNavEntry {
  id: string;
  label: string;
  sublabel: string;
  path: string;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  role: UserRole;
  navEntries: CommandPaletteNavEntry[];
  students: Person[];
  enrollments: Enrollment[];
  classRooms: ClassRoom[];
  subjects: Subject[];
  linkedStudentsForGuardian?: Person[];
  resolvedTheme: 'light' | 'dark';
  onToggleTheme: () => void;
  onNavigate: (path: string) => void;
  /** Ao selecionar um aluno, abre o Slide-over Drawer dele imediatamente */
  onSelectStudent: (studentPersonId: string) => void;
  onSelectGuardianStudent?: (studentPersonId: string) => void;
}

const GROUP_ORDER: CommandGroup[] = ['Ações Rápidas', 'Navegação', 'Registros'];

/**
 * CommandPalette Global (`Ctrl+K` / `Cmd+K`) — Filtrado por RBAC com navegação 100% por teclado.
 */
export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  role,
  navEntries,
  students,
  enrollments,
  classRooms,
  subjects,
  linkedStudentsForGuardian = [],
  resolvedTheme,
  onToggleTheme,
  onNavigate,
  onSelectStudent,
  onSelectGuardianStudent,
}) => {
  const dialogId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  useFocusTrap(isOpen, containerRef, onClose);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      const t = window.setTimeout(() => {
        inputRef.current?.focus();
      }, 25);
      return () => window.clearTimeout(t);
    }
  }, [isOpen]);

  const allItems = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    // 1. AÇÕES RÁPIDAS (Filtradas por RBAC)
    if (role === 'coordinator') {
      items.push(
        {
          id: 'act-new-student',
          group: 'Ações Rápidas',
          label: 'Novo Aluno',
          sublabel: 'Abrir ficha de cadastro de estudante',
          keywords: 'cadastrar criar aluno estudante novo',
          icon: <UserPlus className="h-4 w-4 text-progress" />,
          badgeText: 'Ação',
          onSelect: () => {
            onClose();
            onNavigate('/coordenacao/alunos?action=new');
          },
        },
        {
          id: 'act-new-enrollment',
          group: 'Ações Rápidas',
          label: 'Nova Matrícula',
          sublabel: 'Vincular aluno a uma turma do período letivo',
          keywords: 'matricular turma vaga inscricao',
          icon: <Plus className="h-4 w-4 text-academic" />,
          badgeText: 'Ação',
          onSelect: () => {
            onClose();
            onNavigate('/coordenacao/matriculas?action=new');
          },
        },
        {
          id: 'act-new-donation',
          group: 'Ações Rápidas',
          label: 'Registrar Doação',
          sublabel: 'Lançar apoio material ou financeiro na operação',
          keywords: 'doacao copa merenda apoio financeiro material',
          icon: <HeartHandshake className="h-4 w-4 text-assess-ink" />,
          badgeText: 'Ação',
          onSelect: () => {
            onClose();
            onNavigate('/coordenacao?action=new-donation');
          },
        }
      );
    }

    if (role === 'teacher') {
      items.push(
        {
          id: 'act-teacher-attendance',
          group: 'Ações Rápidas',
          label: 'Fazer Chamada',
          sublabel: 'Lançamento rápido de frequência (P / F / J)',
          keywords: 'chamada presenca falta frequencia',
          icon: <ClipboardCheck className="h-4 w-4 text-progress" />,
          badgeText: 'Ação',
          onSelect: () => {
            onClose();
            onNavigate('/professor/chamada');
          },
        },
        {
          id: 'act-teacher-grades',
          group: 'Ações Rápidas',
          label: 'Lançar Notas em Lote',
          sublabel: 'Simulados ENEM, redações e listas',
          keywords: 'notas avaliacoes simulado enem redacao',
          icon: <GraduationCap className="h-4 w-4 text-assess-ink" />,
          badgeText: 'Ação',
          onSelect: () => {
            onClose();
            onNavigate('/professor/avaliacoes');
          },
        }
      );
    }

    if (role === 'student') {
      items.push(
        {
          id: 'act-student-schedule',
          group: 'Ações Rápidas',
          label: 'Ver Grade Semanal',
          sublabel: 'Horários de aulas e salas da sua turma',
          keywords: 'grade aulas horario semana',
          icon: <BookOpen className="h-4 w-4 text-academic" />,
          badgeText: 'Ação',
          onSelect: () => {
            onClose();
            onNavigate('/aluno/aulas');
          },
        },
        {
          id: 'act-student-classroom',
          group: 'Ações Rápidas',
          label: 'Materiais & Google Classroom',
          sublabel: 'Apostilas, listas de exercícios e links externos',
          keywords: 'classroom google materiais apostila pdf',
          icon: <Layers className="h-4 w-4 text-academic" />,
          badgeText: 'Ação',
          onSelect: () => {
            onClose();
            onNavigate('/aluno/materias');
          },
        }
      );
    }

    if (role === 'guardian') {
      items.push(
        {
          id: 'act-guardian-attendance',
          group: 'Ações Rápidas',
          label: 'Consultar Frequência do(a) Estudante',
          sublabel: 'Histórico de presenças, faltas e justificativas',
          keywords: 'frequencia presenca faltas justificativa',
          icon: <ClipboardCheck className="h-4 w-4 text-progress" />,
          badgeText: 'Ação',
          onSelect: () => {
            onClose();
            onNavigate('/responsavel/frequencia');
          },
        },
        {
          id: 'act-guardian-grades',
          group: 'Ações Rápidas',
          label: 'Consultar Simulados & Notas',
          sublabel: 'Boletim de evolução nos simulados ENEM',
          keywords: 'notas simulados enem boletim redacao',
          icon: <GraduationCap className="h-4 w-4 text-assess-ink" />,
          badgeText: 'Ação',
          onSelect: () => {
            onClose();
            onNavigate('/responsavel/simulados');
          },
        }
      );
    }

    // Ações globais permitidas a todos os perfis
    items.push(
      {
        id: 'act-toggle-theme',
        group: 'Ações Rápidas',
        label:
          resolvedTheme === 'dark'
            ? 'Alternar para Tema Claro'
            : 'Alternar para Tema Escuro (Quadro-Negro Suíço)',
        sublabel: 'Muda instantaneamente a aparência da interface',
        keywords: 'tema escuro claro dark light aparencia modo',
        icon:
          resolvedTheme === 'dark' ? (
            <Sun className="h-4 w-4 text-assess-ink" />
          ) : (
            <Moon className="h-4 w-4 text-academic" />
          ),
        badgeText: 'Tema',
        onSelect: () => {
          onToggleTheme();
          onClose();
        },
      },
      {
        id: 'act-print',
        group: 'Ações Rápidas',
        label: 'Imprimir Visualização Atual',
        sublabel: 'Gera relatório limpo para impressão ou PDF',
        keywords: 'imprimir pdf relatorio impressao',
        icon: <Printer className="h-4 w-4 text-ink-muted" />,
        badgeText: 'Print',
        onSelect: () => {
          onClose();
          window.setTimeout(() => triggerPrintReport(), 120);
        },
      }
    );

    // 2. NAVEGAÇÃO (Módulos e Sub-abas do Perfil Ativo)
    for (const nav of navEntries) {
      items.push({
        id: `nav-${nav.id}`,
        group: 'Navegação',
        label: nav.label,
        sublabel: nav.sublabel,
        keywords: `${nav.label} ${nav.sublabel} modulo aba pagina`,
        icon: <ArrowRight className="h-4 w-4 text-ink-muted" />,
        badgeText: 'Ir para',
        onSelect: () => {
          onClose();
          onNavigate(nav.path);
        },
      });
    }

    // 3. REGISTROS (Filtrados por RBAC)
    if (role === 'coordinator' || role === 'teacher') {
      for (const student of students) {
        const displayName = getDisplayName(student);
        const enrollment = enrollments.find((e) => e.studentPersonId === student.id);
        const cls = classRooms.find((c) => c.id === enrollment?.classRoomId);

        items.push({
          id: `rec-student-${student.id}`,
          group: 'Registros',
          label: displayName,
          sublabel: `${cls?.name ?? 'Turma Esperança'} • Matrícula ${
            enrollment?.enrollmentCode ?? 'BS-2026'
          }`,
          keywords: `${displayName} ${student.fullName} ${student.cpf} ${
            enrollment?.enrollmentCode ?? ''
          } aluno estudante`,
          icon: <UserCircle className="h-4 w-4 text-progress" />,
          badgeText: 'Ficha do Aluno',
          onSelect: () => {
            onClose();
            onSelectStudent(student.id);
          },
        });
      }

      for (const cls of classRooms) {
        items.push({
          id: `rec-class-${cls.id}`,
          group: 'Registros',
          label: cls.name,
          sublabel: `${cls.shift} • ${cls.roomLabel} (${cls.scheduleSummary})`,
          keywords: `${cls.name} ${cls.shift} ${cls.roomLabel} turma sala`,
          icon: <Users className="h-4 w-4 text-academic" />,
          badgeText: 'Turma',
          onSelect: () => {
            onClose();
            onNavigate(
              role === 'coordinator'
                ? `/coordenacao/turmas`
                : `/professor/chamada?classRoomId=${cls.id}`
            );
          },
        });
      }

      for (const subject of subjects) {
        items.push({
          id: `rec-subject-${subject.id}`,
          group: 'Registros',
          label: subject.name,
          sublabel: `Área ENEM: ${subject.area} • ${subject.workloadHours}h`,
          keywords: `${subject.name} ${subject.area} disciplina materia enem`,
          icon: <BookOpen className="h-4 w-4 text-academic" />,
          badgeText: 'Disciplina',
          onSelect: () => {
            onClose();
            onNavigate(
              role === 'coordinator' ? '/coordenacao/disciplinas' : '/professor/aulas'
            );
          },
        });
      }
    } else if (role === 'student') {
      for (const subject of subjects.filter((s) => (s.status ?? 'active') === 'active')) {
        items.push({
          id: `rec-std-subject-${subject.id}`,
          group: 'Registros',
          label: subject.name,
          sublabel: `Área ENEM: ${subject.area}`,
          keywords: `${subject.name} ${subject.area} disciplina materia aula`,
          icon: <BookOpen className="h-4 w-4 text-academic" />,
          badgeText: 'Disciplina',
          onSelect: () => {
            onClose();
            onNavigate('/aluno/materias');
          },
        });
      }
    } else if (role === 'guardian') {
      for (const linked of linkedStudentsForGuardian) {
        const displayName = getDisplayName(linked);
        const enrollment = enrollments.find((e) => e.studentPersonId === linked.id);
        const cls = classRooms.find((c) => c.id === enrollment?.classRoomId);

        items.push({
          id: `rec-grd-student-${linked.id}`,
          group: 'Registros',
          label: `Alternar para ${displayName}`,
          sublabel: `${cls?.name ?? 'Turma Esperança'} • Matrícula ${
            enrollment?.enrollmentCode ?? 'BS-2026'
          }`,
          keywords: `${displayName} ${linked.fullName} estudante filho dependente`,
          icon: <UserCircle className="h-4 w-4 text-progress" />,
          badgeText: 'Estudante',
          onSelect: () => {
            onSelectGuardianStudent?.(linked.id);
            onClose();
          },
        });
      }
    }

    return items;
  }, [
    role,
    resolvedTheme,
    navEntries,
    students,
    enrollments,
    classRooms,
    subjects,
    linkedStudentsForGuardian,
    onClose,
    onNavigate,
    onToggleTheme,
    onSelectStudent,
    onSelectGuardianStudent,
  ]);

  const filteredItems = useMemo<CommandItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Sem busca: exibe principais Ações Rápidas, Navegação e primeiros Registros
      const quick = allItems.filter((i) => i.group === 'Ações Rápidas');
      const nav = allItems.filter((i) => i.group === 'Navegação').slice(0, 6);
      const recs = allItems.filter((i) => i.group === 'Registros').slice(0, 6);
      return [...quick, ...nav, ...recs];
    }

    return allItems
      .filter((item) => {
        const haystack = `${item.label} ${item.sublabel ?? ''} ${
          item.keywords ?? ''
        }`.toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 18);
  }, [allItems, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const activeButton = itemRefs.current[activeIndex];
    activeButton?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (filteredItems.length === 0) return;
      setActiveIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (filteredItems.length === 0) return;
      setActiveIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (event.key === 'Enter') {
      if (filteredItems[activeIndex]) {
        event.preventDefault();
        filteredItems[activeIndex].onSelect();
      }
    }
  };

  // Agrupa mantendo o índice global para navegação contínua com ↑ / ↓
  const groupedSections = useMemo(() => {
    let runningIndex = 0;
    return GROUP_ORDER.map((groupName) => {
      const groupItems = filteredItems
        .filter((i) => i.group === groupName)
        .map((item) => {
          const itemWithIdx = { item, flatIndex: runningIndex };
          runningIndex += 1;
          return itemWithIdx;
        });
      return { groupName, groupItems };
    }).filter((sec) => sec.groupItems.length > 0);
  }, [filteredItems]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="command-palette-backdrop"
          variants={VARIANTS.backdrop}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed inset-0 z-50 flex items-start justify-center bg-backdrop backdrop-blur-[2px] p-4 pt-[10vh]"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            key="command-palette-dialog"
            ref={containerRef}
            variants={VARIANTS.modalPanel}
            initial="initial"
            animate="animate"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogId}
            onKeyDown={handleKeyDown}
            className="flex max-h-[76vh] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-sm"
          >
            {/* Barra de Busca com Ícone e Botão Esc */}
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
              <label htmlFor={dialogId} className="sr-only">
                Busca rápida e comandos
              </label>
              <input
                ref={inputRef}
                id={dialogId}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar aluno (nome social), turma, disciplina ou comando..."
                autoComplete="off"
                className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  aria-label="Limpar termo de busca"
                  title="Limpar termo de busca"
                  className="inline-flex h-6 w-6 items-center justify-center rounded text-ink-muted hover:bg-subtle hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar paleta de comandos"
                title="Fechar (Esc)"
                className="num rounded border border-line bg-subtle px-1.5 py-0.5 text-[11px] font-medium text-ink-muted hover:text-ink"
              >
                Esc
              </button>
            </div>

            {/* Lista de Resultados Agrupada */}
            <div
              role="listbox"
              aria-label="Resultados e ações disponíveis"
              className="flex-1 overflow-y-auto p-2 scrollbar-thin"
            >
              {groupedSections.length > 0 ? (
                <div className="space-y-3">
                  {groupedSections.map(({ groupName, groupItems }) => (
                    <div key={groupName}>
                      <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                        {groupName}
                      </div>
                      <div className="space-y-0.5">
                        {groupItems.map(({ item, flatIndex }) => {
                          const isSelected = flatIndex === activeIndex;
                          return (
                            <button
                              key={item.id}
                              ref={(el) => {
                                itemRefs.current[flatIndex] = el;
                              }}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onMouseEnter={() => setActiveIndex(flatIndex)}
                              onClick={() => item.onSelect()}
                              className={cn(
                                'flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left transition-colors duration-100',
                                isSelected
                                  ? 'bg-track text-ink'
                                  : 'text-ink hover:bg-subtle'
                              )}
                            >
                              <div className="flex min-w-0 items-center gap-2.5">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-line bg-surface">
                                  {item.icon}
                                </span>
                                <div className="min-w-0">
                                  <span className="block truncate text-xs font-semibold text-ink">
                                    {item.label}
                                  </span>
                                  {item.sublabel && (
                                    <span className="block truncate text-[11px] text-ink-muted">
                                      {item.sublabel}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex shrink-0 items-center gap-1.5">
                                {item.badgeText && (
                                  <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-medium text-ink-muted border border-line">
                                    {item.badgeText}
                                  </span>
                                )}
                                {isSelected && (
                                  <CornerDownLeft
                                    className="h-3.5 w-3.5 text-ink-muted"
                                    aria-hidden="true"
                                  />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-xs font-medium text-ink">
                    Nenhum resultado encontrado para &ldquo;{query}&rdquo;
                  </p>
                  <p className="mt-1 text-[11px] text-ink-muted">
                    Busque por nome social de aluno, turma, disciplina ou ação permitida ao seu perfil.
                  </p>
                </div>
              )}
            </div>

            {/* Rodapé com Legenda de Atalhos de Teclado */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-paper px-4 py-2 text-[11px] text-ink-muted">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <kbd className="num rounded border border-line bg-surface px-1 py-0.5 text-[10px] font-semibold text-ink">
                    ↑↓
                  </kbd>
                  <span>Navegar</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="num rounded border border-line bg-surface px-1 py-0.5 text-[10px] font-semibold text-ink">
                    Enter
                  </kbd>
                  <span>Executar</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="num rounded border border-line bg-surface px-1 py-0.5 text-[10px] font-semibold text-ink">
                    Esc
                  </kbd>
                  <span>Fechar</span>
                </span>
              </div>
              <span className="inline-flex items-center gap-1">
                <Settings className="h-3 w-3" aria-hidden="true" />
                <span>Escopo RBAC ativo</span>
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
