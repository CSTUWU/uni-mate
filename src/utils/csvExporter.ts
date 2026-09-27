import type { Course, DegreeProgram, GpaStats } from "../types/gpa";
import { formatSemester, getSemesters } from "./semesterUtils";
import { calculateSemesterSummary, getGradePoints } from "./gpaCalculator";

function escapeCsvField(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(fields: (string | number | boolean | null | undefined)[]): string {
  return fields.map(escapeCsvField).join(",");
}

export interface ExportGpaCsvOptions {
  courses: Course[];
  stats: GpaStats;
  degree?: DegreeProgram;
  priorGpa?: {
    enabled: boolean;
    cgpa: number;
    credits: number;
  };
  combinedCgpa?: number;
  combinedEarned?: number;
}

export function generateGpaCsv(options: ExportGpaCsvOptions): string {
  const { courses, stats, degree, priorGpa, combinedCgpa, combinedEarned } = options;
  const rows: string[] = [];

  // Summary header block
  rows.push(toCsvRow(["GPA & Course Academic Summary Report"]));
  rows.push(toCsvRow(["University", "Uva Wellassa University of Sri Lanka"]));
  rows.push(toCsvRow(["Generated At", new Date().toLocaleString()]));
  if (degree) {
    rows.push(toCsvRow(["Degree Program", degree.name ? `${degree.code} - ${degree.name}` : degree.code]));
  }
  rows.push(toCsvRow(["Cumulative GPA (CGPA)", stats.cgpa.toFixed(2)]));
  rows.push(toCsvRow(["Total Credits", stats.totalCredits]));
  rows.push(toCsvRow(["Earned / Graded Credits", stats.earnedCredits]));
  rows.push(toCsvRow(["Academic Classification", stats.honorsClassification]));
  rows.push(toCsvRow(["Graded Courses", `${stats.gradedCoursesCount} / ${stats.totalCoursesCount}`]));

  if (priorGpa?.enabled && priorGpa.credits > 0) {
    rows.push(toCsvRow(["Prior CGPA", priorGpa.cgpa.toFixed(2)]));
    rows.push(toCsvRow(["Prior Credits", priorGpa.credits]));
    if (combinedCgpa !== undefined) {
      rows.push(toCsvRow(["Combined CGPA", combinedCgpa.toFixed(2)]));
    }
    if (combinedEarned !== undefined) {
      rows.push(toCsvRow(["Combined Earned Credits", combinedEarned]));
    }
  }

  rows.push(""); // Blank line separator

  // Semester breakdown summary
  rows.push(toCsvRow(["--- Semester Summaries ---"]));
  rows.push(toCsvRow(["Semester", "Semester Code", "Courses", "Total Credits", "Earned Credits", "Semester GPA"]));
  const semList = getSemesters(courses);
  semList.forEach((sem) => {
    const semSum = calculateSemesterSummary(courses, sem);
    rows.push(
      toCsvRow([
        formatSemester(sem),
        sem,
        semSum.coursesCount,
        semSum.totalCredits,
        semSum.earnedCredits,
        semSum.earnedCredits > 0 ? semSum.gpa.toFixed(2) : "N/A",
      ])
    );
  });

  rows.push(""); // Blank line separator

  // Course Details Table
  rows.push(toCsvRow(["--- Course Details ---"]));
  rows.push(
    toCsvRow([
      "Semester",
      "Course Code",
      "Course Name",
      "Credits",
      "Grade",
      "Grade Points",
      "Quality Points",
      "Status",
      "Course Type",
    ])
  );

  // Sort courses by semester then code
  const sortedCourses = [...courses].sort((a, b) => {
    if (a.semester !== b.semester) return a.semester - b.semester;
    return a.code.localeCompare(b.code);
  });

  sortedCourses.forEach((c) => {
    const points = getGradePoints(c.grade);
    const isGraded = points !== null;
    const qualityPoints = isGraded ? (points * c.credits).toFixed(2) : "0.00";
    const status = isGraded ? "Completed" : "Pending";
    const courseType = c.isCustom ? "Custom" : "Curriculum";

    rows.push(
      toCsvRow([
        formatSemester(c.semester),
        c.code,
        c.name,
        c.credits,
        c.grade || "Pending",
        isGraded ? points.toFixed(2) : "N/A",
        qualityPoints,
        status,
        courseType,
      ])
    );
  });

  return rows.join("\r\n");
}

export function downloadGpaCsv(options: ExportGpaCsvOptions): void {
  const csvContent = generateGpaCsv(options);
  // Add UTF-8 BOM so Excel opens UTF-8 encoded text correctly
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const degreeCode = options.degree?.code
    ? options.degree.code.toLowerCase().replace(/[^a-z0-9_-]/g, "_")
    : "export";
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `gpa_${degreeCode}_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
