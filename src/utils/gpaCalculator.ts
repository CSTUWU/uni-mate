import type { Course, GradeOption, GpaStats, SemesterSummary } from "../types/gpa";

/* ──────────────────────────────────────────────────────────
   Grade Options - colour tokens align to spec success/warning/danger
   ────────────────────────────────────────────────────────── */
export const GRADE_OPTIONS: GradeOption[] = [
  {
    letter: "A+",
    points: 4.0,
    description: "High Distinction",
    colorClass: "badge-success",
  },
  {
    letter: "A",
    points: 4.0,
    description: "Distinction",
    colorClass: "badge-success",
  },
  {
    letter: "A-",
    points: 3.7,
    description: "Very Good",
    colorClass: "badge-success",
  },
  {
    letter: "B+",
    points: 3.3,
    description: "Good",
    colorClass: "badge-warning",
  },
  {
    letter: "B",
    points: 3.0,
    description: "Satisfactory",
    colorClass: "badge-warning",
  },
  {
    letter: "B-",
    points: 2.7,
    description: "Above Average",
    colorClass: "badge-warning",
  },
  {
    letter: "C+",
    points: 2.3,
    description: "Average",
    colorClass: "badge-warning",
  },
  {
    letter: "C",
    points: 2.0,
    description: "Pass",
    colorClass: "badge-warning",
  },
  {
    letter: "C-",
    points: 1.7,
    description: "Below Average",
    colorClass: "badge-danger",
  },
  {
    letter: "D+",
    points: 1.3,
    description: "Marginal Pass",
    colorClass: "badge-danger",
  },
  {
    letter: "D",
    points: 1.0,
    description: "Conditional Pass",
    colorClass: "badge-danger",
  },
  {
    letter: "E",
    points: 0.0,
    description: "Fail",
    colorClass: "badge-danger",
  },
];

export function getGradePoints(grade: string): number | null {
  if (!grade || grade === "Pending" || grade === "Select Grade") return null;
  const match = GRADE_OPTIONS.find(
    (g) => g.letter.toUpperCase() === grade.toUpperCase()
  );
  return match !== undefined ? match.points : null;
}

export function getGradeOption(grade: string): GradeOption | undefined {
  return GRADE_OPTIONS.find(
    (g) => g.letter.toUpperCase() === grade.toUpperCase()
  );
}

/* ──────────────────────────────────────────────────────────
   GPA Colour thresholds per spec:
     >= 3.5  → success (#16A34A)
     2.5–3.49 → warning (#D97706)
     < 2.5  → danger  (#DC2626)
   ────────────────────────────────────────────────────────── */
export function getGpaStatusClass(gpa: number): string {
  if (gpa >= 3.5) return "badge-success";
  if (gpa >= 2.5) return "badge-warning";
  return "badge-danger";
}

export function getGpaStatusColor(gpa: number): string {
  if (gpa >= 3.5) return "var(--color-success)";
  if (gpa >= 2.5) return "var(--color-warning)";
  return "var(--color-danger)";
}

/* ──────────────────────────────────────────────────────────
   Grade helpers - single source for grade → colour/band maps
   ────────────────────────────────────────────────────────── */
/** CSS colour for a grade's quality points (success / warning / danger) */
export function getGradeStatusColor(points: number): string {
  if (points >= 3.5) return "var(--green)";
  if (points >= 2.5) return "var(--amber)";
  return "var(--red)";
}

/** CSS badge class for a grade's quality points */
export function getGradeStatusClass(points: number): string {
  if (points >= 3.5) return "badge-success";
  if (points >= 2.5) return "badge-warning";
  return "badge-danger";
}

/** Performance band label for a grade's quality points */
export function getGradeBand(points: number): string {
  if (points >= 3.5) return "Distinction";
  if (points >= 2.5) return "Credit / Pass";
  if (points >= 1) return "Below Average";
  return "Fail";
}

/* ──────────────────────────────────────────────────────────
   Semester Summary
   ────────────────────────────────────────────────────────── */
