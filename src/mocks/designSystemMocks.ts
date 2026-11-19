import { StudentSummary, SubjectAttendance, UserProfile } from '../types';

/**
 * Dados fictícios e anonimizados para validação do Design System e prototipação
 */
export const MOCK_PROFILES: Record<string, UserProfile> = {
  student: {
    id: 'usr-est-01',
    name: 'Mariana Oliveira Santos',
    role: 'student',
    roleLabel: 'Estudante',
    email: 'mariana.estudante@comunidade.org.br',
    turma: 'Turma Paulo Freire — Noite',
  },
  guardian: {
    id: 'usr-resp-01',
    name: 'Dona Helena Oliveira',
    role: 'guardian',
    roleLabel: 'Mãe / Responsável',
    email: 'helena.oliveira@comunidade.org.br',
  },
  teacher: {
    id: 'usr-prof-01',
    name: 'Prof. Carlos Eduardo Lima',
    role: 'teacher',
    roleLabel: 'Professor Voluntário (Matemática)',
    email: 'carlos.mat@comunidade.org.br',
  },
  coordinator: {
    id: 'usr-coord-01',
    name: 'Ana Paula Ribeiro',
    role: 'coordinator',
    roleLabel: 'Coordenação Pedagógica',
    email: 'coordenacao@comunidade.org.br',
  },
};

export const MOCK_STUDENT_SUMMARY: StudentSummary = {
  id: 'est-2026-104',
  name: 'Mariana Oliveira Santos',
  turma: 'Turma Paulo Freire — Noite',
  attendancePercentage: 72, // Exemplo intencional abaixo de 75% para demonstrar alerta pedagógico acolhedor
  enemAverageScore: 685,
  redacaoLastScore: 840,
  completedSimulados: 4,
  totalSimulados: 5,
};

export const MOCK_SUBJECT_ATTENDANCE: SubjectAttendance[] = [
  {
    id: 'sub-1',
    subjectName: 'Redação e Oficina de Texto',
    area: 'Redação',
    teacherName: 'Profa. Beatriz Souza',
    presentClasses: 19,
    totalClasses: 20,
    percentage: 95,
  },
  {
    id: 'sub-2',
    subjectName: 'História e Geografia do Brasil',
    area: 'Ciências Humanas',
    teacherName: 'Prof. Marcos Vinícius',
    presentClasses: 17,
    totalClasses: 20,
    percentage: 85,
  },
  {
    id: 'sub-3',
    subjectName: 'Biologia e Química Geral',
    area: 'Ciências da Natureza',
    teacherName: 'Profa. Juliana Castro',
    presentClasses: 15,
    totalClasses: 20,
    percentage: 75,
  },
  {
    id: 'sub-4',
    subjectName: 'Matemática Básica e Geometria',
    area: 'Matemática',
    teacherName: 'Prof. Carlos Eduardo Lima',
    presentClasses: 13,
    totalClasses: 20,
    percentage: 65,
  },
];
