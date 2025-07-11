import { Student } from "@shared/api";

/**
 * Simple in-memory database for student records
 * In production, this would be replaced with a real database
 */
class StudentDatabase {
  private students: Map<string, Student> = new Map();

  /**
   * Get a student by roll number
   */
  getStudent(rollNo: string): Student | undefined {
    return this.students.get(rollNo);
  }

  /**
   * Get all students
   */
  getAllStudents(): Student[] {
    return Array.from(this.students.values());
  }

  /**
   * Create a new student record
   */
  createStudent(student: Omit<Student, "enrollmentDate">): Student {
    const newStudent: Student = {
      ...student,
      enrollmentDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
    };

    this.students.set(student.rollNo, newStudent);
    return newStudent;
  }

  /**
   * Update an existing student record
   */
  updateStudent(
    rollNo: string,
    updates: Omit<Student, "rollNo">,
  ): Student | null {
    const existingStudent = this.students.get(rollNo);
    if (!existingStudent) {
      return null;
    }

    const updatedStudent: Student = {
      rollNo,
      ...updates,
    };

    this.students.set(rollNo, updatedStudent);
    return updatedStudent;
  }

  /**
   * Delete a student record
   */
  deleteStudent(rollNo: string): boolean {
    return this.students.delete(rollNo);
  }

  /**
   * Check if a student exists
   */
  studentExists(rollNo: string): boolean {
    return this.students.has(rollNo);
  }

  /**
   * Get the total number of students
   */
  getStudentCount(): number {
    return this.students.size;
  }
}

// Export a singleton instance
export const studentDb = new StudentDatabase();

// Initialize with sample data for testing
studentDb.createStudent({
  rollNo: "101",
  fullName: "Ananya Sharma",
  class: "10A",
  birthDate: "2007-09-15",
  address: "Pune, MH",
});

// Set the enrollment date to match the provided data
const student101 = studentDb.getStudent("101");
if (student101) {
  studentDb.updateStudent("101", {
    fullName: "Ananya Sharma",
    class: "10A",
    birthDate: "2007-09-15",
    address: "Pune, MH",
    enrollmentDate: "2024-06-01",
  });
}
