import { RequestHandler } from "express";
import {
  Student,
  StudentResponse,
  StudentsListResponse,
  CreateStudentRequest,
  UpdateStudentRequest,
} from "@shared/api";
import { jsonPowerDb } from "../services/jsonPowerDb";

/**
 * GET /api/students/:rollNo - Get a student by roll number
 */
export const getStudent: RequestHandler = async (req, res) => {
  try {
    console.log("GET request received:", req.method, req.path, req.params);
    const { rollNo } = req.params;

    if (!rollNo) {
      const response: StudentResponse = {
        success: false,
        message: "Roll number is required",
      };
      return res.status(400).json(response);
    }

    const student = await jsonPowerDb.getStudent(rollNo);

    if (!student) {
      const response: StudentResponse = {
        success: false,
        message: "Student not found",
      };
      return res.status(404).json(response);
    }

    const response: StudentResponse = {
      success: true,
      student,
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting student:", error);
    const response: StudentResponse = {
      success: false,
      message: "Internal server error",
    };
    res.status(500).json(response);
  }
};

/**
 * GET /api/students - Get all students
 */
export const getAllStudents: RequestHandler = async (req, res) => {
  try {
    const students = await jsonPowerDb.getAllStudents();

    const response: StudentsListResponse = {
      success: true,
      students,
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting all students:", error);
    const response: StudentsListResponse = {
      success: false,
      students: [],
    };
    res.status(500).json(response);
  }
};

/**
 * POST /api/students - Create a new student
 */
export const createStudent: RequestHandler = async (req, res) => {
  try {
    console.log("CREATE request received:", req.method, req.path, req.body);
    const { student } = req.body as CreateStudentRequest;

    if (!student) {
      const response: StudentResponse = {
        success: false,
        message: "Student data is required",
      };
      return res.status(400).json(response);
    }

    // Validate required fields
    const requiredFields = [
      "rollNo",
      "fullName",
      "class",
      "birthDate",
      "address",
    ];
    const missingFields = requiredFields.filter(
      (field) =>
        !student[field as keyof typeof student] ||
        student[field as keyof typeof student].toString().trim() === "",
    );

    if (missingFields.length > 0) {
      const response: StudentResponse = {
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      };
      return res.status(400).json(response);
    }

    // Check if student already exists
    if (await jsonPowerDb.studentExists(student.rollNo)) {
      const response: StudentResponse = {
        success: false,
        message: "Student with this roll number already exists",
      };
      return res.status(409).json(response);
    }

    const newStudent = await jsonPowerDb.createStudent(student);

    if (!newStudent) {
      const response: StudentResponse = {
        success: false,
        message: "Failed to create student in database",
      };
      return res.status(500).json(response);
    }

    const response: StudentResponse = {
      success: true,
      student: newStudent,
      message: "Student created successfully",
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating student:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    const response: StudentResponse = {
      success: false,
      message: "Internal server error",
    };
    res.status(500).json(response);
  }
};

/**
 * PUT /api/students/:rollNo - Update a student
 */
export const updateStudent: RequestHandler = async (req, res) => {
  try {
    console.log(
      "UPDATE request received:",
      req.method,
      req.path,
      req.params,
      req.body,
    );
    const { rollNo } = req.params;
    const { student: studentUpdates } = req.body as UpdateStudentRequest;

    if (!rollNo) {
      const response: StudentResponse = {
        success: false,
        message: "Roll number is required",
      };
      return res.status(400).json(response);
    }

    if (!studentUpdates) {
      const response: StudentResponse = {
        success: false,
        message: "Student data is required",
      };
      return res.status(400).json(response);
    }

    // Validate required fields
    const requiredFields = [
      "fullName",
      "class",
      "birthDate",
      "address",
      "enrollmentDate",
    ];
    const missingFields = requiredFields.filter(
      (field) =>
        !studentUpdates[field as keyof typeof studentUpdates] ||
        studentUpdates[field as keyof typeof studentUpdates]
          .toString()
          .trim() === "",
    );

    if (missingFields.length > 0) {
      const response: StudentResponse = {
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      };
      return res.status(400).json(response);
    }

    const updatedStudent = await jsonPowerDb.updateStudent(
      rollNo,
      studentUpdates,
    );

    if (!updatedStudent) {
      const response: StudentResponse = {
        success: false,
        message: "Student not found or failed to update",
      };
      return res.status(404).json(response);
    }

    const response: StudentResponse = {
      success: true,
      student: updatedStudent,
      message: "Student updated successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating student:", error);
    const response: StudentResponse = {
      success: false,
      message: "Internal server error",
    };
    res.status(500).json(response);
  }
};

/**
 * DELETE /api/students/:rollNo - Delete a student
 */
export const deleteStudent: RequestHandler = async (req, res) => {
  try {
    const { rollNo } = req.params;

    if (!rollNo) {
      const response: StudentResponse = {
        success: false,
        message: "Roll number is required",
      };
      return res.status(400).json(response);
    }

    const deleted = await jsonPowerDb.deleteStudent(rollNo);

    if (!deleted) {
      const response: StudentResponse = {
        success: false,
        message: "Student not found or failed to delete",
      };
      return res.status(404).json(response);
    }

    const response: StudentResponse = {
      success: true,
      message: "Student deleted successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting student:", error);
    const response: StudentResponse = {
      success: false,
      message: "Internal server error",
    };
    res.status(500).json(response);
  }
};
