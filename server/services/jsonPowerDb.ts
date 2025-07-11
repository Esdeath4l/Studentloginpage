import http from "http";
import { Student } from "@shared/api";

/**
 * JsonPowerDB service for student database operations
 * Uses the JsonPowerDB REST API for all database interactions
 */
class JsonPowerDBService {
  private readonly connectionToken: string;
  private readonly dbName: string;
  private readonly relationName: string;
  private readonly baseUrl: string;
  private readonly port: number;

  constructor() {
    // You can set your connection token here or via environment variable
    this.connectionToken =
      process.env.JPDB_CONNECTION_TOKEN ||
      "90934997|-31949210765869673|90959231";
    this.dbName = "SCHOOL-DB";
    this.relationName = "STUDENT-TABLE";
    this.baseUrl = "api.login2explore.com";
    this.port = 5577;
  }

  private inMemoryFallback: Map<string, Student> = new Map();

  /**
   * Make HTTP request to JsonPowerDB API with fallback to in-memory storage
   */
  private async makeRequest(endpoint: string, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(payload);

      console.log(
        `JsonPowerDB Request to: http://${this.baseUrl}:${this.port}${endpoint}`,
      );
      console.log(`JsonPowerDB Request Payload:`, payload);

      const options = {
        hostname: this.baseUrl,
        port: this.port,
        path: endpoint,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Node.js",
          "Content-Length": Buffer.byteLength(data),
        },
      };

      const req = http.request(options, (res) => {
        let responseData = "";

        res.on("data", (chunk) => {
          responseData += chunk;
        });

        res.on("end", () => {
          try {
            console.log(`JsonPowerDB Response Status: ${res.statusCode}`);
            console.log(`JsonPowerDB Response Headers:`, res.headers);
            console.log(
              `JsonPowerDB Response Data: ${responseData.substring(0, 500)}...`,
            );

            // Check if response is HTML error page (404, etc.)
            if (responseData.includes("<!DOCTYPE HTML")) {
              console.warn(
                `JsonPowerDB API returned HTML error page, falling back to in-memory storage`,
              );
              console.warn(`Full HTML response: ${responseData}`);
              resolve({ fallback: true });
              return;
            }

            const parsedResponse = JSON.parse(responseData);
            console.log(`JsonPowerDB Parsed Response:`, parsedResponse);
            resolve(parsedResponse);
          } catch (error) {
            console.warn(
              `JsonPowerDB parse error: ${error}, falling back to in-memory storage`,
            );
            console.warn(`Raw response data: ${responseData}`);
            resolve({ fallback: true });
          }
        });
      });

      req.on("error", (error) => {
        console.warn(
          `JsonPowerDB connection error, falling back to in-memory storage:`,
          error.message,
        );
        resolve({ fallback: true });
      });

