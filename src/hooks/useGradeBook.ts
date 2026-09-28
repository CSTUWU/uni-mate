import { useState } from "react";
import type { Course } from "../types/gpa";
import { usePersistedState } from "./usePersistedState";

const LS_GRADES = "unimate_grade_overrides_v3";
const LS_CUSTOM = "unimate_custom_courses_v3";
const LS_LEGACY = "unimate_gpa_courses_v2";

/* One-time migration from the legacy merged list (fetched rows + grades + custom courses) */
function readGradeOverrides(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LS_GRADES);
    if (raw) return JSON.parse(raw) as Record<string, string>;
    const legacy = localStorage.getItem(LS_LEGACY);
    if (legacy) {
      const list = JSON.parse(legacy);
      if (Array.isArray(list)) {
        const out: Record<string, string> = {};
        list.forEach((c: Course) => {
          if (!c.isCustom && c.grade && c.grade !== "Pending") out[c.code.toUpperCase()] = c.grade;
        });
        if (Object.keys(out).length > 0) return out;
      }
    }
  } catch { /* ignore */ }
  return {};
}

function readCustomCourses(): Course[] {
  try {
    const raw = localStorage.getItem(LS_CUSTOM);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list as Course[];
    }
    const legacy = localStorage.getItem(LS_LEGACY);
    if (legacy) {
      const list = JSON.parse(legacy);
      if (Array.isArray(list)) return list.filter((c: Course) => c.isCustom);
    }
  } catch { /* ignore */ }
  return [];
}

/**
 * Owns the grade book: the user's saved grades, custom courses, in-session row
 * edits and deletions, and the merged course list the rest of the app renders.
 * Takes the fetched rows as input so it never fetches anything itself.
 */
export function useGradeBook(fetched: Course[], maxSemester: number | null) {
  const [gradeOverrides, setGradeOverrides] = usePersistedState<Record<string, string>>(LS_GRADES, readGradeOverrides);
  const [customCourses, setCustomCourses] = usePersistedState<Course[]>(LS_CUSTOM, readCustomCourses);

  /* In-session ephemeral edits on synced rows (names/credits/deletes) */
  const [rowEdits, setRowEdits] = useState<Record<string, { name?: string; credits?: number }>>({});
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  /* ── Derived: fetched rows + saved grades + custom courses ──
     (plain computation - cheap, and React Compiler cannot preserve
     memoization built on custom-hook outputs) */
  const courses = [
    ...fetched
      .filter((c) => !hiddenIds.has(c.id) && (!maxSemester || c.semester <= maxSemester))
      .map((c) => ({
        ...c,
        ...(rowEdits[c.id] || {}),
        grade: gradeOverrides[c.code.toUpperCase()] || "Pending",
      })),
    ...customCourses.filter((c) => !maxSemester || c.semester <= maxSemester),
  ];

  const findCourse = (id: string) => courses.find((x) => x.id === id);

  /** Applies an edit to a custom course, or records it as an in-session row edit. */
  const editCustomOrRow = (id: string, patch: Partial<Course>) => {
    const c = findCourse(id);
    if (!c) return false;
    if (c.isCustom) setCustomCourses(customCourses.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    else setRowEdits({ ...rowEdits, [id]: { ...rowEdits[id], ...patch } });
    return true;
  };

  const updateGrade = (id: string, g: string) => {
    const c = findCourse(id);
    if (!c) return;
    if (c.isCustom) setCustomCourses(customCourses.map((x) => (x.id === id ? { ...x, grade: g } : x)));
    else setGradeOverrides({ ...gradeOverrides, [c.code.toUpperCase()]: g });
  };

  const updateName = (id: string, n: string) => { editCustomOrRow(id, { name: n }); };
  const updateCredits = (id: string, cr: number) => { editCustomOrRow(id, { credits: cr }); };

  const deleteCourse = (id: string) => {
    const c = findCourse(id);
    if (!c) return;
    if (c.isCustom) setCustomCourses(customCourses.filter((x) => x.id !== id));
    else setHiddenIds(new Set(hiddenIds).add(id));
  };

  const saveCourse = (data: Omit<Course, "id"> & { id?: string }) => {
    if (data.id) {
      setCustomCourses(customCourses.map((c) => (c.id === data.id ? { ...c, ...data } as Course : c)));
    } else {
      setCustomCourses([...customCourses, {
        id: `c-${Date.now()}`, code: data.code, name: data.name, credits: data.credits,
        semester: data.semester, grade: data.grade || "Pending", isCustom: true,
      }]);
    }
  };

  const quickSet = (sem: number, g: string) => {
    const nextOverrides = { ...gradeOverrides };
    courses.forEach((c) => {
      if (c.semester === sem && !c.isCustom) nextOverrides[c.code.toUpperCase()] = g;
    });
    setGradeOverrides(nextOverrides);
    setCustomCourses(customCourses.map((c) => (c.semester === sem ? { ...c, grade: g } : c)));
  };

  /** Clear every grade, keeping the courses themselves. */
  const resetGrades = () => {
    setGradeOverrides({});
    setCustomCourses(customCourses.map((c) => ({ ...c, grade: "Pending" })));
  };

  /** Discard grades, custom courses, row edits and deletions entirely. */
  const clearAll = () => {
    setGradeOverrides({});
    setCustomCourses([]);
    setRowEdits({});
    setHiddenIds(new Set());
  };

  return {
    courses,
    updateGrade,
    updateName,
    updateCredits,
    deleteCourse,
    saveCourse,
    quickSet,
    resetGrades,
    clearAll,
  };
}
