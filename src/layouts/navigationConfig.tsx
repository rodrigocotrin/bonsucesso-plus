import React from 'react';
import {
  BarChart3,
  BookOpen,
  Calendar,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Layers,
  Users,
} from 'lucide-react';
import { UserRole } from '../types';

export interface NavSubTab {
  id: string;
  label: string;
  path: string;
}

export interface NavMenuItem {
  id: string;
  label: string;
  shortMobileLabel: string;
  path: string;
  description: string;
  icon: React.ReactNode;
  /** Cor da barra vertical de 3px à esquerda quando o módulo está ativo */
  accentBarClass?: string;
  showInMobileBottomBar?: boolean;
  matchPaths?: string[];
  subTabs?: NavSubTab[];
}

export const ROLE_NAVIGATION_MENUS: Record<UserRole, NavMenuItem[]> = {
  coordinator: [
    {
      id: 'crd-panel',
      label: 'Painel',
      shortMobileLabel: 'Painel',
      path: '/coordenacao',
      description: 'Indicadores gerais, acolhimento prioritário e operações.',
      icon: <LayoutDashboard className="h-4 w-4" />,
      accentBarClass: 'bg-ink',
      showInMobileBottomBar: true,
    },
    {
      id: 'crd-people',
      label: 'Pessoas',
      shortMobileLabel: 'Pessoas',
      path: '/coordenacao/alunos',
      matchPaths: [
        '/coordenacao/pessoas',
        '/coordenacao/alunos',
        '/coordenacao/professores',
        '/coordenacao/responsaveis',
      ],
      description: 'Alunos, professores voluntários e responsáveis.',
      icon: <Users className="h-4 w-4" />,
      accentBarClass: 'bg-[#15803D]',
      showInMobileBottomBar: true,
      subTabs: [
        { id: 'tab-students', label: 'Alunos', path: '/coordenacao/alunos' },
        { id: 'tab-teachers', label: 'Professores', path: '/coordenacao/professores' },
        { id: 'tab-guardians', label: 'Responsáveis', path: '/coordenacao/responsaveis' },
      ],
    },
    {
      id: 'crd-academic',
      label: 'Acadêmico',
      shortMobileLabel: 'Acadêmico',
      path: '/coordenacao/turmas',
      matchPaths: [
        '/coordenacao/academico',
        '/coordenacao/turmas',
        '/coordenacao/grade-horaria',
        '/coordenacao/matriculas',
        '/coordenacao/disciplinas',
      ],
      description: 'Turmas, matrículas, disciplinas e grade horária.',
      icon: <Layers className="h-4 w-4" />,
      accentBarClass: 'bg-[#1D4ED8]',
      showInMobileBottomBar: true,
      subTabs: [
        { id: 'tab-classes', label: 'Turmas & Horários', path: '/coordenacao/turmas' },
        { id: 'tab-enrollments', label: 'Matrículas', path: '/coordenacao/matriculas' },
        { id: 'tab-subjects', label: 'Disciplinas', path: '/coordenacao/disciplinas' },
        { id: 'tab-schedule', label: 'Aulas', path: '/coordenacao/grade-horaria' },
      ],
    },
    {
      id: 'crd-performance',
      label: 'Desempenho',
      shortMobileLabel: 'Desempenho',
      path: '/coordenacao/desempenho',
      description: 'Frequência e notas gerais dos simulados.',
      icon: <BarChart3 className="h-4 w-4" />,
      accentBarClass: 'bg-[#15803D]',
      showInMobileBottomBar: true,
    },
    {
      id: 'crd-calendar',
      label: 'Calendário',
      shortMobileLabel: 'Calendário',
      path: '/coordenacao/calendario',
      description: 'Simulados, reuniões e eventos.',
      icon: <Calendar className="h-4 w-4" />,
      accentBarClass: 'bg-[#EAB308]',
    },
  ],

  teacher: [
    {
      id: 'tch-lessons',
      label: 'Minhas Aulas',
      shortMobileLabel: 'Aulas',
      path: '/professor',
      matchPaths: ['/professor', '/professor/aulas'],
      description: 'Turmas, aulas e Google Classroom.',
      icon: <BookOpen className="h-4 w-4" />,
      accentBarClass: 'bg-[#1D4ED8]',
      showInMobileBottomBar: true,
      subTabs: [
        { id: 'tab-tch-overview', label: 'Minhas Turmas', path: '/professor' },
        { id: 'tab-tch-lessons', label: 'Aulas & Classroom', path: '/professor/aulas' },
      ],
    },
    {
      id: 'tch-attendance',
      label: 'Frequência',
      shortMobileLabel: 'Frequência',
      path: '/professor/chamada',
      matchPaths: ['/professor/chamada', '/professor/frequencia'],
      description: 'Chamada rápida de presença.',
      icon: <ClipboardCheck className="h-4 w-4" />,
      accentBarClass: 'bg-[#15803D]',
      showInMobileBottomBar: true,
    },
    {
      id: 'tch-assessments',
      label: 'Avaliações',
      shortMobileLabel: 'Avaliações',
      path: '/professor/avaliacoes',
      description: 'Lançamento de notas em lote.',
      icon: <GraduationCap className="h-4 w-4" />,
      accentBarClass: 'bg-[#EAB308]',
      showInMobileBottomBar: true,
    },
    {
      id: 'tch-performance',
      label: 'Desempenho',
      shortMobileLabel: 'Desempenho',
      path: '/professor/desempenho',
      description: 'Frequência e médias das turmas.',
      icon: <BarChart3 className="h-4 w-4" />,
      accentBarClass: 'bg-[#15803D]',
      showInMobileBottomBar: true,
    },
    {
      id: 'tch-calendar',
      label: 'Calendário',
      shortMobileLabel: 'Calendário',
      path: '/professor/calendario',
      description: 'Simulados e eventos.',
      icon: <Calendar className="h-4 w-4" />,
      accentBarClass: 'bg-[#EAB308]',
    },
  ],

  student: [
    {
      id: 'std-performance',
      label: 'Meu Desempenho',
      shortMobileLabel: 'Desempenho',
      path: '/aluno',
      matchPaths: ['/aluno', '/aluno/desempenho'],
      description: 'Resumo, simulados ENEM e evolução.',
      icon: <BarChart3 className="h-4 w-4" />,
      accentBarClass: 'bg-[#15803D]',
      showInMobileBottomBar: true,
      subTabs: [
        { id: 'tab-std-home', label: 'Visão Geral', path: '/aluno' },
        { id: 'tab-std-analytics', label: 'Evolução ENEM', path: '/aluno/desempenho' },
      ],
    },
    {
      id: 'std-classes',
      label: 'Minhas Aulas',
      shortMobileLabel: 'Aulas',
      path: '/aluno/aulas',
      matchPaths: ['/aluno/aulas', '/aluno/materias'],
      description: 'Grade semanal e materiais do Classroom.',
      icon: <BookOpen className="h-4 w-4" />,
      accentBarClass: 'bg-[#1D4ED8]',
      showInMobileBottomBar: true,
      subTabs: [
        { id: 'tab-std-schedule', label: 'Grade Semanal', path: '/aluno/aulas' },
        { id: 'tab-std-materials', label: 'Materiais & Classroom', path: '/aluno/materias' },
      ],
    },
    {
      id: 'std-assessments',
      label: 'Avaliações',
      shortMobileLabel: 'Avaliações',
      path: '/aluno/avaliacoes',
      description: 'Notas dos simulados e redações.',
      icon: <GraduationCap className="h-4 w-4" />,
      accentBarClass: 'bg-[#EAB308]',
      showInMobileBottomBar: true,
    },
    {
      id: 'std-attendance',
      label: 'Frequência',
      shortMobileLabel: 'Frequência',
      path: '/aluno/frequencia',
      description: 'Presença mensal e por disciplina.',
      icon: <ClipboardCheck className="h-4 w-4" />,
      accentBarClass: 'bg-[#15803D]',
      showInMobileBottomBar: true,
    },
    {
      id: 'std-calendar',
      label: 'Calendário',
      shortMobileLabel: 'Calendário',
      path: '/aluno/eventos',
      matchPaths: ['/aluno/eventos', '/aluno/calendario'],
      description: 'Simulados, aulões e avisos.',
      icon: <Calendar className="h-4 w-4" />,
      accentBarClass: 'bg-[#EAB308]',
    },
  ],

  guardian: [
    {
      id: 'grd-summary',
      label: 'Acompanhamento',
      shortMobileLabel: 'Resumo',
      path: '/responsavel',
      description: 'Situação geral do(a) estudante.',
      icon: <LayoutDashboard className="h-4 w-4" />,
      accentBarClass: 'bg-ink',
      showInMobileBottomBar: true,
    },
    {
      id: 'grd-attendance',
      label: 'Frequência',
      shortMobileLabel: 'Frequência',
      path: '/responsavel/frequencia',
      description: 'Presenças, faltas e justificativas.',
      icon: <ClipboardCheck className="h-4 w-4" />,
      accentBarClass: 'bg-[#15803D]',
      showInMobileBottomBar: true,
    },
    {
      id: 'grd-assessments',
      label: 'Avaliações',
      shortMobileLabel: 'Avaliações',
      path: '/responsavel/simulados',
      matchPaths: ['/responsavel/simulados', '/responsavel/avaliacoes'],
      description: 'Simulados ENEM e redação.',
      icon: <GraduationCap className="h-4 w-4" />,
      accentBarClass: 'bg-[#EAB308]',
      showInMobileBottomBar: true,
    },
    {
      id: 'grd-calendar',
      label: 'Calendário',
      shortMobileLabel: 'Calendário',
      path: '/responsavel/calendario',
      description: 'Reuniões e avisos da coordenação.',
      icon: <Calendar className="h-4 w-4" />,
      accentBarClass: 'bg-[#EAB308]',
      showInMobileBottomBar: true,
    },
  ],
};

export function resolveActiveNavMenuItem(
  menuItems: NavMenuItem[],
  pathname: string
): NavMenuItem {
  const exactOrMatch = menuItems.find(
    (item) =>
      item.path === pathname ||
      (item.matchPaths && item.matchPaths.includes(pathname)) ||
      (item.subTabs && item.subTabs.some((t) => t.path === pathname))
  );
  return exactOrMatch ?? menuItems[0];
}
