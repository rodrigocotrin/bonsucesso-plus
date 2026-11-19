import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Assessment,
  Attendance,
  CalendarEvent,
  ClassRoom,
  ClassSubject,
  Enrollment,
  Grade,
  InternalDonation,
  Lesson,
  MockDatabaseState,
  PantryItem,
  Person,
  PersonStatus,
  Responsibility,
  Subject,
  UserAccount,
} from '../types';
import { INITIAL_MOCK_DATABASE } from '../mocks/initialDatabase';

const DB_STORAGE_KEY = 'integracurso_mock_db_v1';

interface MockDatabaseContextValue {
  db: MockDatabaseState;
  getPersonById: (personId: string) => Person | undefined;
  getStudentsForGuardian: (guardianPersonId: string) => Person[];
  getStudentAttendancePercentage: (studentPersonId: string) => number;
  addPersonWithAccount: (person: Person, account?: UserAccount, enrollment?: Enrollment, responsibility?: Responsibility) => void;
  updatePerson: (person: Person) => void;
  togglePersonStatus: (personId: string, nextStatus: PersonStatus, reason?: string) => void;
  addResponsibility: (responsibility: Responsibility) => void;
  updateResponsibility: (responsibility: Responsibility) => void;
  removeResponsibility: (responsibilityId: string) => void;
  addSubject: (subject: Subject) => void;
  updateSubject: (subject: Subject) => void;
  addClassRoomWithAssignments: (classRoom: ClassRoom, assignments: ClassSubject[]) => void;
  updateClassRoomWithAssignments: (classRoom: ClassRoom, assignments: ClassSubject[]) => void;
  recordAttendance: (attendance: Attendance) => void;
  recordAttendanceBatch: (attendances: Attendance[], markLessonCompletedId?: string) => void;
  addGrade: (grade: Grade) => void;
  saveGradeBatch: (grades: Grade[]) => void;
  addAssessment: (assessment: Assessment) => void;
  addLesson: (lesson: Lesson) => void;
  updateLesson: (lesson: Lesson) => void;
  addCalendarEvent: (event: CalendarEvent) => void;
  updateCalendarEvent: (event: CalendarEvent) => void;
  addEnrollment: (enrollment: Enrollment) => void;
  updateEnrollment: (enrollment: Enrollment) => void;
  addInternalDonation: (donation: InternalDonation) => void;
  addPantryItem: (item: PantryItem) => void;
  updatePantryItem: (item: PantryItem) => void;
  resetDemoData: () => void;
}

const MockDatabaseContext = createContext<MockDatabaseContextValue | undefined>(undefined);

