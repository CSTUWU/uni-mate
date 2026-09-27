import { Link } from "react-router-dom";
import CustomSelect from "../UI/CustomSelect";
import type { SelectOption } from "../UI/CustomSelect";
import { RefreshCw, RotateCcw, GraduationCap } from "lucide-react";
import type { TsvSyncState, DegreeProgram } from "../../types/gpa";
import Button from "../UI/Button";

interface NavbarProps {
  tsvState: TsvSyncState;
  onOpenSyncModal: () => void;
  onSelectDegreeProgram: (d: DegreeProgram) => void;
  onResetAll: () => void;
  onNavigateHome?: () => void;
}

export default function Navbar({ tsvState, onOpenSyncModal, onSelectDegreeProgram, onResetAll, onNavigateHome }: NavbarProps) {
  const subjectLabel = `${tsvState.courseCount} subject${tsvState.courseCount === 1 ? "" : "s"}`;
  const degreeOptions: SelectOption[] = (tsvState.availableDegrees || []).map((d) => {
    const isActive = d.id === tsvState.activeDegree?.id;
    return {
      value: d.id,
      label: `${d.code} · ${d.name}`,
      sub: isActive
        ? subjectLabel
        : `${d.code}${d.years ? ` · ${d.years} yr${d.years > 1 ? "s" : ""}` : ""}`,
    };
  });
  /* Always show the currently loaded sheet (even custom TSV URLs) so its live subject count is visible */
  const active = tsvState.activeDegree;
  if (active && !degreeOptions.some((o) => o.value === active.id)) {
    degreeOptions.unshift({ value: active.id, label: `${active.code} · ${active.name}`, sub: subjectLabel });
  }

  return (
    <header className="app-header" style={{ paddingLeft: 16 }}>
      {/* Mobile brand logo (visible on mobile where left-nav is hidden) */}
      <Link
        to="/"
        onClick={onNavigateHome}
        className="mobile-header-logo"
        aria-label="UniMate Home"
      >
        <div
          style={{
            width: 28, height: 28, borderRadius: "var(--r)",
            background: "var(--blue-bg)", border: "1px solid var(--blue-border)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <GraduationCap size={15} color="var(--blue)" strokeWidth={2.5} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--gray-900)" }}>UniMate</span>
      </Link>

      {/* Degree selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
        <span style={{ fontSize: 12, color: "var(--gray-400)", flexShrink: 0 }}>Programme</span>
        {degreeOptions.length > 0 && (
          <CustomSelect
            id="header-degree"
            options={degreeOptions}
            value={tsvState.activeDegree?.id || ""}
            onChange={(val) => {
              const d = tsvState.availableDegrees?.find((x) => x.id === val);
              if (d) onSelectDegreeProgram(d);
            }}
            triggerStyle={{ minWidth: 200, maxWidth: 260, fontSize: 13, fontWeight: 600 }}
          />
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Live status pill */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 6, padding: "4px 12px",
          borderRadius: 99, fontSize: 12, fontWeight: 500, flexShrink: 0,
          background: tsvState.isLoading ? "var(--blue-bg)" : "var(--green-bg)",
          color: tsvState.isLoading ? "var(--blue)" : "var(--green)",
          border: `1px solid ${tsvState.isLoading ? "var(--blue-border)" : "var(--green-border)"}`,
        }}
      >
        {tsvState.isLoading
          ? <RefreshCw size={11} className="animate-spin" />
          : <span style={{ position: "relative", display: "inline-flex", width: 7, height: 7 }}>
              <span className="animate-ping" style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--green)", opacity: 0.5 }} />
              <span style={{ position: "relative", width: 7, height: 7, borderRadius: "50%", background: "var(--green)", display: "block" }} />
            </span>}
        {tsvState.isLoading ? "Syncing…" : `${tsvState.courseCount} subjects`}
      </div>

      {/* Sync button */}
      <Button variant="outline" size="sm" onClick={onOpenSyncModal}>
        <RefreshCw size={12} className={tsvState.isLoading ? "animate-spin" : ""} /> Sync Subjects
      </Button>

      {/* Reset */}
      <Button variant="danger-outline" size="sm" onClick={onResetAll} style={{ marginRight: 4 }} title="Reset all grades">
        <RotateCcw size={12} /> Reset
      </Button>
    </header>
  );
}
