import { useState, useRef } from "react";
import { Plus, Trash2, Award, ChevronDown, ChevronUp } from "lucide-react";
import type { Course } from "../../types/gpa";
import { GRADE_OPTIONS, calculateSemesterSummary, getGpaStatusColor, getGradeStatusClass } from "../../utils/gpaCalculator";
import { formatSemester, formatSemesterShort } from "../../utils/semesterUtils";
import CustomSelect from "../UI/CustomSelect";
import type { SelectOption } from "../UI/CustomSelect";
import Button from "../UI/Button";

interface SemesterCardProps {
  semesterNumber: number;
  courses: Course[];
  onUpdateGrade: (id: string, grade: string) => void;
  onUpdateCourseName: (id: string, name: string) => void;
  onUpdateCredits: (id: string, credits: number) => void;
  onDeleteCourse: (id: string) => void;
  onEditCourse: (course: Course) => void;
  onOpenAddCourseModal: (sem?: number) => void;
  onQuickSetSemesterGrades: (sem: number, grade: string) => void;
}

/* Build grade options for CustomSelect */
const GRADE_SELECT_OPTIONS: SelectOption[] = [
  { value: "Pending", label: "- Select -", badge: "b-gray", badgeLabel: "-" },
  ...GRADE_OPTIONS.map((g) => ({
    value: g.letter,
    label: g.letter,
    sub: `${g.points.toFixed(1)} pts`,
    badge: getGradeStatusClass(g.points),
    badgeLabel: g.letter,
  })),
];

export default function SemesterCard({
  semesterNumber, courses, onUpdateGrade, onUpdateCourseName, onUpdateCredits,
  onDeleteCourse, onOpenAddCourseModal, onQuickSetSemesterGrades,
}: SemesterCardProps) {
  const [expanded, setExpanded] = useState(true);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const summary   = calculateSemesterSummary(courses, semesterNumber);
  const gpaColor  = summary.earnedCredits > 0 ? getGpaStatusColor(summary.gpa) : "var(--gray-300)";

  return (
    <div className="card" style={{ marginBottom: 14, overflow: "visible" }}>
      {/* ── Header ── */}
      <div
        style={{
          padding: "11px 14px",
          display: "flex", alignItems: "center", gap: 10,
          borderBottom: expanded ? "1px solid var(--gray-200)" : "none",
        }}
      >
        <div
          style={{
            width: 28, height: 28, borderRadius: "var(--r)", background: "var(--blue-bg)",
            border: "1px solid var(--blue-border)", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--blue)", flexShrink: 0,
          }}
        >
          {formatSemesterShort(semesterNumber)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-900)" }}>{formatSemester(semesterNumber)}</div>
          <div style={{ fontSize: 11, color: "var(--gray-400)" }}>{summary.coursesCount} subjects · {summary.totalCredits} credits</div>
        </div>

        {/* GPA badge */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: "var(--gray-400)", letterSpacing: "0.04em", textTransform: "uppercase" }}>Sem GPA</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Award size={12} style={{ color: gpaColor }} />
            <span style={{ fontSize: 17, fontWeight: 700, color: gpaColor, fontVariantNumeric: "tabular-nums" }}>
              {summary.earnedCredits > 0 ? summary.gpa.toFixed(2) : "-"}
            </span>
          </div>
        </div>

        <Button variant="soft" size="xs" onClick={() => onOpenAddCourseModal(semesterNumber)} style={{ padding: "4px 10px" }}>
          <Plus size={12} /> Add
        </Button>

        <button
          onClick={() => setExpanded((v) => !v)}
          style={{ padding: 4, border: "none", background: "none", cursor: "pointer", color: "var(--gray-400)", flexShrink: 0 }}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* ── Rows ── */}
      {expanded && (
        <>
          {courses.length === 0 ? (
            <div style={{ padding: "24px 14px", textAlign: "center", color: "var(--gray-400)", fontSize: 13 }}>
              No subjects yet -{" "}
              <button
                onClick={() => onOpenAddCourseModal(semesterNumber)}
                style={{ color: "var(--blue)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}
              >
                add one
              </button>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              {/* Column headers */}
              <div
                style={{
                  display: "grid", gridTemplateColumns: "1fr 120px 80px 34px",
                  padding: "5px 14px", background: "var(--gray-50)",
                  borderBottom: "1px solid var(--gray-200)", gap: 8,
                }}
              >
                {["Subject Name", "Grade", "Credits", ""].map((h) => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--gray-400)" }}>{h}</div>
                ))}
              </div>

              {/* Course rows */}
              {courses.map((course, idx) => (
                <div
                  key={course.id}
                  style={{
                    display: "grid", gridTemplateColumns: "1fr 120px 80px 34px",
                    padding: "6px 14px", gap: 8,
                    borderBottom: idx < courses.length - 1 ? "1px solid var(--gray-100)" : "none",
                    alignItems: "center",
                    transition: "background .1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gray-50)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Name */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                    <input
                      className="inp"
                      value={course.name}
                      onChange={(e) => onUpdateCourseName(course.id, e.target.value)}
                      placeholder="e.g. Organic Chemistry"
                      style={{ fontSize: 13, flex: 1 }}
                      aria-label={`Subject name row ${idx + 1}`}
                    />
                    {course.credits === 0 && (
                      <span
                        className="badge-neutral"
                        style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "2px 6px", borderRadius: 99, flexShrink: 0 }}
                      >
                        Non-GPA
                      </span>
                    )}
                  </div>

                  {/* Grade custom dropdown */}
                  <CustomSelect
                    id={`grade-${course.id}`}
                    options={GRADE_SELECT_OPTIONS}
                    value={course.grade || "Pending"}
                    onChange={(val) => onUpdateGrade(course.id, val)}
                    triggerStyle={{ fontSize: 12, fontWeight: 700 }}
                    placement="auto"
                  />

                  {/* Credits */}
                  <input
                    type="number"
                    className="inp"
                    value={course.credits}
                    min={0} max={12} step={1}
                    onChange={(e) => onUpdateCredits(course.id, Math.max(0, parseInt(e.target.value, 10) || 0))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && idx === courses.length - 1) {
                        e.preventDefault();
                        addBtnRef.current?.focus();
                      }
                    }}
                    style={{ fontSize: 13, textAlign: "center" }}
                    aria-label={`Credits for ${course.name}`}
                  />

                  {/* Delete */}
                  <Button
                    variant="icon-danger"
                    size="xs"
                    className="btn-icon"
                    onClick={() => onDeleteCourse(course.id)}
                    aria-label={`Remove ${course.name}`}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* ── Card footer ── */}
          <div
            style={{
              padding: "9px 14px", borderTop: "1px solid var(--gray-200)",
              display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6,
              background: "var(--gray-50)",
            }}
          >
            <Button
              ref={addBtnRef}
              variant="dashed"
              size="sm"
              onClick={() => onOpenAddCourseModal(semesterNumber)}
            >
              <Plus size={12} /> Add Course
            </Button>

            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 10, color: "var(--gray-400)" }}>Quick-fill:</span>
              {["A+", "A", "A-", "B+", "B"].map((g) => (
                <Button
                  key={g}
                  variant="outline-blue"
                  size="xs"
                  onClick={() => onQuickSetSemesterGrades(semesterNumber, g)}
                >
                  {g}
                </Button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
