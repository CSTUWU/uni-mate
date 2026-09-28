import { useState } from "react";
import {
  Award, BookOpen, CheckCircle2, TrendingUp, Target, Download,
  AlertTriangle, CheckCircle,
} from "lucide-react";
import type { GpaStats } from "../../types/gpa";
import { calculateTargetRequiredGpa, getGpaStatusColor, getGpaStatusClass } from "../../utils/gpaCalculator";
import Collapsible from "../UI/Collapsible";
import Button from "../UI/Button";

interface Props {
  stats: GpaStats;
  isPriorEnabled: boolean;
  priorCgpa: number;
  priorCredits: number;
  combinedCgpa: number;
  combinedEarned: number;
  onExportData: () => void;
}

export default function GpaDashboard({
  stats, isPriorEnabled, priorCgpa, priorCredits, combinedCgpa, combinedEarned, onExportData,
}: Props) {
  const [targetOpen, setTargetOpen]   = useState(true);
  const [targetGpa,  setTargetGpa]    = useState(3.7);
  const [remCredits, setRemCredits]   = useState(30);

  const displayCgpa   = isPriorEnabled ? combinedCgpa : stats.cgpa;
  const displayEarned = isPriorEnabled ? combinedEarned : stats.earnedCredits;
  const displayTotal  = stats.totalCredits + (isPriorEnabled ? priorCredits : 0);
  const totalQp       = isPriorEnabled
    ? priorCgpa * priorCredits + stats.cgpa * stats.earnedCredits
    : stats.cgpa * stats.earnedCredits;

  const gpaColor = getGpaStatusColor(displayCgpa);
  const gpaBadge = getGpaStatusClass(displayCgpa);

  /* Hero card border/bg by performance */
  const heroBg =
    displayCgpa >= 3.5 ? "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)" :
    displayCgpa >= 3.0 ? "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)" :
    displayCgpa >= 2.0 ? "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)" :
    "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)";

  /* Target */
  const req         = calculateTargetRequiredGpa(displayCgpa, displayEarned, targetGpa, remCredits);
  const impossible  = req !== null && req > 4;
  const challenging = req !== null && req > 3.7 && req <= 4;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ── Hero Card ── */}
      <div
        style={{
          borderRadius: "var(--r-lg)", border: `1px solid ${gpaColor}30`,
          background: heroBg, padding: "24px 20px",
          textAlign: "center", boxShadow: `0 4px 20px ${gpaColor}18`,
        }}
      >
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: gpaColor, marginBottom: 6 }}>
          {isPriorEnabled ? "Combined Cumulative GPA" : "Your Cumulative GPA"}
        </p>

        {/* Giant GPA number */}
        <div
          style={{ fontSize: 64, fontWeight: 800, color: gpaColor, lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "-2px" }}
          aria-live="polite"
          aria-label={`Cumulative GPA ${displayCgpa.toFixed(2)}`}
        >
          {displayCgpa.toFixed(2)}
        </div>
        <div style={{ fontSize: 13, color: "var(--gray-400)", margin: "4px 0 14px" }}>out of 4.00</div>

        {/* Honours badge */}
        <span
          className={gpaBadge}
          style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700 }}
        >
          <Award size={12} /> {stats.honorsClassification}
        </span>
      </div>

      {/* ── Metrics ── */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--gray-200)", background: "var(--gray-50)" }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gray-400)" }}>
            Breakdown
          </span>
        </div>
        <div style={{ padding: "4px 0" }}>
          {[
            { icon: <TrendingUp size={14} style={{ color: "var(--blue)" }} />,   label: "Semester GPA",     val: stats.earnedCredits > 0 ? stats.cgpa.toFixed(2) : "-" },
            { icon: <BookOpen size={14} style={{ color: "var(--green)" }} />,    label: "Credits Earned",   val: `${displayEarned} / ${displayTotal}` },
            { icon: <CheckCircle2 size={14} style={{ color: "var(--amber)" }} />, label: "Subjects Graded",  val: `${stats.gradedCoursesCount} / ${stats.totalCoursesCount}` },
            { icon: <Target size={14} style={{ color: "var(--red)" }} />,        label: "Quality Points",   val: totalQp.toFixed(1) },
          ].map(({ icon, label, val }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", borderBottom: "1px solid var(--gray-200)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--gray-500)" }}>
                {icon} {label}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--gray-900)", fontVariantNumeric: "tabular-nums" }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Target GPA Planner ── */}
      <div className="card" style={{ overflow: "hidden" }}>
        <Collapsible
          open={targetOpen}
          onToggle={() => setTargetOpen((o) => !o)}
          chevronSize={15}
          headerStyle={{ justifyContent: "space-between", background: "var(--gray-50)" }}
          header={
            <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: "var(--gray-900)" }}>
              <Target size={14} style={{ color: "var(--blue)" }} /> Target GPA Planner
            </span>
          }
        >
          <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <label htmlFor="rhs-target" style={{ fontSize: 12, color: "var(--gray-500)" }}>What is your target GPA?</label>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--blue)" }}>{targetGpa.toFixed(2)}</span>
              </div>
              <input id="rhs-target" type="range" min="2" max="4" step="0.05" value={targetGpa}
                onChange={(e) => setTargetGpa(parseFloat(e.target.value))}
                style={{ width: "100%", marginBottom: 2 }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--gray-400)" }}>
                <span>2.0</span><span>3.0</span><span>3.3</span><span>3.7</span><span>4.0</span>
              </div>
            </div>

            <div>
              <label htmlFor="rhs-rem" style={{ display: "block", fontSize: 12, color: "var(--gray-500)", marginBottom: 4 }}>
                Remaining credits to complete
              </label>
              <input id="rhs-rem" type="number" min="1" max="200" value={remCredits}
                onChange={(e) => setRemCredits(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="inp" style={{ width: "100%", fontSize: 13 }} />
            </div>

            {req !== null && (
              <div
                className={impossible ? "b-red" : challenging ? "b-amber" : "b-green"}
                style={{ padding: "10px 12px", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "flex-start", gap: 7 }}
              >
                {impossible ? <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> : <CheckCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />}
                <span>
                  You need a{" "}
                  <strong style={{ fontSize: 15 }}>
                    {req > 4 ? "> 4.00" : req < 0 ? "0.00" : req.toFixed(2)}
                  </strong>{" "}
                  average over your next{" "}
                  <strong>{remCredits}</strong> credits
                  {impossible ? " - unattainable without exceeding 4.0 maximum." : "."}
                </span>
              </div>
            )}
          </div>
        </Collapsible>
      </div>

      {/* ── Actions ── */}
      <Button variant="outline" fullWidth onClick={onExportData} style={{ padding: "9px 0" }}>
        <Download size={14} /> Export CSV Summary
      </Button>
    </div>
  );
}
