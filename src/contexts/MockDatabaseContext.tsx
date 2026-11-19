import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  Attendance,
  CalendarEvent,
  Enrollment,
  Grade,
  InternalDonation,
  Lesson,
  MockDatabaseState,
  PantryItem,
  Person,
} from '../types';
import { INITIAL_MOCK_DATABASE } from '../mocks/initialDatabase';

const DB_STORAGE_KEY = 'integracurso_mock_db_v1';

interface MockDatabaseContextValue {
  db: MockDatabaseState;
  getPersonById: (personId: string) => Person | undefined;
  getStudentsForGuardian: (guardianPersonId: string) => Person[];
  getStudentAttendancePercentage: (studentPersonId: string) => number;
  updatePerson: (person: Person) => void;
  recordAttendance: (attendance: Attendance) => void;
  addGrade: (grade: Grade) => void;
  addLesson: (lesson: Lesson) => void;
  addCalendarEvent: (event: CalendarEvent) => void;
  updateEnrollment: (enrollment: Enrollment) => void;
  addInternalDonation: (donation: InternalDonation) => void;
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

  const updatePerson = useCallback((updated: Person) => {
    setDb((prev) => ({
      ...prev,
      persons: prev.persons.map((p) => (p.id === updated.id ? updated : p)),
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

  const addGrade = useCallback((grade: Grade) => {
    setDb((prev) => ({
      ...prev,
      grades: [...prev.grades, grade],
    }));
  }, []);

  const addLesson = useCallback((lesson: Lesson) => {
    setDb((prev) => ({
      ...prev,
      lessons: [...prev.lessons, lesson],
    }));
  }, []);

  const addCalendarEvent = useCallback((event: CalendarEvent) => {
    setDb((prev) => ({
      ...prev,
      calendarEvents: [...prev.calendarEvents, event],
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
        updatePerson,
        recordAttendance,
        addGrade,
        addLesson,
        addCalendarEvent,
        updateEnrollment,
        addInternalDonation,
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
