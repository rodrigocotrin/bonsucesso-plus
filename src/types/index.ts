/**
 * Tipagens de Domínio e Acessibilidade do IntegraCurso
 * "Cursinho Comunitário Bonsucesso — Educação que transforma"
 *
 * REGRAS DE NEGÓCIO OBRIGATÓRIAS:
 * - Existem EXATAMENTE 4 perfis de acesso: 'coordinator' | 'teacher' | 'student' | 'guardian'.
 * - NÃO existe perfil de usuário 'Doador' com login no sistema.
 * - Entidade central 'Person' compartilhada entre alunos, professores, coordenadores e responsáveis.
 */

export type ThemeMode = 'light' | 'dark';

export type FontScale = 'normal' | 'large' | 'xlarge';

export type UserRole = 'coordinator' | 'teacher' | 'student' | 'guardian';

export type PersonStatus = 'active' | 'inactive';

export type RaceDeclaration =
  | 'Branca'
  | 'Preta'
  | 'Parda'
  | 'Amarela'
  | 'Indígena'
  | 'Prefiro não declarar';

export type EnemArea =
  | 'Linguagens'
  | 'Matemática'
  | 'Ciências da Natureza'
  | 'Ciências Humanas'
  | 'Redação';

export type AttendanceStatus = 'regular' | 'attention' | 'critical';

/**
 * Entidade Central Person — evita duplicidade cadastral
 */
export interface Person {
  id: string;
  fullName: string;
  socialName?: string;
  cpf: string;
  rg: string;
  birthDate: string; // YYYY-MM-DD
  phone: string;
  race: RaceDeclaration;
  email: string;
  generalNotes?: string;
  status: PersonStatus;
  createdAt: string;
}

/**
 * Conta de Acesso ao Sistema vinculada a uma Person
 */
export interface UserAccount {
  id: string;
  personId: string;
  role: UserRole;
  roleLabel: string;
  passwordPlainDemo: string; // Apenas para simulação de login no protótipo
  status: PersonStatus;
  lastLoginAt?: string;
}

/**
 * Vínculo entre Responsável (guardian) e Estudante (student)
 */
export interface Responsibility {
  id: string;
  guardianPersonId: string;
  studentPersonId: string;
  relationship: 'Mãe' | 'Pai' | 'Avó/Avô' | 'Tia/Tio' | 'Responsável Legal';
  isPrimaryContact: boolean;
  receivesAcademicInfo?: boolean;
}

/**
 * Período Letivo (ex: "2º semestre de 2026")
 */
export interface AcademicPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

/**
 * Turma do Cursinho (ex: "Turma Esperança • Noite")
 */
export interface ClassRoom {
  id: string;
  periodId: string;
  name: string;
  shift: 'Manhã' | 'Tarde' | 'Noite' | 'Sábado';
  roomLabel: string;
  scheduleSummary: string;
  capacity: number;
}

/**
 * Disciplina alinhada ao ENEM
 */
export interface Subject {
  id: string;
  name:
    | 'Matemática'
    | 'Redação'
    | 'Português'
    | 'História'
    | 'Geografia'
    | 'Física'
    | 'Química'
    | 'Biologia';
  area: EnemArea;
  workloadHours: number;
  colorTag: string;
}

/**
 * Vínculo entre Turma, Disciplina e Professor Voluntário + Integração Google Sala de Aula
 */
export interface ClassSubject {
  id: string;
  classRoomId: string;
  subjectId: string;
  teacherPersonId: string;
  classroomUrl: string; // URL do Google Sala de Aula
  weeklySchedule: string;
}

/**
 * Status de Matrícula e Histórico
 */
export type EnrollmentStatus = 'ativa' | 'trancada' | 'cancelada' | 'concluída';

export interface EnrollmentStatusHistoryEntry {
  status: EnrollmentStatus;
  changedAt: string;
  changedByPersonId: string;
  reason: string;
}

export interface Enrollment {
  id: string;
  studentPersonId: string;
  classRoomId: string;
  periodId: string;
  enrollmentCode: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  statusHistory: EnrollmentStatusHistoryEntry[];
}

/**
 * Aula agendada ou ministrada
 */
