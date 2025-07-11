/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Student data model for the enrollment system
 */
export interface Student {
  rollNo: string;
  fullName: string;
  class: string;
  birthDate: string;
  address: string;
  enrollmentDate: string;
}

/**
 * API response types for student operations
 */
export interface StudentResponse {
  success: boolean;
  student?: Student;
  message?: string;
}

export interface StudentsListResponse {
  success: boolean;
  students: Student[];
}

/**
 * Request types for student operations
 */
export interface CreateStudentRequest {
  student: Omit<Student, "enrollmentDate">;
}

export interface UpdateStudentRequest {
  rollNo: string;
  student: Omit<Student, "rollNo">;
}

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}
