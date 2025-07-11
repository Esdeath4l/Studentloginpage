import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Student,
  StudentResponse,
  CreateStudentRequest,
  UpdateStudentRequest,
} from "@shared/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { GraduationCap, UserPlus, Save, RotateCcw } from "lucide-react";

interface FormState {
  rollNo: string;
  fullName: string;
  class: string;
  birthDate: string;
  address: string;
  enrollmentDate: string;
}

const initialFormState: FormState = {
  rollNo: "",
  fullName: "",
  class: "",
  birthDate: "",
  address: "",
  enrollmentDate: "",
};

export const StudentEnrollmentForm: React.FC = () => {
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [mode, setMode] = useState<"new" | "edit">("new");
  const [isLoading, setIsLoading] = useState(false);
  const [rollNoDisabled, setRollNoDisabled] = useState(false);
  const [fieldsDisabled, setFieldsDisabled] = useState(true);
  const [buttonsState, setButtonsState] = useState({
    save: false,
    update: false,
    reset: true,
  });

  const rollNoRef = useRef<HTMLInputElement>(null);
  const fullNameRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Focus on roll number field on component mount
  useEffect(() => {
    resetForm();
  }, []);

  const resetForm = () => {
    setFormData(initialFormState);
    setMode("new");
    setRollNoDisabled(false);
    setFieldsDisabled(true);
    setButtonsState({ save: false, update: false, reset: true });
    setTimeout(() => {
      rollNoRef.current?.focus();
    }, 0);
  };

  const validateForm = (): boolean => {
    const requiredFields =
      mode === "new"
        ? ["rollNo", "fullName", "class", "birthDate", "address"]
        : ["fullName", "class", "birthDate", "address", "enrollmentDate"];

    for (const field of requiredFields) {
      if (!formData[field as keyof FormState]?.trim()) {
        toast.error(
          `${field.replace(/([A-Z])/g, " $1").toLowerCase()} is required`,
        );
        return false;
      }
    }
    return true;
  };

  const handleRollNoChange = async (value: string) => {
    setFormData((prev) => ({ ...prev, rollNo: value }));

    if (!value.trim()) {
      setMode("new");
      setFieldsDisabled(true);
      setButtonsState({ save: false, update: false, reset: true });
      return;
    }

    // Check if student exists
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/students/${encodeURIComponent(value)}`,
      );
      const result: StudentResponse = await response.json();

      if (result.success && result.student) {
        // Student exists - load data and switch to edit mode
        setFormData({
          rollNo: result.student.rollNo,
          fullName: result.student.fullName,
          class: result.student.class,
          birthDate: result.student.birthDate,
          address: result.student.address,
          enrollmentDate: result.student.enrollmentDate,
        });
        setMode("edit");
        setRollNoDisabled(true);
        setFieldsDisabled(false);
        setButtonsState({ save: false, update: true, reset: true });

        setTimeout(() => {
          fullNameRef.current?.focus();
        }, 0);

        toast.success("Student record loaded for editing");
      } else {
        // Student doesn't exist - enable creation mode
        setMode("new");
        setRollNoDisabled(false);
        setFieldsDisabled(false);
        setButtonsState({ save: true, update: false, reset: true });

        setTimeout(() => {
          fullNameRef.current?.focus();
        }, 0);

        toast.info("New student - ready for enrollment");
      }
    } catch (error) {
      console.error("Error checking student:", error);
      toast.error("Error checking student record");
      setMode("new");
      setFieldsDisabled(false);
      setButtonsState({ save: true, update: false, reset: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      const requestData: CreateStudentRequest = {
        student: {
          rollNo: formData.rollNo,
          fullName: formData.fullName,
          class: formData.class,
          birthDate: formData.birthDate,
          address: formData.address,
        },
      };

      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const result: StudentResponse = await response.json();

      if (result.success) {
        toast.success("Student enrolled successfully!");
        resetForm();
      } else {
        toast.error(result.message || "Failed to save student");
      }
    } catch (error) {
      console.error("Error saving student:", error);
      toast.error("Error saving student record");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      const requestData: UpdateStudentRequest = {
        rollNo: formData.rollNo,
        student: {
          fullName: formData.fullName,
          class: formData.class,
          birthDate: formData.birthDate,
          address: formData.address,
          enrollmentDate: formData.enrollmentDate,
        },
      };

      const response = await fetch(
        `/api/students/${encodeURIComponent(formData.rollNo)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        },
      );

      const result: StudentResponse = await response.json();

      if (result.success) {
        toast.success("Student record updated successfully!");
        resetForm();
      } else {
        toast.error(result.message || "Failed to update student");
      }
    } catch (error) {
      console.error("Error updating student:", error);
      toast.error("Error updating student record");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <GraduationCap className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold text-foreground">
              Student Enrollment
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            School Management System
          </p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-t-lg">
            <CardTitle className="flex items-center text-2xl">
              <UserPlus className="h-6 w-6 mr-2" />
              Student Enrollment Form
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Enter student information to enroll in the school system
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Roll Number */}
              <div className="md:col-span-2">
                <Label
                  htmlFor="rollNo"
                  className="text-base font-semibold text-foreground"
                >
                  Roll Number *
                </Label>
                <Input
                  id="rollNo"
                  ref={rollNoRef}
                  type="text"
                  placeholder="Enter roll number"
                  value={formData.rollNo}
                  onChange={(e) => handleRollNoChange(e.target.value)}
                  disabled={rollNoDisabled || isLoading}
                  className="mt-2 h-12 text-base"
                />
              </div>

              {/* Full Name */}
              <div className="md:col-span-2">
                <Label
                  htmlFor="fullName"
                  className="text-base font-semibold text-foreground"
                >
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  ref={fullNameRef}
                  type="text"
                  placeholder="Enter full name"
                  value={formData.fullName}
                  onChange={(e) =>
                    handleInputChange("fullName", e.target.value)
                  }
                  disabled={fieldsDisabled || isLoading}
                  className="mt-2 h-12 text-base"
                />
              </div>

              {/* Class */}
              <div>
                <Label
                  htmlFor="class"
                  className="text-base font-semibold text-foreground"
                >
                  Class *
                </Label>
                <Input
                  id="class"
                  type="text"
                  placeholder="e.g., 10th A"
                  value={formData.class}
                  onChange={(e) => handleInputChange("class", e.target.value)}
                  disabled={fieldsDisabled || isLoading}
                  className="mt-2 h-12 text-base"
                />
              </div>

              {/* Birth Date */}
              <div>
                <Label
                  htmlFor="birthDate"
                  className="text-base font-semibold text-foreground"
                >
                  Birth Date *
                </Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) =>
                    handleInputChange("birthDate", e.target.value)
                  }
                  disabled={fieldsDisabled || isLoading}
                  className="mt-2 h-12 text-base"
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <Label
                  htmlFor="address"
                  className="text-base font-semibold text-foreground"
                >
                  Address *
                </Label>
                <Textarea
                  id="address"
                  placeholder="Enter complete address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  disabled={fieldsDisabled || isLoading}
                  className="mt-2 min-h-[100px] text-base resize-none"
                />
              </div>

              {/* Enrollment Date (only shown in edit mode) */}
              {mode === "edit" && (
                <div className="md:col-span-2">
                  <Label
                    htmlFor="enrollmentDate"
                    className="text-base font-semibold text-foreground"
                  >
                    Enrollment Date *
                  </Label>
                  <Input
                    id="enrollmentDate"
                    type="date"
                    value={formData.enrollmentDate}
                    onChange={(e) =>
                      handleInputChange("enrollmentDate", e.target.value)
                    }
                    disabled={fieldsDisabled || isLoading}
                    className="mt-2 h-12 text-base"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
              <Button
                onClick={handleSave}
                disabled={!buttonsState.save || isLoading}
                className="flex-1 h-12 text-base font-semibold"
                size="lg"
              >
                <Save className="h-5 w-5 mr-2" />
                Save
              </Button>

              <Button
                onClick={handleUpdate}
                disabled={!buttonsState.update || isLoading}
                variant="secondary"
                className="flex-1 h-12 text-base font-semibold"
                size="lg"
              >
                <Save className="h-5 w-5 mr-2" />
                Update
              </Button>

              <Button
                onClick={resetForm}
                disabled={!buttonsState.reset || isLoading}
                variant="outline"
                className="flex-1 h-12 text-base font-semibold"
                size="lg"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Reset
              </Button>
            </div>

            {/* Status Indicator */}
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Mode:{" "}
                <span className="font-semibold text-foreground">
                  {mode === "new" ? "New Enrollment" : "Edit Student"}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
