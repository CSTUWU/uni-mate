import { Fragment, useState } from "react";
import type { DegreeProgram } from "../../types/gpa";
import { DEFAULT_GOOGLE_SHEET_TSV_URL } from "../../utils/tsvParser";
import { useDegreePrograms } from "../../hooks/useGpaData";
import { formatSemester } from "../../utils/semesterUtils";
import { GraduationCap, School, CalendarDays, Check, Loader2, BarChart3, ChevronRight } from "lucide-react";
import BrandLockup from "../UI/BrandLockup";
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

const STEPS = [
  {
    label: "Degree",
    title: "Select your degree programme",
    subtitle: "Pick the Uva Wellassa University programme you're enrolled in.",
  },
  {
    label: "Semester",
    title: "Where are you in your degree?",
    subtitle: "You'll only see semesters up to this point - no clutter from later years.",
  },
];

const YEARS = [1, 2, 3, 4];

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
  const meta = STEPS[stepIndex];

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
    <div className="onb-root">

      {/* ══ LEFT: brand panel ══ */}
      <aside className="onb-aside">
        <div>
          {/* Brand */}
          <BrandLockup size="lg" surface="dark" />

          {/* Pitch */}
          <h2 className="onb-pitch">
            Track every semester.
            <br />
            Know where you stand.
          </h2>
          <p className="onb-pitch-body">
            Your GPA, computed the way Uva Wellassa University counts it - semester by semester,
            right up to where you are now.
          </p>

          {/* Features */}
          <div className="onb-features">
            {FEATURES.map((f) => (
              <div key={f.text} className="onb-feature">
                <span className="onb-feature-icon">{f.icon}</span>
                <span className="onb-feature-text">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ══ RIGHT: wizard ══ */}
      <main className="onb-main">

        {/* Stepper */}
        <div className="onb-stepbar onb-pad">
          <div className="onb-stepbar-track">
            {STEPS.map((s, i) => {
              const isDone = i < stepIndex;
              const isCurrent = i === stepIndex;
              return (
                <Fragment key={s.label}>
                  <div className="onb-step">
                    <div
                      className="onb-step-dot"
                      style={{
                        background: isDone ? "var(--green)" : isCurrent ? "var(--blue)" : "transparent",
                        color: isDone || isCurrent ? "#fff" : "var(--gray-400)",
                        border: `1.5px solid ${isDone ? "var(--green)" : isCurrent ? "var(--blue)" : "var(--gray-300)"}`,
                      }}
                    >
                      {isDone ? <Check size={12} strokeWidth={3} /> : i + 1}
                    </div>
                    <span
                      className="onb-step-label"
                      style={{ color: isCurrent ? "var(--gray-900)" : isDone ? "var(--green)" : "var(--gray-400)" }}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className="onb-step-line"
                      style={{ background: isDone ? "var(--green)" : "var(--gray-200)" }}
                    />
                  )}
                </Fragment>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="onb-content onb-pad">
          <div className="onb-content-inner" key={step}>
            <h1 className="onb-title">{meta.title}</h1>
            <p className="onb-subtitle">{meta.subtitle}</p>

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
                    <Loader2 size={13} /> Couldn't load the UWU degree list - check your connection, or set up manually below.
                  </p>
                )}
              </>
            )}

            {step === 2 && (
              <>
                {/* Semester roadmap - one row per year, tap a semester to select */}
                <div className="onb-years">
                  {YEARS.map((year) => (
                    <div key={year}>
                      <div className="onb-year-label">Year {year}</div>
                      <div className="onb-year-tiles">
                        {[1, 2].map((term) => {
                          const s = year + term / 10;
                          const isSel = s === maxSemester;
                          return (
                            <button
                              key={s}
                              type="button"
                              className="onb-sem-tile"
                              onClick={() => setMaxSemester(s)}
                              style={{
                                border: `1.5px solid ${isSel ? "var(--blue)" : "var(--gray-200)"}`,
                                background: isSel ? "var(--blue-bg)" : "#fff",
                                color: isSel ? "var(--blue)" : "var(--gray-900)",
                              }}
                            >
                              <span className="onb-sem-label">Sem {term}</span>
                              {isSel && <Check size={15} strokeWidth={3} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live summary of what the user will see */}
                <p className="onb-summary">
                  You'll track subjects up to {formatSemester(maxSemester)}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Footer nav */}
        <div className="onb-footer onb-pad">
          <div className="onb-footer-inner">
          {step > 1 && (
            <Button variant="secondary" onClick={() => setStep(step - 1)}>Back</Button>
          )}
          <div className="onb-footer-spacer" />

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
