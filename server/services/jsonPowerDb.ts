import https from "https";
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

  constructor() {
    // You can set your connection token here or via environment variable
    this.connectionToken =
      process.env.JPDB_CONNECTION_TOKEN ||
      "90934997|-31949210765869673|90959231";
    this.dbName = "SCHOOL-DB";
    this.relationName = "STUDENT-TABLE";
    this.baseUrl = "api.login2explore.com";
  }

  /**
   * Make HTTP request to JsonPowerDB API
   */
  private async makeRequest(endpoint: string, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(payload);

      const options = {
        hostname: this.baseUrl,
        port: 443,
        path: endpoint,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Node.js",
          "Content-Length": Buffer.byteLength(data),
        },
      };

      const req = https.request(options, (res) => {
        let responseData = "";

        res.on("data", (chunk) => {
          responseData += chunk;
        });

        res.on("end", () => {
          try {
            const parsedResponse = JSON.parse(responseData);
            resolve(parsedResponse);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${responseData}`));
          }
        });
      });

      req.on("error", (error) => {
        reject(error);
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

      if (response && response.data) {
        const studentData = JSON.parse(response.data);
        return {
          rollNo: studentData["Roll-No"],
          fullName: studentData["Full-Name"],
          class: studentData["Class"],
          birthDate: studentData["Birth-Date"],
          address: studentData["Address"],
          enrollmentDate: studentData["Enrollment-Date"],
        };
      }

      return null;
    } catch (error) {
      console.error("Error getting student:", error);
      return null;
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

      if (response && response.data) {
        const studentsData = JSON.parse(response.data);
        return Object.values(studentsData).map((student: any) => ({
          rollNo: student["Roll-No"],
          fullName: student["Full-Name"],
          class: student["Class"],
          birthDate: student["Birth-Date"],
          address: student["Address"],
          enrollmentDate: student["Enrollment-Date"],
        }));
      }

      return [];
    } catch (error) {
      console.error("Error getting all students:", error);
      return [];
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

      if (
        response &&
        response.message &&
        response.message.includes("success")
      ) {
        return {
          ...student,
          enrollmentDate,
        };
      }

      return null;
    } catch (error) {
      console.error("Error creating student:", error);
      return null;
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

      if (
        response &&
        response.message &&
        response.message.includes("success")
      ) {
        return {
          rollNo,
          ...updates,
        };
      }

      return null;
    } catch (error) {
      console.error("Error updating student:", error);
      return null;
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

      return (
        response && response.message && response.message.includes("success")
      );
    } catch (error) {
      console.error("Error deleting student:", error);
      return false;
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
