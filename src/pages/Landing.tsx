import { useEffect, useState } from "react";
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
import type { Course, TsvSyncState } from "../types/gpa";
import { calculateOverallGpa } from "../utils/gpaCalculator";
import { downloadGpaCsv } from "../utils/csvExporter";
import { nextSemester, getSemesters } from "../utils/semesterUtils";
import { useProgrammeSync } from "../hooks/useProgrammeSync";
import { useGradeBook } from "../hooks/useGradeBook";
import { usePriorGpa } from "../hooks/usePriorGpa";
import { usePersistedState } from "../hooks/usePersistedState";
import { Info, Loader2, AlertCircle, Plus } from "lucide-react";
import Collapsible from "../components/UI/Collapsible";
import Button from "../components/UI/Button";
import EmptyState from "../components/UI/EmptyState";

const LS_ONBOARDING = "unimate_onboarding_v3";

interface OnboardingRecord {
  university?: "uwu";
  degreeId: string | null;
  maxSemester: number | null;
}

export default function Landing() {
  /* ── Concerns, each owned by its own hook ── */
  const programme = useProgrammeSync();
  const [onboarding, setOnboarding] = usePersistedState<OnboardingRecord | null>(LS_ONBOARDING, () => null);
  const maxSemester = onboarding?.maxSemester ?? null;
  const grades = useGradeBook(programme.fetchedCourses, maxSemester);

  const stats = calculateOverallGpa(grades.courses);
  const prior = usePriorGpa(stats);

  /* The combined course count is only known here, so the sync state is completed here */
  const tsvState: TsvSyncState = { ...programme.tsvState, courseCount: grades.courses.length };

  /* ── View + dialog state ── */
  const [activeView, setActiveView] = useState<NavView>("calculator");
  const [navOpen, setNavOpen] = useState(false);
  const [priorOpen, setPriorOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [defSem, setDefSem] = useState(1);

  /* ── Actions ── */
  const completeOnboarding = (r: OnboardingResult) => {
    setOnboarding({ university: "uwu", degreeId: r.degree?.id ?? null, maxSemester: r.maxSemester });
    if (r.degree) programme.selectDegree(r.degree);
    else programme.clearProgramme();
  };

  /** Returning to the default sheet also discards the user's grade data. */
  const resetToDefault = async () => {
    grades.clearAll();
    await programme.resetProgramme();
  };

  /* Escape closes the mobile drawer; lock the page behind it while open */
  useEffect(() => {
    if (!navOpen) return;
    document.body.classList.add("nav-locked");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("nav-locked");
      window.removeEventListener("keydown", onKey);
    };
  }, [navOpen]);

  /* ── Derived ── */
  const semesters = getSemesters(grades.courses);
  const lastSem = semesters[semesters.length - 1] ?? 1;
  const canAddSem = !maxSemester || nextSemester(lastSem) <= maxSemester;
  const openAdd = (sem?: number) => { setEditing(null); setDefSem(sem || semesters[0] || 1); setCourseOpen(true); };

  const exportData = () => {
    downloadGpaCsv({
      courses: grades.courses,
      stats,
      degree: tsvState.activeDegree,
      priorGpa: prior.priorGpa,
      combinedCgpa: prior.combinedCgpa,
      combinedEarned: prior.combinedEarned,
    });
  };


  return (
    <>
      {/* ══ APP SHELL: sidebar and header/content form one unit ══ */}
      <div className="app-shell">

        {/* LEFT NAV (off-canvas drawer on mobile) */}
        <LeftNav
          activeView={activeView}
          open={navOpen}
          tsvState={tsvState}
          onSelectDegreeProgram={programme.selectDegree}
          onChangeView={(v) => { setActiveView(v); setNavOpen(false); }}
        />

        <div className="content-col">
        {/* ══ HEADER - sits beside the sidebar, not above it ══ */}
        <Navbar
          tsvState={tsvState}
          navOpen={navOpen}
          onToggleNav={() => setNavOpen((o) => !o)}
          onResetAll={grades.resetGrades}
          onNavigateHome={() => setActiveView("calculator")}
        />

        {/* CONTENT AREA */}
        <div className="content-area">

          {/* ═══ ANALYTICS VIEW ═══ */}
          {activeView === "analytics" && (
            <AnalyticsView courses={grades.courses} stats={stats} />
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
                          {prior.priorGpa.enabled
                            ? `Prior GPA: ${prior.priorGpa.cgpa.toFixed(2)} · ${prior.priorGpa.credits} credits included`
                            : "Adding to an existing cumulative GPA? Click here"}
                        </span>
                      </span>
                    }
                  >
                    <div style={{ padding: "0 14px 14px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0 8px", cursor: "pointer" }}>
                        <input type="checkbox" checked={prior.priorGpa.enabled}
                          onChange={(e) => prior.setPriorGpa({ ...prior.priorGpa, enabled: e.target.checked })}
                          style={{ width: 14, height: 14, accentColor: "var(--blue)", cursor: "pointer" }} />
                        <span style={{ fontSize: 13, color: "var(--gray-700)" }}>Include prior GPA in cumulative calculation</span>
                      </label>
                      {prior.priorGpa.enabled && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div>
                            <label htmlFor="prior-cgpa" style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--gray-500)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Prior GPA</label>
                            <input id="prior-cgpa" type="number" className="inp" min="0" max="4" step="0.01" value={prior.priorGpa.cgpa} placeholder="e.g. 3.65"
                              onChange={(e) => prior.setPriorGpa({ ...prior.priorGpa, cgpa: Math.min(4, Math.max(0, parseFloat(e.target.value) || 0)) })} />
                          </div>
                          <div>
                            <label htmlFor="prior-cr" style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--gray-500)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Prior Credits</label>
                            <input id="prior-cr" type="number" className="inp" min="0" max="500" value={prior.priorGpa.credits} placeholder="e.g. 32"
                              onChange={(e) => prior.setPriorGpa({ ...prior.priorGpa, credits: Math.max(0, parseInt(e.target.value, 10) || 0) })} />
                          </div>
                        </div>
                      )}
                    </div>
                  </Collapsible>
                </div>

                {/* Loading */}
                {tsvState.isLoading && grades.courses.length === 0 && (
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

                {/* Empty (fallback) state - no hardcoded data; user adds their own */}
                {!tsvState.isLoading && !tsvState.error && grades.courses.length === 0 && (
                  <EmptyState text="No subjects loaded yet - sync a Google Sheet above, or add your own below." />
                )}

                {/* Semester cards */}
                {!tsvState.isLoading && semesters.map((sem) => (
                  <SemesterCard
                    key={sem}
                    semesterNumber={sem}
                    courses={grades.courses.filter((c) => c.semester === sem)}
                    onUpdateGrade={grades.updateGrade}
                    onUpdateCourseName={grades.updateName}
                    onUpdateCredits={grades.updateCredits}
                    onDeleteCourse={grades.deleteCourse}
                    onEditCourse={(c) => { setEditing(c); setCourseOpen(true); }}
                    onOpenAddCourseModal={(s) => openAdd(s)}
                    onQuickSetSemesterGrades={grades.quickSet}
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
                </div>
              </div>

              {/* ════ RIGHT COLUMN (sticky) ════ */}
              <div className="col-right">
                <GpaDashboard
                  stats={stats}
                  isPriorEnabled={prior.isPriorEnabled}
                  priorCgpa={prior.priorCgpa}
                  priorCredits={prior.priorCredits}
                  combinedCgpa={prior.combinedCgpa}
                  combinedEarned={prior.combinedEarned}
                  onExportData={exportData}
                />
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Scrim behind the mobile drawer */}
      <div className="nav-scrim" hidden={!navOpen} onClick={() => setNavOpen(false)} aria-hidden="true" />

      {/* ── Modals ── */}
      <TsvSyncModal isOpen={syncOpen} onClose={() => setSyncOpen(false)} tsvState={tsvState} courses={grades.courses}
        onSyncUrl={programme.syncUrl}
        onResetToDefault={resetToDefault} />
      <CourseModal key={courseOpen ? (editing?.id || "new") : "closed"} isOpen={courseOpen} onClose={() => { setCourseOpen(false); setEditing(null); }}
        onSaveCourse={grades.saveCourse} editingCourse={editing} defaultSemester={defSem} maxSemester={maxSemester ?? undefined} />

      {/* ── First-time onboarding (blocking) ── */}
      {!onboarding && (
        <OnboardingWizard onComplete={completeOnboarding} />
      )}
    </>
  );
}
