import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Navbar from "../components/Navbar/Navbar";
import LeftNav from "../components/Nav/LeftNav";
import type { NavView } from "../components/Nav/LeftNav";
import GpaDashboard from "../components/GpaCalculator/GpaDashboard";
import SemesterCard from "../components/GpaCalculator/SemesterCard";
import AnalyticsView from "../components/GpaCalculator/AnalyticsView";
import GradeScaleView from "../components/GpaCalculator/GradeScaleView";
import TsvSyncModal from "../components/GpaCalculator/TsvSyncModal";
import CourseModal from "../components/GpaCalculator/CourseModal";
import OnboardingWizard from "../components/Onboarding/OnboardingWizard";
import type { OnboardingResult } from "../components/Onboarding/OnboardingWizard";
import type { Course, TsvSyncState, DegreeProgram } from "../types/gpa";
import { calculateOverallGpa, calculateCombinedCgpa } from "../utils/gpaCalculator";
import { downloadGpaCsv } from "../utils/csvExporter";
import { nextSemester, getSemesters } from "../utils/semesterUtils";
import {
  DEFAULT_GOOGLE_SHEET_TSV_URL,
  fetchCoursesFromTsvUrl, discoverDegreeProgramsFromSheet,
} from "../utils/tsvParser";
import { useDegreePrograms, useTsvCourses, baseUrlOf, tsvCoursesKey, degreesKey } from "../hooks/useGpaData";
import { usePersistedState } from "../hooks/usePersistedState";
import { Info, Loader2, AlertCircle, Plus, RefreshCw } from "lucide-react";
import Collapsible from "../components/UI/Collapsible";
import Button from "../components/UI/Button";
import EmptyState from "../components/UI/EmptyState";

const LS_TSV_URL        = "unimate_tsv_url_v2";
const LS_DEGREE_ID      = "unimate_active_degree_id_v2";
const LS_PRIOR          = "unimate_prior_gpa_v2";
const LS_GRADES         = "unimate_grade_overrides_v3";
const LS_CUSTOM         = "unimate_custom_courses_v3";
const LS_CUSTOM_DEGREES = "unimate_custom_degrees_v3";
const LS_ONBOARDING     = "unimate_onboarding_v3";
const LS_LEGACY         = "unimate_gpa_courses_v2";

interface PriorGpa { enabled: boolean; cgpa: number; credits: number; }

interface OnboardingRecord {
  university?: "uwu";
  degreeId: string | null;
  maxSemester: number | null;
}

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