export interface Lesson {
  id: string;
  classSubjectId: string;
  classRoomId: string;
  subjectId: string;
  teacherPersonId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  topic: string;
  notes?: string;
  externalUrl?: string; // Link opcional para Google Classroom, YouTube ou material complementar
  status: 'agendada' | 'ministrada' | 'cancelada';
}

/**
 * Registro de Presença em uma Aula
 */
export type AttendancePresence = 'presente' | 'falta' | 'justificada';

export interface Attendance {
  id: string;
  lessonId: string;
  studentPersonId: string;
  presence: AttendancePresence;
  justification?: string;
  recordedAt: string;
}

/**
 * Avaliações (Simulados padrão ENEM 0-1000 ou Atividades Pedagógicas)
 */
export type AssessmentType = 'simulado_enem' | 'redacao_enem' | 'atividade';

export interface Assessment {
  id: string;
  periodId: string;
  classRoomId: string; // ou 'all' para simulado geral
  subjectId?: string; // opcional se for simulado geral
  title: string;
  type: AssessmentType;
  date: string;
  maxScore: number; // 1000 na escala ENEM
  description: string;
}

/**
 * Nota do Aluno em uma Avaliação
 */
export interface Grade {
  id: string;
  assessmentId: string;
  studentPersonId: string;
  score: number; // 0 a 1000
  areaScores?: {
    linguagens: number;
    matematica: number;
    natureza: number;
    humanas: number;
    redacao: number;
  };
  feedback?: string;
  recordedAt: string;
}

/**
 * Eventos do Calendário Comunitário e Pedagógico
 */
export type CalendarEventCategory =
  | 'simulado'
  | 'aula_especial'
  | 'reuniao_responsaveis'
  | 'prazo_enem'
  | 'comunidade';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  timeRange: string;
  location: string;
  category: CalendarEventCategory;
  description: string;
  targetAudience: 'todos' | 'alunos' | 'responsaveis' | 'professores';
}

/**
 * Controle Interno da Coordenação: Doações Recebidas (Sem perfil de usuário Doador)
 */
export interface InternalDonation {
  id: string;
  supporterName: string; // Nome de quem apoiou (pessoa física, comércio local ou "Doador Anônimo")
  supporterPersonId?: string; // Vínculo opcional a uma Person cadastrada
  isAnonymous?: boolean;
  donationType?: 'financeira' | 'material';
  amountBrl?: number; // Valor em R$ quando financeira
  itemName?: string; // Nome do item quando material
  itemQuantity?: number;
  itemUnit?: string;
  category: 'alimentacao' | 'material_didatico' | 'financeiro' | 'equipamentos';
  description: string;
  quantityOrValue: string;
  receivedDate: string;
  registeredByPersonId: string;
  notes?: string;
}

/**
 * Controle Interno da Coordenação: Itens de Copa e Merenda Comunitária
 */
export interface PantryItem {
  id: string;
  name: string;
  category: 'lanche' | 'bebida' | 'descartavel' | 'limpeza';
  currentQuantity: number;
  unit: string;
  minimumThreshold: number;
  lastUpdated: string;
}

/**
 * Estado completo da Store Mockada Reativa
 */
export interface MockDatabaseState {
  persons: Person[];
  accounts: UserAccount[];
  responsibilities: Responsibility[];
  academicPeriods: AcademicPeriod[];
  classRooms: ClassRoom[];
  subjects: Subject[];
  classSubjects: ClassSubject[];
  enrollments: Enrollment[];
  lessons: Lesson[];
  attendances: Attendance[];
  assessments: Assessment[];
  grades: Grade[];
  calendarEvents: CalendarEvent[];
  internalDonations: InternalDonation[];
  pantryItems: PantryItem[];
}

/**
 * Tipagens auxiliares legadas para a página /design-system
 */
export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  roleLabel: string;
  email: string;
  turma?: string;
}

export interface StudentSummary {
  id: string;
  name: string;
  turma: string;
  attendancePercentage: number;
  enemAverageScore: number;
  redacaoLastScore: number;
  completedSimulados: number;
  totalSimulados: number;
}

export interface SubjectAttendance {
  id: string;
  subjectName: string;
  area: EnemArea;
  teacherName: string;
  presentClasses: number;
  totalClasses: number;
  percentage: number;
}
