/* ──────────────────────────────────────────────────────────
   Semester helpers
   Semester codes use the "Year.Term" convention:
   e.g. 1.2 = 1st year, 2nd semester · 2.1 = 2nd year, 1st semester
   Plain integers (1, 2, 3…) are also accepted.
   ────────────────────────────────────────────────────────── */

const round1 = (n: number): number => Math.round(n * 10) / 10;

export function semesterToYear(sem: number): number {
  return Math.floor(sem);
}

export function semesterToTerm(sem: number): number {
  return Math.round((sem - Math.floor(sem)) * 10);
}

/** Parse a raw cell value ("1.2", "1,2", 1.2, "1") into a semester code. */
export function parseSemesterCode(raw: string | number): number {
  if (typeof raw === "number") return round1(raw) > 0 ? round1(raw) : 1;
  const str = String(raw).trim().replace(",", ".");
  const num = parseFloat(str);
  if (isNaN(num) || num <= 0) return 1;
  return round1(num);
}

/** "Year 1 · Semester 2" - plain integers render as "Semester 1". */
export function formatSemester(sem: number): string {
  const year = semesterToYear(sem);
  const term = semesterToTerm(sem);
  return term > 0 ? `Year ${year} · Semester ${term}` : `Semester ${sem}`;
}

/** Compact code form: "1.2" or "1". */
export function formatSemesterShort(sem: number): string {
  const year = semesterToYear(sem);
  const term = semesterToTerm(sem);
  return term > 0 ? `${year}.${term}` : `${year}`;
}

/** Next semester in sequence: 1.1 → 1.2 → 2.1 → 2.2 → 3.1 … */
export function nextSemester(sem: number): number {
  const year = semesterToYear(sem);
  const term = semesterToTerm(sem);
  if (term <= 0) return year + 1;
  if (term === 1) return round1(year + 0.2);
  return round1(year + 1 + 0.1);
}

/** Options for a year-based semester picker, e.g. 1.1 … 4.2 */
export function semesterOptions(maxYear = 4): number[] {
  const opts: number[] = [];
  for (let y = 1; y <= maxYear; y++) {
    opts.push(round1(y + 0.1), round1(y + 0.2));
  }
  return opts;
}

/** Sorted list of distinct semester codes present in a course list */
export function getSemesters(courses: { semester: number }[]): number[] {
  return Array.from(new Set(courses.map((c) => c.semester))).sort((a, b) => a - b);
}
