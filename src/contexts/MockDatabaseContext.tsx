import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  Assessment,
  Attendance,
  CalendarEvent,
  Enrollment,
  Grade,
  InternalDonation,
  Lesson,
  MockDatabaseState,
  PantryItem,
  Person,
  PersonStatus,
  Responsibility,
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
  recordAttendance: (attendance: Attendance) => void;
  recordAttendanceBatch: (attendances: Attendance[], markLessonCompletedId?: string) => void;
  addGrade: (grade: Grade) => void;
  saveGradeBatch: (grades: Grade[]) => void;
  addAssessment: (assessment: Assessment) => void;
  addLesson: (lesson: Lesson) => void;
  updateLesson: (lesson: Lesson) => void;
  addCalendarEvent: (event: CalendarEvent) => void;
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
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
    } catch {
      // Ignora erro de quota
    }
  }, [db]);

  const getPersonById = useCallback(
    (personId: string) => db.persons.find((p) => p.id === personId),
    [db.persons]
  );

  const getStudentsForGuardian = useCallback(
    (guardianPersonId: string) => {
      const links = db.responsibilities.filter((r) => r.guardianPersonId === guardianPersonId);
      return links
        .map((link) => db.persons.find((p) => p.id === link.studentPersonId))
        .filter((p): p is Person => Boolean(p));
    },
    [db.responsibilities, db.persons]
  );

  const getStudentAttendancePercentage = useCallback(
    (studentPersonId: string) => {
      const records = db.attendances.filter((a) => a.studentPersonId === studentPersonId);
      if (records.length === 0) return 100;
      const attended = records.filter(
        (a) => a.presence === 'presente' || a.presence === 'justificada'
      ).length;
      return Math.round((attended / records.length) * 100);
    },
    [db.attendances]
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
      calendarEvents: [...prev.calendarEvents, event],
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

  return (
    <MockDatabaseContext.Provider
      value={{
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
        recordAttendance,
        recordAttendanceBatch,
        addGrade,
        saveGradeBatch,
        addAssessment,
        addLesson,
        updateLesson,
        addCalendarEvent,
        addEnrollment,
        updateEnrollment,
        addInternalDonation,
        addPantryItem,
        updatePantryItem,
        resetDemoData,
      }}
    >
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