      req.write(data);
      req.end();
    });
  }

  /**
   * Get a student by roll number
   */
  async getStudent(rollNo: string): Promise<Student | null> {
    try {
      const payload = {
        token: this.connectionToken,
        cmd: "GET_BY_KEY",
        dbName: this.dbName,
        rel: this.relationName,
        jsonStr: {
          "Roll-No": rollNo,
        },
      };

      const response = await this.makeRequest("/api/irl", payload);

      // Use fallback if JsonPowerDB is not available
      if (response && response.fallback) {
        return this.inMemoryFallback.get(rollNo) || null;
      }

      if (response && response.data) {
        const parsedData = JSON.parse(response.data);
        const studentData = parsedData.record || parsedData;
        const student = {
          rollNo: studentData["Roll-No"] || "",
          fullName: studentData["Full-Name"] || "",
          class: studentData["Class"] || "",
          birthDate: studentData["Birth-Date"] || "",
          address: studentData["Address"] || "",
          enrollmentDate: studentData["Enrollment-Date"] || "",
        };

        // Also store in fallback
        this.inMemoryFallback.set(rollNo, student);
        return student;
      }

      return null;
    } catch (error) {
      console.error("Error getting student:", error);
      return this.inMemoryFallback.get(rollNo) || null;
    }
  }

  /**
   * Get all students
   */
  async getAllStudents(): Promise<Student[]> {
    try {
      const payload = {
        token: this.connectionToken,
        cmd: "GET_ALL",
        dbName: this.dbName,
        rel: this.relationName,
      };

      const response = await this.makeRequest("/api/irl", payload);

      // Use fallback if JsonPowerDB is not available
      if (response && response.fallback) {
        return Array.from(this.inMemoryFallback.values());
      }

      if (response && response.data) {
        const studentsData = JSON.parse(response.data);
        const students = Object.values(studentsData).map((student: any) => ({
          rollNo: student["Roll-No"] || "",
          fullName: student["Full-Name"] || "",
          class: student["Class"] || "",
          birthDate: student["Birth-Date"] || "",
          address: student["Address"] || "",
          enrollmentDate: student["Enrollment-Date"] || "",
        }));

        // Sync with fallback
        students.forEach((student) => {
          this.inMemoryFallback.set(student.rollNo, student);
        });

        return students;
      }

      return Array.from(this.inMemoryFallback.values());
    } catch (error) {
      console.error("Error getting all students:", error);
      return Array.from(this.inMemoryFallback.values());
    }
  }

  /**
   * Create a new student record
   */
  async createStudent(
    student: Omit<Student, "enrollmentDate">,
  ): Promise<Student | null> {
    try {
      const enrollmentDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

      const payload = {
        token: this.connectionToken,
        cmd: "PUT",
        dbName: this.dbName,
        rel: this.relationName,
        jsonStr: {
          "Roll-No": student.rollNo,
          "Full-Name": student.fullName,
          Class: student.class,
          "Birth-Date": student.birthDate,
          Address: student.address,
          "Enrollment-Date": enrollmentDate,
        },
      };

      const response = await this.makeRequest("/api/iml", payload);

      const newStudent = {
        ...student,
        enrollmentDate,
      };

      // Use fallback if JsonPowerDB is not available
      if (response && response.fallback) {
        this.inMemoryFallback.set(student.rollNo, newStudent);
        return newStudent;
      }

      if (
        response &&
        response.message &&
        response.message.includes("success")
      ) {
        // Also store in fallback
        this.inMemoryFallback.set(student.rollNo, newStudent);
        return newStudent;
      }

      return null;
    } catch (error) {
      console.error("Error creating student:", error);
      // Fallback to in-memory storage
      const enrollmentDate = new Date().toISOString().split("T")[0];
      const newStudent = {
        ...student,
        enrollmentDate,
      };
      this.inMemoryFallback.set(student.rollNo, newStudent);
      return newStudent;
    }
  }

  /**
   * Update an existing student record
   */
  async updateStudent(
    rollNo: string,
    updates: Omit<Student, "rollNo">,
  ): Promise<Student | null> {
    try {
      const payload = {
        token: this.connectionToken,
        cmd: "UPDATE",
        dbName: this.dbName,
        rel: this.relationName,
        jsonStr: {
          [rollNo]: {
            "Full-Name": updates.fullName,
            Class: updates.class,
            "Birth-Date": updates.birthDate,
            Address: updates.address,
            "Enrollment-Date": updates.enrollmentDate,
          },
        },
      };

      const response = await this.makeRequest("/api/iml", payload);

      const updatedStudent = {
        rollNo,
        ...updates,
      };

      // Use fallback if JsonPowerDB is not available
      if (response && response.fallback) {
        this.inMemoryFallback.set(rollNo, updatedStudent);
        return updatedStudent;
      }

      if (
        response &&
        response.message &&
        response.message.includes("success")
      ) {
        // Also store in fallback
        this.inMemoryFallback.set(rollNo, updatedStudent);
        return updatedStudent;
      }

      return null;
    } catch (error) {
      console.error("Error updating student:", error);
      // Fallback to in-memory storage
      const updatedStudent = {
        rollNo,
        ...updates,
      };
      this.inMemoryFallback.set(rollNo, updatedStudent);
      return updatedStudent;
    }
  }

  /**
   * Delete a student record
   */
  async deleteStudent(rollNo: string): Promise<boolean> {
    try {
      const payload = {
        token: this.connectionToken,
        cmd: "REMOVE",
        dbName: this.dbName,
        rel: this.relationName,
        record: [rollNo],
      };

      const response = await this.makeRequest("/api/iml", payload);

      // Use fallback if JsonPowerDB is not available
      if (response && response.fallback) {
        return this.inMemoryFallback.delete(rollNo);
      }

      const success =
        response && response.message && response.message.includes("success");

      if (success) {
        // Also remove from fallback
        this.inMemoryFallback.delete(rollNo);
      }

      return success;
    } catch (error) {
      console.error("Error deleting student:", error);
      // Fallback to in-memory deletion
      return this.inMemoryFallback.delete(rollNo);
    }
  }

  /**
   * Check if a student exists
   */
  async studentExists(rollNo: string): Promise<boolean> {
    const student = await this.getStudent(rollNo);
    return student !== null;
  }

  /**
   * Get the total number of students
   */
  async getStudentCount(): Promise<number> {
    const students = await this.getAllStudents();
    return students.length;
  }
}

// Export a singleton instance
export const jsonPowerDb = new JsonPowerDBService();

// Initialize with sample data if needed
export const initializeSampleData = async () => {
  try {
    // Check if student 101 already exists
    const existingStudent = await jsonPowerDb.getStudent("101");

    if (!existingStudent) {
      // Create the sample student record
      await jsonPowerDb.createStudent({
        rollNo: "101",
        fullName: "Ananya Sharma",
        class: "10A",
        birthDate: "2007-09-15",
        address: "Pune, MH",
      });

      // Update with the specific enrollment date
      await jsonPowerDb.updateStudent("101", {
        fullName: "Ananya Sharma",
        class: "10A",
        birthDate: "2007-09-15",
        address: "Pune, MH",
        enrollmentDate: "2024-06-01",
      });

      console.log("Sample student data initialized in JsonPowerDB");
    }
  } catch (error) {
    console.error("Error initializing sample data:", error);
  }
};
