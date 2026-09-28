import { Award, TrendingUp, BookOpen, CheckCircle2 } from "lucide-react";
import type { Course, GpaStats } from "../../types/gpa";
import { GRADE_OPTIONS, calculateSemesterSummary, getGpaStatusColor, getGradeStatusColor } from "../../utils/gpaCalculator";
import { formatSemester, formatSemesterShort, getSemesters } from "../../utils/semesterUtils";
import EmptyState from "../UI/EmptyState";

interface AnalyticsViewProps {
  courses: Course[];
  stats: GpaStats;
}

function StatChip({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--gray-200)", borderRadius: "var(--r-lg)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--shadow-card)" }}>
      <div style={{ width: 8, height: 36, borderRadius: "var(--r-xs)", background: color, flexShrink: 0 }} />
      <div>
        <p style={{ fontSize: 11, color: "var(--gray-400)", marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 22, fontWeight: 700, color: "var(--gray-900)", fontVariantNumeric: "tabular-nums" }}>{value}</p>
      </div>
    </div>
  );
}

export default function AnalyticsView({ courses, stats }: AnalyticsViewProps) {
  /* Grade distribution */
  const counts: Record<string, number> = {};
  GRADE_OPTIONS.forEach((g) => { counts[g.letter] = 0; });
  courses.forEach((c) => { if (c.grade && counts[c.grade] !== undefined) counts[c.grade]++; });
  const maxCount = Math.max(...Object.values(counts), 1);
  const nonZero  = GRADE_OPTIONS.filter((g) => counts[g.letter] > 0);

  /* Semester trend */
  const sems   = getSemesters(courses);
  const trends = sems.map((s) => calculateSemesterSummary(courses, s));


  /* Top graded subjects */
  const graded = courses
    .filter((c) => c.grade && c.grade !== "Pending")
    .map((c) => ({ ...c, pts: GRADE_OPTIONS.find((g) => g.letter === c.grade)?.points ?? 0 }))
    .sort((a, b) => b.pts - a.pts)
    .slice(0, 8);

  /* Completion */
  const completion = stats.totalCoursesCount > 0
    ? Math.round((stats.gradedCoursesCount / stats.totalCoursesCount) * 100) : 0;

  return (
    <div style={{ maxWidth: "var(--max-w)", margin: "0 auto", padding: "24px 20px" }}>
      <h1 className="page-title">Analytics</h1>
      <p className="page-subtitle">Performance breakdown across all semesters</p>

      {/* ── KPI chips ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        <StatChip label="Cumulative GPA" value={stats.cgpa.toFixed(2)} color={getGpaStatusColor(stats.cgpa)} />
        <StatChip label="Total Credits"  value={stats.earnedCredits}   color="var(--blue)"  />
        <StatChip label="Graded Subjects" value={stats.gradedCoursesCount} color="var(--green)" />
        <StatChip label="Completion"     value={`${completion}%`}       color="var(--amber)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* ── Grade Distribution ── */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="card-head">
            <Award size={14} style={{ color: "var(--blue)" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-900)" }}>Grade Distribution</span>
          </div>
          <div style={{ padding: "16px" }}>
            {nonZero.length === 0
              ? <EmptyState text="No grades entered yet" />
              : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {nonZero.map((g) => {
                    const pct      = (counts[g.letter] / maxCount) * 100;
                    const barColor = getGradeStatusColor(g.points);
                    const ofTotal  = stats.gradedCoursesCount > 0
                      ? Math.round((counts[g.letter] / stats.gradedCoursesCount) * 100) : 0;
                    return (
                      <div key={g.letter}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gray-900)" }}>{g.letter}</span>
                          <span style={{ fontSize: 11, color: "var(--gray-400)" }}>{counts[g.letter]} subject{counts[g.letter] !== 1 ? "s" : ""} · {ofTotal}%</span>
                        </div>
                        <div style={{ height: 10, background: "var(--gray-100)", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 99, background: barColor, width: `${pct}%`, transition: "width 0.6s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
            }
          </div>
        </div>

        {/* ── Semester GPA Trend ── */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="card-head">
            <TrendingUp size={14} style={{ color: "var(--blue)" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-900)" }}>Semester GPA Trend</span>
          </div>
          <div style={{ padding: "16px" }}>
            {trends.length === 0
              ? <EmptyState text="No semester data yet" />
              : <>
                  {/* Bar chart */}
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100, marginBottom: 8 }}>
                    {trends.map((s) => {
                      const col = s.earnedCredits > 0 ? getGpaStatusColor(s.gpa) : "var(--gray-200)";
                      const h   = s.earnedCredits > 0 ? Math.max((s.gpa / 4) * 100, 6) : 8;
                      return (
                        <div key={s.semesterNumber} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: col }}>
                            {s.earnedCredits > 0 ? s.gpa.toFixed(2) : "-"}
                          </span>
                          <div style={{ width: "100%", height: `${h}%`, background: col, borderRadius: "4px 4px 0 0", transition: "height 0.5s ease", minHeight: 4 }} />
                        </div>
                      );
                    })}
                  </div>
                  {/* Sem labels */}
                  <div style={{ display: "flex", gap: 8 }}>
                    {trends.map((s) => (
                      <div key={s.semesterNumber} style={{ flex: 1, textAlign: "center", fontSize: 10, color: "var(--gray-400)" }}>
                        {formatSemesterShort(s.semesterNumber)}
                      </div>
                    ))}
                  </div>
                  {/* Trend note */}
                  <div style={{ marginTop: 12, padding: "8px 12px", background: "var(--gray-50)", borderRadius: 8, fontSize: 12, color: "var(--gray-500)" }}>
                    {trends.length >= 2 && (
                      <>
                        {trends[trends.length - 1].gpa > trends[0].gpa
                          ? "📈 GPA is trending upward across semesters."
                          : trends[trends.length - 1].gpa < trends[0].gpa
                          ? "📉 GPA has dipped since Semester 1."
                          : "➡️ GPA has remained consistent."}
                      </>
                    )}
                    {trends.length === 1 && "Add more semesters to see the trend."}
                  </div>
                </>
            }
          </div>
        </div>

        {/* ── Top Subjects ── */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="card-head">
            <CheckCircle2 size={14} style={{ color: "var(--green)" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-900)" }}>Top Performing Subjects</span>
          </div>
          <div>
            {graded.length === 0
              ? <EmptyState text="No grades entered yet" />
              : graded.map((c, i) => {
                  const col = getGradeStatusColor(c.pts);
                  return (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderBottom: i < graded.length - 1 ? "1px solid var(--gray-100)" : "none" }}>
                      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--gray-100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "var(--gray-400)", flexShrink: 0 }}>
                        {i + 1}
                      </span>
                      <span style={{ flex: 1, fontSize: 12, color: "var(--gray-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name || c.code}</span>
                      <span style={{ fontSize: 12, color: "var(--gray-400)" }}>{c.credits} cr</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: col, width: 24, textAlign: "center" }}>{c.grade}</span>
                    </div>
                  );
                })
            }
          </div>
        </div>

        {/* ── Credit Breakdown ── */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="card-head">
            <BookOpen size={14} style={{ color: "var(--amber)" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-900)" }}>Credit Breakdown by Semester</span>
          </div>
          <div style={{ padding: "16px" }}>
            {trends.length === 0
              ? <EmptyState text="No data yet" />
              : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {trends.map((s, i) => {
                    const pct = stats.totalCredits > 0 ? (s.totalCredits / stats.totalCredits) * 100 : 0;
                    return (
                      <div key={s.semesterNumber}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gray-900)" }}>{formatSemester(s.semesterNumber)}</span>
                          <span style={{ fontSize: 11, color: "var(--gray-400)" }}>{s.totalCredits} credits · {Math.round(pct)}%</span>
                        </div>
                        <div style={{ height: 8, background: "var(--gray-100)", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ height: "100%", background: "var(--blue)", borderRadius: 99, width: `${pct}%`, transition: "width 0.5s ease", opacity: 0.6 + ((i + 1) / sems.length) * 0.4 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
