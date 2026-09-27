import { Link } from "react-router-dom";
import { Calculator, BarChart2, BookOpen, Settings, GraduationCap } from "lucide-react";

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
  onChangeView: (view: NavView) => void;
}

export default function LeftNav({ activeView, onChangeView }: LeftNavProps) {
  return (
    <nav className="left-nav" aria-label="Main navigation">
      {/* Brand strip */}
      <Link
        to="/"
        onClick={() => onChangeView("calculator")}
        className="nav-brand-link"
        aria-label="UniMate Home"
        style={{
          display: "flex", alignItems: "center", gap: 9,
          padding: "8px 14px 16px", borderBottom: "1px solid var(--gray-200)", marginBottom: 8,
          textDecoration: "none", color: "inherit", cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 30, height: 30, borderRadius: "var(--r)",
            background: "var(--blue-bg)", border: "1px solid var(--blue-border)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <GraduationCap size={16} color="var(--blue)" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gray-900)", lineHeight: 1 }}>UniMate</div>
          <div style={{ fontSize: 10, color: "var(--blue)", fontWeight: 600, marginTop: 3 }}>Uva Wellassa University</div>
        </div>
      </Link>

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