export function calculateSemesterSummary(
  courses: Course[],
  semesterNum: number
): SemesterSummary {
  const semCourses = courses.filter((c) => c.semester === semesterNum);
  let totalQualityPoints = 0;
  let earnedCredits = 0;
  let totalCredits = 0;

  semCourses.forEach((course) => {
    // Zero-credit courses are tracked but excluded from GPA denominator
    if (course.credits > 0) {
      totalCredits += course.credits;
      const points = getGradePoints(course.grade);
      if (points !== null) {
        totalQualityPoints += points * course.credits;
        earnedCredits += course.credits;
      }
    }
  });

  const gpa =
    earnedCredits > 0
      ? parseFloat((totalQualityPoints / earnedCredits).toFixed(3))
      : 0;

  return {
    semesterNumber: semesterNum,
    totalCredits,
    earnedCredits,
    gpa,
    coursesCount: semCourses.length,
  };
}

/* ──────────────────────────────────────────────────────────
   Overall CGPA
   ────────────────────────────────────────────────────────── */
export function calculateOverallGpa(courses: Course[]): GpaStats {
  let totalQualityPoints = 0;
  let earnedCredits = 0;
  let totalCredits = 0;
  let gradedCoursesCount = 0;

  courses.forEach((course) => {
    // Zero-credit courses excluded from GPA denominator
    if (course.credits > 0) {
      totalCredits += course.credits;
      const points = getGradePoints(course.grade);
      if (points !== null) {
        totalQualityPoints += points * course.credits;
        earnedCredits += course.credits;
        gradedCoursesCount++;
      }
    }
  });

  const cgpa =
    earnedCredits > 0
      ? parseFloat((totalQualityPoints / earnedCredits).toFixed(3))
      : 0;

  const honorsInfo = getHonorsClassification(cgpa, earnedCredits);

  return {
    cgpa,
    totalCredits,
    earnedCredits,
    gradedCoursesCount,
    totalCoursesCount: courses.length,
    honorsClassification: honorsInfo.label,
    honorsBadgeColor: honorsInfo.badgeClass,
  };
}

/* ──────────────────────────────────────────────────────────
   Honors Classification
   ────────────────────────────────────────────────────────── */
export function getHonorsClassification(
  cgpa: number,
  earnedCredits: number
): { label: string; badgeClass: string } {
  if (earnedCredits === 0) {
    return {
      label: "No Grades Entered Yet",
      badgeClass: "badge-neutral",
    };
  }
  if (cgpa >= 3.7) {
    return {
      label: "First Class Honours",
      badgeClass: "badge-success",
    };
  }
  if (cgpa >= 3.3) {
    return {
      label: "Second Class Upper",
      badgeClass: "badge-success",
    };
  }
  if (cgpa >= 3.0) {
    return {
      label: "Second Class Lower",
      badgeClass: "badge-warning",
    };
  }
  if (cgpa >= 2.0) {
    return {
      label: "General Pass",
      badgeClass: "badge-warning",
    };
  }
  return {
    label: "Below Passing - Action Required",
    badgeClass: "badge-danger",
  };
}

/* ──────────────────────────────────────────────────────────
   Target GPA Simulator
   ────────────────────────────────────────────────────────── */
export function calculateTargetRequiredGpa(
  currentCgpa: number,
  currentCredits: number,
  targetCgpa: number,
  remainingCredits: number
): number | null {
  if (remainingCredits <= 0) return null;
  const currentQp = currentCgpa * currentCredits;
  const targetTotalQp = targetCgpa * (currentCredits + remainingCredits);
  const requiredQp = targetTotalQp - currentQp;
  return parseFloat((requiredQp / remainingCredits).toFixed(3));
}

/* ──────────────────────────────────────────────────────────
   With Prior GPA Pre-Loader (returning student support)
   ────────────────────────────────────────────────────────── */
export function calculateCombinedCgpa(
  priorCgpa: number,
  priorCredits: number,
  currentCgpa: number,
  currentCredits: number
): number {
  const totalCredits = priorCredits + currentCredits;
  if (totalCredits === 0) return 0;
  const totalQp = priorCgpa * priorCredits + currentCgpa * currentCredits;
  return parseFloat((totalQp / totalCredits).toFixed(3));
}