export default function Landing() {
  const queryClient = useQueryClient();

  /* ── TSV / degree state ── (null URL = manual mode, nothing to fetch) */
  const [tsvUrl, setTsvUrl] = useState<string | null>(
    () => localStorage.getItem(LS_TSV_URL)
  );
  const [activeDegree, setActiveDegree] = useState<DegreeProgram | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<NavView>("calculator");

  /* ── Persisted user data ── */
  const [onboarding, setOnboarding] = usePersistedState<OnboardingRecord | null>(LS_ONBOARDING, () => null);
  const [priorGpa, setPriorGpa] = usePersistedState<PriorGpa>(LS_PRIOR, () => ({ enabled: false, cgpa: 0, credits: 0 }));
  const [gradeOverrides, setGradeOverrides] = usePersistedState<Record<string, string>>(LS_GRADES, readGradeOverrides);
  const [customCourses, setCustomCourses] = usePersistedState<Course[]>(LS_CUSTOM, readCustomCourses);
  const [customDegrees, setCustomDegrees] = usePersistedState<DegreeProgram[]>(LS_CUSTOM_DEGREES, () => []);
  const [priorOpen, setPriorOpen] = useState(false);

  /* ── Modals ── */
  const [syncOpen, setSyncOpen] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [defSem, setDefSem] = useState(1);

  /* In-session ephemeral edits on synced rows (names/credits/deletes) */
  const [rowEdits, setRowEdits] = useState<Record<string, { name?: string; credits?: number }>>({});
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  /* ── TanStack Query: TSV data is cached per URL — no repeated fetches ── */
  const degreesQuery  = useDegreePrograms(tsvUrl ? baseUrlOf(tsvUrl) : null);
  const discovered    = degreesQuery.data ?? [];
  const allDegrees    = [
    ...discovered,
    /* user-added degrees (named by them) — keep unless discovery later finds the same sheet */
    ...customDegrees.filter((c) => !discovered.some((d) => d.tsvUrl === c.tsvUrl)),
  ];
  const coursesQuery  = useTsvCourses(tsvUrl);

  /* Onboarding limits: only show semesters up to the user's current one */
  const maxSemester = onboarding?.maxSemester ?? null;

  /* Resolve the degree matching the current TSV URL (falls back to last selection) */
  const resolvedDegree = tsvUrl ? (allDegrees.find((d) => d.tsvUrl === tsvUrl) ?? activeDegree) : null;

  /* ── Derived course list: fetched rows + saved grades + custom courses ──
     (plain computation — values are cheap and React Compiler cannot
     preserve memoization built on custom-hook outputs) */
  const courses = [
    ...(coursesQuery.data ?? [])
      .filter((c) => !hiddenIds.has(c.id) && (!maxSemester || c.semester <= maxSemester))
      .map((c) => ({
        ...c,
        ...(rowEdits[c.id] || {}),
        grade: gradeOverrides[c.code.toUpperCase()] || "Pending",
      })),
    ...customCourses.filter((c) => !maxSemester || c.semester <= maxSemester),
  ];

  /* ── Actions ── */
  const completeOnboarding = (r: OnboardingResult) => {
    setOnboarding({ university: "uwu", degreeId: r.degree?.id ?? null, maxSemester: r.maxSemester });
    if (r.degree) {
      setActiveDegree(r.degree);
      setTsvUrl(r.degree.tsvUrl);
      localStorage.setItem(LS_TSV_URL, r.degree.tsvUrl);
      localStorage.setItem(LS_DEGREE_ID, r.degree.id);
    } else {
      setActiveDegree(null);
      setTsvUrl(null);
      localStorage.removeItem(LS_TSV_URL);
    }
  };

  const selectDegree = (d: DegreeProgram) => {
    setActiveDegree(d);
    setTsvUrl(d.tsvUrl);
    localStorage.setItem(LS_TSV_URL, d.tsvUrl);
    localStorage.setItem(LS_DEGREE_ID, d.id);
  };

  const syncUrl = async (url: string, degreeName?: string) => {
    const data = await fetchCoursesFromTsvUrl(url); // throws → sync modal shows the error
    queryClient.setQueryData<Course[]>(tsvCoursesKey(url), data);
    setTsvUrl(url);
    localStorage.setItem(LS_TSV_URL, url);
    setLastSynced(new Date().toLocaleTimeString());
    const base = baseUrlOf(url);
    const degs = await discoverDegreeProgramsFromSheet(base);
    queryClient.setQueryData<DegreeProgram[]>(degreesKey(base), degs);
    const match = degs.find((d) => d.tsvUrl === url);
    if (match) {
      setActiveDegree(match);
    } else {
      /* Not auto-discoverable → the user adds/names their own degree */
      const entry: DegreeProgram = {
        id: `custom-${Date.now()}`,
        code: "CUSTOM",
        name: degreeName?.trim() || "Custom Degree",
        gid: "",
        tsvUrl: url,
      };
      setCustomDegrees([...customDegrees.filter((c) => c.tsvUrl !== url), entry]);
      setActiveDegree(entry);
    }
  };

  const resetDef = async () => {
    queryClient.removeQueries({ queryKey: ["tsv-courses"] });
    queryClient.removeQueries({ queryKey: ["degrees"] });
    setGradeOverrides({});
    setCustomCourses([]);
    setRowEdits({});
    setHiddenIds(new Set());
    setActiveDegree(null);
    setTsvUrl(DEFAULT_GOOGLE_SHEET_TSV_URL);
    localStorage.setItem(LS_TSV_URL, DEFAULT_GOOGLE_SHEET_TSV_URL);
    const data = await fetchCoursesFromTsvUrl(DEFAULT_GOOGLE_SHEET_TSV_URL);
    queryClient.setQueryData<Course[]>(tsvCoursesKey(DEFAULT_GOOGLE_SHEET_TSV_URL), data);
    const degs = await discoverDegreeProgramsFromSheet(DEFAULT_GOOGLE_SHEET_TSV_URL);
    queryClient.setQueryData<DegreeProgram[]>(degreesKey(DEFAULT_GOOGLE_SHEET_TSV_URL), degs);
  };

  const updateGrade = (id: string, g: string) => {
    const c = courses.find((x) => x.id === id);
    if (!c) return;
    if (c.isCustom) setCustomCourses(customCourses.map((x) => (x.id === id ? { ...x, grade: g } : x)));
    else setGradeOverrides({ ...gradeOverrides, [c.code.toUpperCase()]: g });
  };

  const updateName = (id: string, n: string) => {
    const c = courses.find((x) => x.id === id);
    if (!c) return;
    if (c.isCustom) setCustomCourses(customCourses.map((x) => (x.id === id ? { ...x, name: n } : x)));
    else setRowEdits({ ...rowEdits, [id]: { ...rowEdits[id], name: n } });
  };

  const updateCredits = (id: string, cr: number) => {
    const c = courses.find((x) => x.id === id);
    if (!c) return;
    if (c.isCustom) setCustomCourses(customCourses.map((x) => (x.id === id ? { ...x, credits: cr } : x)));
    else setRowEdits({ ...rowEdits, [id]: { ...rowEdits[id], credits: cr } });
  };

  const deleteCourse = (id: string) => {
    const c = courses.find((x) => x.id === id);
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

  const resetGrades = () => {
    setGradeOverrides({});
    setCustomCourses(customCourses.map((c) => ({ ...c, grade: "Pending" })));
  };

  /* ── Derived ── */
  const stats        = calculateOverallGpa(courses);
  const isPriorEnabled = priorGpa.enabled;
  const priorCgpa      = priorGpa.cgpa;
  const priorCredits   = priorGpa.credits;
  const combinedCgpa = isPriorEnabled && priorCredits > 0
    ? calculateCombinedCgpa(priorCgpa, priorCredits, stats.cgpa, stats.earnedCredits)
    : stats.cgpa;
  const combinedEarned = isPriorEnabled ? stats.earnedCredits + priorCredits : stats.earnedCredits;
  const semesters    = getSemesters(courses);
  const lastSem      = semesters[semesters.length - 1] ?? 1;
  const canAddSem    = !maxSemester || nextSemester(lastSem) <= maxSemester;
  const openAdd   = (sem?: number) => { setEditing(null); setDefSem(sem || semesters[0] || 1); setCourseOpen(true); };

  const exportData = () => {
    downloadGpaCsv({
      courses,
      stats,
      degree: tsvState.activeDegree,
      priorGpa,
      combinedCgpa,
      combinedEarned,
    });
  };

  const tsvState: TsvSyncState = {
    url: tsvUrl ?? "",
    lastSyncedAt: lastSynced,
    isLoading: coursesQuery.isFetching || degreesQuery.isFetching,
    error: coursesQuery.error instanceof Error ? coursesQuery.error.message
         : degreesQuery.error instanceof Error ? degreesQuery.error.message : null,
    courseCount: courses.length,
    activeDegree: resolvedDegree ?? undefined,
    availableDegrees: allDegrees,
  };

  return (
    <>
      {/* ══ HEADER ══ */}
      <Navbar
        tsvState={tsvState}
        onOpenSyncModal={() => setSyncOpen(true)}
        onSelectDegreeProgram={selectDegree}
        onResetAll={resetGrades}
        onNavigateHome={() => setActiveView("calculator")}
      />

      {/* ══ APP SHELL: left-nav + content-area ══ */}
      <div className="app-shell">

        {/* LEFT NAV */}
        <LeftNav activeView={activeView} onChangeView={setActiveView} />

        {/* CONTENT AREA */}
        <div className="content-area">

          {/* ═══ ANALYTICS VIEW ═══ */}
          {activeView === "analytics" && (
            <AnalyticsView courses={courses} stats={stats} />
          )}

          {/* ═══ GRADE SCALE VIEW ═══ */}
          {activeView === "grade-scale" && <GradeScaleView />}

          {/* ═══ CALCULATOR VIEW (default) ═══ */}
          {activeView === "calculator" && (
            <div className="page-wrap">

              {/* ════ LEFT COLUMN ════ */}
              <div className="col-left">

                {/* Prior History Accordion */}
                <div className="card" style={{ marginBottom: 14, overflow: "hidden" }}>
                  <Collapsible
                    open={priorOpen}
                    onToggle={() => setPriorOpen((o) => !o)}
                    headerStyle={{ padding: "12px 14px" }}
                    header={
                      <span style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                        <Info size={14} style={{ color: "var(--blue)", flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--gray-700)", flex: 1, textAlign: "left" }}>
                          {priorGpa.enabled
                            ? `Prior GPA: ${priorGpa.cgpa.toFixed(2)} · ${priorGpa.credits} credits included`
                            : "Adding to an existing cumulative GPA? Click here"}
                        </span>
                      </span>
                    }
                  >
                    <div style={{ padding: "0 14px 14px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0 8px", cursor: "pointer" }}>
                        <input type="checkbox" checked={priorGpa.enabled} onChange={(e) => setPriorGpa({ ...priorGpa, enabled: e.target.checked })}
                          style={{ width: 14, height: 14, accentColor: "var(--blue)", cursor: "pointer" }} />
                        <span style={{ fontSize: 13, color: "var(--gray-700)" }}>Include prior GPA in cumulative calculation</span>
                      </label>
                      {priorGpa.enabled && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div>
                            <label htmlFor="prior-cgpa" style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--gray-500)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Prior GPA</label>
                            <input id="prior-cgpa" type="number" className="inp" min="0" max="4" step="0.01" value={priorGpa.cgpa} placeholder="e.g. 3.65"
                              onChange={(e) => setPriorGpa({ ...priorGpa, cgpa: Math.min(4, Math.max(0, parseFloat(e.target.value) || 0)) })} />
                          </div>
                          <div>
                            <label htmlFor="prior-cr" style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--gray-500)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Prior Credits</label>
                            <input id="prior-cr" type="number" className="inp" min="0" max="500" value={priorGpa.credits} placeholder="e.g. 32"
                              onChange={(e) => setPriorGpa({ ...priorGpa, credits: Math.max(0, parseInt(e.target.value, 10) || 0) })} />
                          </div>
                        </div>
                      )}
                    </div>
                  </Collapsible>
                </div>

                {/* Loading */}
                {tsvState.isLoading && !coursesQuery.data?.length && (
                  <div className="card" style={{ padding: 36, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 13, color: "var(--gray-400)" }}>
                    <Loader2 size={16} className="animate-spin" style={{ color: "var(--blue)" }} /> Loading subjects from Google Sheets…
                  </div>
                )}

                {/* Error */}
                {!tsvState.isLoading && tsvState.error && (
                  <div className="b-red" style={{ padding: "10px 14px", borderRadius: "var(--r)", fontSize: 13, display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <AlertCircle size={14} /> {tsvState.error}
                    <button style={{ marginLeft: "auto", fontWeight: 600, textDecoration: "underline", background: "none", border: "none", cursor: "pointer", color: "inherit", fontFamily: "inherit" }} onClick={() => setSyncOpen(true)}>Fix</button>
                  </div>
                )}

                {/* Empty (fallback) state — no hardcoded data; user adds their own */}
                {!tsvState.isLoading && !tsvState.error && courses.length === 0 && (
                  <EmptyState text="No subjects loaded yet — sync a Google Sheet above, or add your own below." />
                )}

                {/* Semester cards */}
                {!tsvState.isLoading && semesters.map((sem) => (
                  <SemesterCard
                    key={sem}
                    semesterNumber={sem}
                    courses={courses.filter((c) => c.semester === sem)}
                    onUpdateGrade={updateGrade}
                    onUpdateCourseName={updateName}
                    onUpdateCredits={updateCredits}
                    onDeleteCourse={deleteCourse}
                    onEditCourse={(c) => { setEditing(c); setCourseOpen(true); }}
                    onOpenAddCourseModal={(s) => openAdd(s)}
                    onQuickSetSemesterGrades={quickSet}
                  />
                ))}

                {/* Add semester (capped at the onboarding limit) */}
                {!tsvState.isLoading && canAddSem && (
                  <Button
                    variant="dashed"
                    fullWidth
                    onClick={() => openAdd(semesters.length ? nextSemester(lastSem) : undefined)}
                    style={{ marginTop: 4, padding: "10px 0" }}
                  >
                    <Plus size={14} /> {semesters.length ? "Add Another Semester" : "Add Your First Semester"}
                  </Button>
                )}

                {/* Footer note */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "28px 0 20px" }}>
                  <span style={{ fontSize: 11, color: "var(--gray-400)" }}>Data auto-saved to browser</span>
                  <button
                    onClick={() => setSyncOpen(true)}
                    className="btn btn-secondary"
                    style={{ padding: "6px 12px", fontSize: 12 }}
                  >
                    <RefreshCw size={12} /> Sync Subjects
                  </button>
                </div>
              </div>

              {/* ════ RIGHT COLUMN (sticky) ════ */}
              <div className="col-right">
                <GpaDashboard
                  stats={stats}
                  isPriorEnabled={priorGpa.enabled}
                  priorCgpa={priorGpa.cgpa}
                  priorCredits={priorGpa.credits}
                  combinedCgpa={combinedCgpa}
                  combinedEarned={combinedEarned}
                  onExportData={exportData}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <TsvSyncModal isOpen={syncOpen} onClose={() => setSyncOpen(false)} tsvState={tsvState} courses={courses}
        onSyncUrl={syncUrl}
        onResetToDefault={resetDef} />
      <CourseModal key={courseOpen ? (editing?.id || "new") : "closed"} isOpen={courseOpen} onClose={() => { setCourseOpen(false); setEditing(null); }}
        onSaveCourse={saveCourse} editingCourse={editing} defaultSemester={defSem} maxSemester={maxSemester ?? undefined} />

      {/* ── First-time onboarding (blocking) ── */}
      {!onboarding && (
        <OnboardingWizard onComplete={completeOnboarding} />
      )}
    </>
  );
}
