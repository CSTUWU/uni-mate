import { Fragment, useState } from "react";
import type { DegreeProgram } from "../../types/gpa";
import { DEFAULT_GOOGLE_SHEET_TSV_URL } from "../../utils/tsvParser";
import { useDegreePrograms } from "../../hooks/useGpaData";
import { formatSemester, semesterOptions } from "../../utils/semesterUtils";
import { GraduationCap, School, CalendarDays, Check, Loader2, BarChart3, ChevronRight } from "lucide-react";
import Button from "../UI/Button";
import SearchSelect from "../UI/SearchSelect";
import type { SelectOption } from "../UI/CustomSelect";

export interface OnboardingResult {
  degree: DegreeProgram | null;
  maxSemester: number | null;
}

interface OnboardingWizardProps {
  onComplete: (result: OnboardingResult) => void;
}

const STEPS = ["Degree", "Semester"];

const STEP_META = [
  {
    title: "Select your degree programme",
    subtitle: "Pick the Uva Wellassa University programme you're enrolled in.",
  },
  {
    title: "Where are you in your degree?",
    subtitle: "You'll only see semesters up to this point — no clutter from later years.",
  },
];

const FEATURES = [
  { icon: <School size={15} />, text: "Live subject sync from UWU degree sheets" },
  { icon: <CalendarDays size={15} />, text: "See only the semesters you've reached" },
  { icon: <BarChart3 size={15} />, text: "CGPA, honours classification & analytics" },
];

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [degree, setDegree] = useState<DegreeProgram | null>(null);
  const [maxSemester, setMaxSemester] = useState(1.1);
  const [step, setStep] = useState(1);
  const stepIndex = step - 1;
  const meta = STEP_META[stepIndex];

  /* Discover degrees from the default spreadsheet (cached by TanStack Query) */
  const degreesQuery = useDegreePrograms(DEFAULT_GOOGLE_SHEET_TSV_URL);
  const discovered = degreesQuery.data ?? [];

  const degreeOptions: SelectOption[] = discovered.map((d) => ({
    value: d.id,
    label: `${d.code} · ${d.name}`,
    sub: d.years ? `${d.years} yr${d.years > 1 ? "s" : ""}` : undefined,
    icon: <GraduationCap size={15} />,
  }));

  const pickDegree = (id: string) => {
    const d = discovered.find((x) => x.id === id) ?? null;
    setDegree(d);
    if (d) setStep(2);
  };

  return (
    /* ── Full-screen onboarding wizard ── */
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", background: "#fff" }}>

      {/* ══ LEFT: brand panel ══ */}
      <aside
        className="onb-aside"
        style={{
          width: "38%", maxWidth: 430, flexShrink: 0,
          background: "linear-gradient(160deg, #0f172a 0%, #172554 55%, #1e3a8a 130%)",
          color: "#fff",
          padding: "32px 36px",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
        }}
      >
        <div>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38, height: 38, borderRadius: "var(--r)", flexShrink: 0,
                background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.18)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <GraduationCap size={18} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: ".01em" }}>UniMate</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.55)" }}>Uva Wellassa University</div>
            </div>
          </div>

          {/* Pitch */}
          <h2 style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.25, margin: "48px 0 12px" }}>
            Track every semester.
            <br />
            Know where you stand.
          </h2>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,.65)", margin: "0 0 28px" }}>
            Your GPA, computed the way Uva Wellassa University counts it — semester by semester,
            right up to where you are now.
          </p>

          {/* Features */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {FEATURES.map((f) => (
              <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: "rgba(255,255,255,.10)", color: "#93c5fd",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {f.icon}
                </div>
                <span style={{ fontSize: 12.5, color: "rgba(255,255,255,.85)" }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 10.5, letterSpacing: ".14em", color: "rgba(255,255,255,.4)", marginTop: 40 }}>
          UVA WELLASSA UNIVERSITY · PRECISION IN ACADEMIC EXCELLENCE
        </div>
      </aside>

      {/* ══ RIGHT: wizard ══ */}
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>

        {/* Top bar — step counter */}
        <div className="onb-pad" style={{ padding: "16px 32px", display: "flex", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ width: "100%", maxWidth: 560, display: "flex", justifyContent: "flex-end" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gray-500)" }}>
              Step {step} of 2 · {STEPS[stepIndex]}
            </span>
          </div>
        </div>

        {/* Stepper */}
        <div
          className="onb-pad"
          style={{
            display: "flex", justifyContent: "center",
            padding: "16px 32px 20px",
            borderBottom: "1px solid var(--gray-100)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", width: "100%", maxWidth: 560 }}>
            {STEPS.map((label, i) => (
              <Fragment key={label}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 80 }}>
                  <div
                    style={{
                      width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 700,
                      background: i < stepIndex ? "var(--green)"
                                  : i === stepIndex ? "var(--blue)"
                                  : "#fff",
                      color: i <= stepIndex ? "#fff" : "var(--gray-400)",
                      border: i === stepIndex ? "3px solid var(--blue-border)"
                             : i < stepIndex ? "none"
                             : "1.5px solid var(--gray-300)",
                      boxShadow: i === stepIndex ? "0 4px 12px rgba(37,99,235,.35)" : "none",
                      transition: "background .2s, border-color .2s",
                    }}
                  >
                    {i < stepIndex ? <Check size={14} strokeWidth={3} /> : i + 1}
                  </div>
                  <span
                    style={{
                      fontSize: 11.5, fontWeight: 600, marginTop: 8, whiteSpace: "nowrap",
                      color: i === stepIndex ? "var(--gray-900)"
                           : i < stepIndex ? "var(--green)"
                           : "var(--gray-400)",
                    }}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    style={{
                      flex: 1, height: 2, borderRadius: 2, marginTop: 16,
                      background: i < stepIndex ? "var(--green)" : "var(--gray-200)",
                      transition: "background .2s",
                    }}
                  />
                )}
              </Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div
          className="onb-pad"
          style={{
            flex: 1, minHeight: 0, overflowY: "auto",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "40px 32px 48px",
          }}
        >
          <div style={{ width: "100%", maxWidth: 560, animation: "fadeUp .25s ease-out both" }} key={step}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--gray-900)", margin: "0 0 8px" }}>
              {meta.title}
            </h1>
            <p style={{ fontSize: 13, color: "var(--gray-500)", margin: "0 0 24px" }}>{meta.subtitle}</p>

            {step === 1 && (
              <>
                <SearchSelect
                  options={degreeOptions}
                  onChange={pickDegree}
                  placeholder="Select or search your UWU degree…"
                  loading={degreesQuery.isFetching}
                />
                {!degreesQuery.isFetching && discovered.length === 0 && (
                  <p style={{ fontSize: 12, color: "var(--red)", marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <Loader2 size={13} /> Couldn't load the UWU degree list — check your connection, or set up manually below.
                  </p>
                )}
              </>
            )}

            {step === 2 && (
              <>
                {/* Semester roadmap — one row per year, tap a semester to select */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[1, 2, 3, 4].map((year) => (
                    <div
                      key={year}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "60px 1fr 1fr",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11, fontWeight: 700,
                          color: "var(--gray-400)", textTransform: "uppercase",
                          letterSpacing: ".08em", whiteSpace: "nowrap",
                        }}
                      >
                        Year {year}
                      </span>
                      {semesterOptions(4).filter((s) => Math.floor(s) === year).map((s) => {
                        const isSel = s === maxSemester;
                        return (
                          <button
                            key={s}
                            type="button"
                            className="onb-sem-tile"
                            onClick={() => setMaxSemester(s)}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "14px 16px", borderRadius: 10,
                              cursor: "pointer", fontFamily: "inherit",
                              border: `1.5px solid ${isSel ? "var(--blue)" : "var(--gray-200)"}`,
                              background: isSel ? "var(--blue)" : "#fff",
                              color: isSel ? "#fff" : "var(--gray-900)",
                              boxShadow: isSel ? "0 6px 16px rgba(37,99,235,.28)" : "none",
                            }}
                          >
                            <span style={{ fontSize: 14, fontWeight: 700 }}>{formatSemester(s)}</span>
                            {isSel && <Check size={15} strokeWidth={3} />}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Live summary of what the user will see */}
                <p
                  style={{
                    fontSize: 12.5, fontWeight: 600, color: "var(--blue)",
                    textAlign: "center", margin: "20px 0 0",
                  }}
                >
                  You'll track subjects up to {formatSemester(maxSemester)}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Footer nav */}
        <div
          className="onb-pad"
          style={{
            flexShrink: 0,
            borderTop: "1px solid var(--gray-200)", background: "var(--gray-50)",
            padding: "16px 32px",
            display: "flex", justifyContent: "center",
          }}
        >
          <div style={{ width: "100%", maxWidth: 560, display: "flex", alignItems: "center", gap: 10 }}>
          {step > 1 && (
            <Button variant="secondary" onClick={() => setStep(step - 1)}>Back</Button>
          )}
          <div style={{ flex: 1 }} />

          {step === 1 && (
            <>
              <Button variant="outline" onClick={() => onComplete({ degree: null, maxSemester: null })}>
                Set up manually
              </Button>
              <Button variant="primary" onClick={() => { if (degree) setStep(2); }} disabled={!degree}>
                Continue <ChevronRight size={15} />
              </Button>
            </>
          )}

          {step === 2 && (
            <Button variant="primary" onClick={() => onComplete({ degree, maxSemester })}>
              <CalendarDays size={14} /> Start Tracking
            </Button>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}
