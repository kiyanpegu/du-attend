import type { Subject } from '@/types/models';
import { storageService } from '@/services/storageService';

export const subjectService = {
  async listSubjects() {
    const database = await storageService.getDatabase();
    return database.subjects.filter((subject) => subject.active);
  },

  async getSubject(subjectId: string): Promise<Subject | null> {
    const database = await storageService.getDatabase();
    return database.subjects.find((subject) => subject.id === subjectId) ?? null;
  },

  async getSubjectFacultyName(subjectId: string) {
    const database = await storageService.getDatabase();
    const assignment = database.facultyAssignments.find(
      (item) => item.subjectId === subjectId && item.active
    );
    const faculty = database.faculties.find((item) => item.id === assignment?.facultyId);
    const user = database.users.find((item) => item.id === faculty?.userId);

    return user?.name ?? 'Unassigned';
  },
};
