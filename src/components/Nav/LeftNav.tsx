import { Calculator, BarChart2, BookOpen, Settings } from "lucide-react";
import BrandLockup from "../UI/BrandLockup";
import ProgrammeSelect from "./ProgrammeSelect";
import type { TsvSyncState, DegreeProgram } from "../../types/gpa";

export type NavView = "calculator" | "analytics" | "grade-scale";

interface NavItem {
  id: NavView;
  icon: React.ElementType;
  label: string;
  section?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "calculator",  icon: Calculator, label: "GPA Calculator", section: "Main" },
  { id: "analytics",   icon: BarChart2,  label: "Analytics"                         },
  { id: "grade-scale", icon: BookOpen,   label: "Grade Scale",    section: "Reference" },
];

interface LeftNavProps {
  activeView: NavView;
  open: boolean;
  tsvState: TsvSyncState;
  onSelectDegreeProgram: (d: DegreeProgram) => void;
  onChangeView: (view: NavView) => void;
}

export default function LeftNav({ activeView, open, tsvState, onSelectDegreeProgram, onChangeView }: LeftNavProps) {
  return (
    <nav id="left-nav" className={`left-nav${open ? " open" : ""}`} aria-label="Main navigation">
      {/* Brand strip */}
      <BrandLockup link onClick={() => onChangeView("calculator")} className="nav-brand-link" />

      {/* Programme selector - lives in the nav so it works on desktop and in the mobile drawer */}
      <ProgrammeSelect tsvState={tsvState} onSelect={onSelectDegreeProgram} />

      {/* Nav items */}
      {NAV_ITEMS.map((item, idx) => {
        const showSection = item.section && NAV_ITEMS[idx - 1]?.section !== item.section;
        const isActive = activeView === item.id;
        const Icon = item.icon;

        return (
          <div key={item.id}>
            {showSection && (
              <p className="nav-section-label">{item.section}</p>
            )}
            <button
              className={`nav-item${isActive ? " active" : ""}`}
              onClick={() => onChangeView(item.id)}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={16} className="nav-icon" />
              <span>{item.label}</span>

              {isActive && (
                <span
                  style={{
                    marginLeft: "auto", width: 6, height: 6, borderRadius: "50%",
                    background: "var(--blue)", flexShrink: 0,
                  }}
                />
              )}
            </button>
          </div>
        );
      })}

      {/* Bottom: version note */}
      <div className="nav-bottom" style={{ padding: "12px 14px", borderTop: "1px solid var(--gray-200)", marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Settings size={13} style={{ color: "var(--gray-400)" }} />
          <span style={{ fontSize: 11, color: "var(--gray-400)" }}>v2.0</span>
        </div>
      </div>
    </nav>
  );
}
