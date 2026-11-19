import { INITIAL_MOCK_DATABASE } from '../mocks/initialDatabase';
import {
  Assessment,
  ClassRoom,
  Enrollment,
  InternalDonation,
  Lesson,
  MockDatabaseState,
  Person,
  Subject,
} from '../types';

const STORAGE_KEY = 'integracurso_mock_db_v1';
const SIMULATED_LATENCY_MS = 180;

function delay(ms: number = SIMULATED_LATENCY_MS): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function readSnapshot(): MockDatabaseState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MockDatabaseState;
      if (parsed && Array.isArray(parsed.persons)) {
        return parsed;
      }
    }
  } catch {
    // fallback to initial mock database
  }
  return INITIAL_MOCK_DATABASE;
}

/**
 * Camada de Serviços Assíncronos (Pronta para substituição por chamadas fetch/axios à API Python/Django).
 * Simula latência curta (150ms–300ms) para exercitar BrandLoader e Skeletons.
 */
export const academicService = {
  async fetchDatabaseSnapshot(): Promise<MockDatabaseState> {
    await delay(180);
    return readSnapshot();
  },

  async fetchStudents(): Promise<Person[]> {
    await delay(160);
    return readSnapshot().persons.filter((p) => p.id.startsWith('per-est-'));
  },

  async fetchClassRooms(): Promise<ClassRoom[]> {
    await delay(150);
    return readSnapshot().classRooms;
  },

  async fetchSubjects(): Promise<Subject[]> {
    await delay(150);
    return readSnapshot().subjects;
  },

  async fetchEnrollments(): Promise<Enrollment[]> {
    await delay(160);
    return readSnapshot().enrollments;
  },

  async fetchLessons(): Promise<Lesson[]> {
    await delay(160);
    return readSnapshot().lessons;
  },

  async fetchAssessments(): Promise<Assessment[]> {
    await delay(160);
    return readSnapshot().assessments;
  },

  async fetchDonations(): Promise<InternalDonation[]> {
    await delay(160);
    return readSnapshot().internalDonations;
  },
};