export const MockDatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<MockDatabaseState>(() => {
    try {
      const saved = localStorage.getItem(DB_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as MockDatabaseState;
      }
    } catch {
      // Fallback para dados iniciais caso o localStorage esteja corrompido
    }
    return INITIAL_MOCK_DATABASE;
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
      } catch {
        // Ignora erro de quota
      }
    }, 120);
    return () => window.clearTimeout(timer);
  }, [db]);

  // Índice O(1) de pessoas por ID
  const personByIdMap = useMemo(() => {
    const map = new Map<string, Person>();
    for (const p of db.persons) {
      map.set(p.id, p);
    }
    return map;
  }, [db.persons]);

  // Índice O(1) de frequência acumulada por estudante (calculado em passagem única)
  const attendancePercentageByStudentMap = useMemo(() => {
    const totals = new Map<string, { attended: number; total: number }>();
    for (const rec of db.attendances) {
      const current = totals.get(rec.studentPersonId) ?? { attended: 0, total: 0 };
      current.total += 1;
      if (rec.presence === 'presente' || rec.presence === 'justificada') {
        current.attended += 1;
      }
      totals.set(rec.studentPersonId, current);
    }
    const pctMap = new Map<string, number>();
    totals.forEach((val, studentId) => {
      pctMap.set(
        studentId,
        val.total > 0 ? Math.round((val.attended / val.total) * 100) : 100
      );
    });
    return pctMap;
  }, [db.attendances]);

  const getPersonById = useCallback(
    (personId: string) => personByIdMap.get(personId),
    [personByIdMap]
  );

  const getStudentsForGuardian = useCallback(
    (guardianPersonId: string) => {
      const links = db.responsibilities.filter((r) => r.guardianPersonId === guardianPersonId);
      return links
        .map((link) => personByIdMap.get(link.studentPersonId))
        .filter((p): p is Person => Boolean(p));
    },
    [db.responsibilities, personByIdMap]
  );

  const getStudentAttendancePercentage = useCallback(
    (studentPersonId: string) => {
      return attendancePercentageByStudentMap.get(studentPersonId) ?? 100;
    },
    [attendancePercentageByStudentMap]
  );

  const addPersonWithAccount = useCallback(
    (
      person: Person,
      account?: UserAccount,
      enrollment?: Enrollment,
      responsibility?: Responsibility
    ) => {
      setDb((prev) => ({
        ...prev,
        persons: [person, ...prev.persons],
        accounts: account ? [account, ...prev.accounts] : prev.accounts,
        enrollments: enrollment ? [enrollment, ...prev.enrollments] : prev.enrollments,
        responsibilities: responsibility
          ? [responsibility, ...prev.responsibilities]
          : prev.responsibilities,
      }));
    },
    []
  );

  const updatePerson = useCallback((updated: Person) => {
    setDb((prev) => ({
      ...prev,
      persons: prev.persons.map((p) => (p.id === updated.id ? updated : p)),
      accounts: prev.accounts.map((acc) =>
        acc.personId === updated.id ? { ...acc, status: updated.status } : acc
      ),
    }));
  }, []);

  const togglePersonStatus = useCallback(
    (personId: string, nextStatus: PersonStatus, reason?: string) => {
      const todayIso = new Date().toISOString().slice(0, 10);
      setDb((prev) => ({
        ...prev,
        persons: prev.persons.map((p) =>
          p.id === personId ? { ...p, status: nextStatus } : p
        ),
        accounts: prev.accounts.map((acc) =>
          acc.personId === personId ? { ...acc, status: nextStatus } : acc
        ),
        enrollments: prev.enrollments.map((enr) => {
          if (enr.studentPersonId !== personId) return enr;
          const nextEnrStatus = nextStatus === 'active' ? 'ativa' : 'trancada';
          return {
            ...enr,
            status: nextEnrStatus,
            statusHistory: [
              ...enr.statusHistory,
              {
                status: nextEnrStatus,
                changedAt: todayIso,
                changedByPersonId: 'per-coord-01',
                reason:
                  reason ||
                  (nextStatus === 'active'
                    ? 'Cadastro reativado pela coordenação pedagógica.'
                    : 'Cadastro inativado preservando histórico acadêmico.'),
              },
            ],
          };
        }),
      }));
    },
    []
  );

  const addResponsibility = useCallback((responsibility: Responsibility) => {
    setDb((prev) => ({
      ...prev,
      responsibilities: [...prev.responsibilities, responsibility],
    }));
  }, []);

  const updateResponsibility = useCallback((responsibility: Responsibility) => {
    setDb((prev) => ({
      ...prev,
      responsibilities: prev.responsibilities.map((r) =>
        r.id === responsibility.id ? responsibility : r
      ),
    }));
  }, []);

  const removeResponsibility = useCallback((responsibilityId: string) => {
    setDb((prev) => ({
      ...prev,
      responsibilities: prev.responsibilities.filter((r) => r.id !== responsibilityId),
    }));
  }, []);

  const addSubject = useCallback((subject: Subject) => {
    setDb((prev) => ({
      ...prev,
      subjects: [...prev.subjects, subject],
    }));
  }, []);

  const updateSubject = useCallback((subject: Subject) => {
    setDb((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) => (s.id === subject.id ? subject : s)),
    }));
  }, []);

  const addClassRoomWithAssignments = useCallback(
    (classRoom: ClassRoom, assignments: ClassSubject[]) => {
      setDb((prev) => ({
        ...prev,
        classRooms: [...prev.classRooms, classRoom],
        classSubjects: [...prev.classSubjects, ...assignments],
      }));
    },
    []
  );

  const updateClassRoomWithAssignments = useCallback(
    (classRoom: ClassRoom, assignments: ClassSubject[]) => {
      setDb((prev) => ({
        ...prev,
        classRooms: prev.classRooms.map((c) => (c.id === classRoom.id ? classRoom : c)),
        classSubjects: [
          ...prev.classSubjects.filter((cs) => cs.classRoomId !== classRoom.id),
          ...assignments,
        ],
      }));
    },
    []
  );

  const recordAttendance = useCallback((attendance: Attendance) => {
    setDb((prev) => {
      const exists = prev.attendances.some((a) => a.id === attendance.id);
      return {
        ...prev,
        attendances: exists
          ? prev.attendances.map((a) => (a.id === attendance.id ? attendance : a))
          : [...prev.attendances, attendance],
      };
    });
  }, []);

  const recordAttendanceBatch = useCallback(
    (newAttendances: Attendance[], markLessonCompletedId?: string) => {
      setDb((prev) => {
        const updatedMap = new Map<string, Attendance>();
        for (const existing of prev.attendances) {
          updatedMap.set(`${existing.lessonId}__${existing.studentPersonId}`, existing);
        }
        for (const incoming of newAttendances) {
          updatedMap.set(`${incoming.lessonId}__${incoming.studentPersonId}`, incoming);
        }

        const updatedLessons = markLessonCompletedId
          ? prev.lessons.map((l) =>
              l.id === markLessonCompletedId ? { ...l, status: 'ministrada' as const } : l
            )
          : prev.lessons;

        return {
          ...prev,
          attendances: Array.from(updatedMap.values()),
          lessons: updatedLessons,
        };
      });
    },
    []
  );

  const addGrade = useCallback((grade: Grade) => {
    setDb((prev) => ({
      ...prev,
      grades: [...prev.grades, grade],
    }));
  }, []);

  const saveGradeBatch = useCallback((incomingGrades: Grade[]) => {
    setDb((prev) => {
      const byKey = new Map<string, Grade>();
      for (const existing of prev.grades) {
        byKey.set(`${existing.assessmentId}__${existing.studentPersonId}`, existing);
      }
      for (const g of incomingGrades) {
        byKey.set(`${g.assessmentId}__${g.studentPersonId}`, g);
      }
      return {
        ...prev,
        grades: Array.from(byKey.values()),
      };
    });
  }, []);

  const addAssessment = useCallback((assessment: Assessment) => {
    setDb((prev) => ({
      ...prev,
      assessments: [...prev.assessments, assessment],
    }));
  }, []);

  const addLesson = useCallback((lesson: Lesson) => {
    setDb((prev) => ({
      ...prev,
      lessons: [lesson, ...prev.lessons],
    }));
  }, []);

  const updateLesson = useCallback((lesson: Lesson) => {
    setDb((prev) => ({
      ...prev,
      lessons: prev.lessons.map((l) => (l.id === lesson.id ? lesson : l)),
    }));
  }, []);

  const addCalendarEvent = useCallback((event: CalendarEvent) => {
    setDb((prev) => ({
      ...prev,
      calendarEvents: [event, ...prev.calendarEvents],
    }));
  }, []);

  const updateCalendarEvent = useCallback((event: CalendarEvent) => {
    setDb((prev) => ({
      ...prev,
      calendarEvents: prev.calendarEvents.map((e) => (e.id === event.id ? event : e)),
    }));
  }, []);

  const addEnrollment = useCallback((enrollment: Enrollment) => {
    setDb((prev) => ({
      ...prev,
      enrollments: [enrollment, ...prev.enrollments],
    }));
  }, []);

  const updateEnrollment = useCallback((enrollment: Enrollment) => {
    setDb((prev) => ({
      ...prev,
      enrollments: prev.enrollments.map((e) => (e.id === enrollment.id ? enrollment : e)),
    }));
  }, []);

  const addInternalDonation = useCallback((donation: InternalDonation) => {
    setDb((prev) => ({
      ...prev,
      internalDonations: [donation, ...prev.internalDonations],
    }));
  }, []);

  const addPantryItem = useCallback((item: PantryItem) => {
    setDb((prev) => ({
      ...prev,
      pantryItems: [item, ...prev.pantryItems],
    }));
  }, []);

  const updatePantryItem = useCallback((item: PantryItem) => {
    setDb((prev) => ({
      ...prev,
      pantryItems: prev.pantryItems.map((p) => (p.id === item.id ? item : p)),
    }));
  }, []);

  const resetDemoData = useCallback(() => {
    localStorage.removeItem(DB_STORAGE_KEY);
    setDb(INITIAL_MOCK_DATABASE);
  }, []);

  const contextValue = useMemo<MockDatabaseContextValue>(
    () => ({
      db,
      getPersonById,
      getStudentsForGuardian,
      getStudentAttendancePercentage,
      addPersonWithAccount,
      updatePerson,
      togglePersonStatus,
      addResponsibility,
      updateResponsibility,
      removeResponsibility,
      addSubject,
      updateSubject,
      addClassRoomWithAssignments,
      updateClassRoomWithAssignments,
      recordAttendance,
      recordAttendanceBatch,
      addGrade,
      saveGradeBatch,
      addAssessment,
      addLesson,
      updateLesson,
      addCalendarEvent,
      updateCalendarEvent,
      addEnrollment,
      updateEnrollment,
      addInternalDonation,
      addPantryItem,
      updatePantryItem,
      resetDemoData,
    }),
    [
      db,
      getPersonById,
      getStudentsForGuardian,
      getStudentAttendancePercentage,
      addPersonWithAccount,
      updatePerson,
      togglePersonStatus,
      addResponsibility,
      updateResponsibility,
      removeResponsibility,
      addSubject,
      updateSubject,
      addClassRoomWithAssignments,
      updateClassRoomWithAssignments,
      recordAttendance,
      recordAttendanceBatch,
      addGrade,
      saveGradeBatch,
      addAssessment,
      addLesson,
      updateLesson,
      addCalendarEvent,
      updateCalendarEvent,
      addEnrollment,
      updateEnrollment,
      addInternalDonation,
      addPantryItem,
      updatePantryItem,
      resetDemoData,
    ]
  );

  return (
    <MockDatabaseContext.Provider value={contextValue}>
      {children}
    </MockDatabaseContext.Provider>
  );
};

export function useMockDatabase(): MockDatabaseContextValue {
  const context = useContext(MockDatabaseContext);
  if (!context) {
    throw new Error('useMockDatabase deve ser utilizado dentro de um MockDatabaseProvider');
  }
  return context;
}
