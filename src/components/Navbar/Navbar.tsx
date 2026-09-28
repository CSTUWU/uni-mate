import { RefreshCw, RotateCcw, Menu } from "lucide-react";
import type { TsvSyncState } from "../../types/gpa";
import BrandLockup from "../UI/BrandLockup";
import Button from "../UI/Button";

interface NavbarProps {
  tsvState: TsvSyncState;
  navOpen: boolean;
  onToggleNav: () => void;
  onResetAll: () => void;
  onNavigateHome?: () => void;
}

export default function Navbar({ tsvState, navOpen, onToggleNav, onResetAll, onNavigateHome }: NavbarProps) {
  return (
    <header className="app-header">
      {/* Hamburger - mobile only */}
      <button
        type="button"
        className="nav-toggle"
        onClick={onToggleNav}
        aria-expanded={navOpen}
        aria-controls="left-nav"
        aria-label={navOpen ? "Close menu" : "Open menu"}
      >
        <Menu size={17} strokeWidth={2} />
      </button>

      {/* Mobile brand (visible on mobile where the left-nav is a drawer) */}
      <BrandLockup link className="mobile-header-logo" onClick={onNavigateHome} />

      <div style={{ flex: 1 }} />

      {/* Live status pill */}
      <div
        className="header-status"
        style={{
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

      {/* Reset */}
      <Button variant="danger-outline" size="sm" onClick={onResetAll} style={{ marginRight: 4 }} title="Reset all grades">
        <RotateCcw size={12} /> Reset
      </Button>
    </header>
  );
}
