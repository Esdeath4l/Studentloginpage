import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  getStudent,
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} from "./routes/students";
import { initializeSampleData } from "./services/jsonPowerDb";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);

  // Student API routes
  app.get("/api/students", getAllStudents);
  app.get("/api/students/:rollNo", getStudent);
  app.post("/api/students", createStudent);
  app.put("/api/students/:rollNo", updateStudent);
  app.delete("/api/students/:rollNo", deleteStudent);

  // Initialize sample data
  initializeSampleData();

  return app;
}
