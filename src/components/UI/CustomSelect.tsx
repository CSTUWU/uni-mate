import { useState, useRef, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  sub?: string;        // small secondary text
  dot?: string;        // CSS color for dot indicator
  badge?: string;      // CSS class for badge pill
  badgeLabel?: string; // label inside the badge
  icon?: ReactNode;    // leading icon
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Extra inline style on the trigger */
  triggerStyle?: React.CSSProperties;
  /** Where to render the dropdown: auto | up */
  placement?: "auto" | "up";
  id?: string;
}

interface DropPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function CustomSelect({
  options, value, onChange, placeholder = "Select…",
  triggerStyle, placement = "auto", id,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [pos, setPos] = useState<DropPosition | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  /* Measure the trigger and decide up vs down */
  const measure = useCallback(() => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const up = placement === "up" || window.innerHeight - rect.bottom < 220;
    setDropUp(up);
    setPos({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
  }, [placement]);

  /* Keep the portal dropdown anchored while scrolling / resizing */
  useEffect(() => {
    if (!open) return;
    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [open, measure]);

  /* Close on outside click (portal dropdown lives outside the wrapper) */
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || dropRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  /* Keyboard nav */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); return; }
    if (!open && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
      e.preventDefault(); measure(); setOpen(true); return;
    }
    if (open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      const idx = options.findIndex((o) => o.value === value);
      const next = e.key === "ArrowDown" ? Math.min(idx + 1, options.length - 1) : Math.max(idx - 1, 0);
      onChange(options[next].value);
    }
    if (open && e.key === "Enter") { setOpen(false); }
  };

  const selected = options.find((o) => o.value === value);

  return (
    <div className="csel-wrap" ref={wrapRef} style={{ position: "relative" }}>
      {/* Trigger */}
      <button
        id={id}
        type="button"
        className={`csel-trigger${open ? " open" : ""}`}
        style={triggerStyle}
        onClick={() => { if (!open) measure(); setOpen((o) => !o); }}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={selected?.label || placeholder}
      >
        {/* Dot indicator */}
        {selected?.dot && (
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: selected.dot, flexShrink: 0, display: "inline-block" }} />
        )}

        {/* Badge */}
        {selected?.badge && (
          <span className={selected.badge} style={{ fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 99 }}>
            {selected.badgeLabel || selected.label}
          </span>
        )}

        {/* Label */}
        {!selected?.badge && (
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "inherit" }}>
            {selected ? selected.label : <span style={{ color: "var(--gray-300)" }}>{placeholder}</span>}
          </span>
        )}

        {selected?.sub && !selected?.badge && (
          <span style={{ fontSize: 11, color: "var(--gray-400)", flexShrink: 0 }}>{selected.sub}</span>
        )}

        <ChevronDown size={13} className={`csel-chevron${open ? " open" : ""}`} />
      </button>

      {/* Dropdown - portalled to body so it never gets clipped by scroll containers */}
      {open && pos && createPortal(
        <div
          ref={dropRef}
          className="csel-dropdown"
          role="listbox"
          aria-label="Options"
          style={{
            position: "fixed",
            top: dropUp ? pos.top - 4 : pos.top,
            left: pos.left,
            width: pos.width,
            transform: dropUp ? "translateY(-100%)" : `translateY(${pos.height + 4}px)`,
          }}
        >
          {options.map((opt) => {
            const isSel = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSel}
                className={`csel-option${isSel ? " sel" : ""}`}
                onClick={() => { onChange(opt.value); setOpen(false); }}
              >
                {opt.icon && (
                  <span style={{ flexShrink: 0, color: "var(--gray-400)", display: "inline-flex" }}>{opt.icon}</span>
                )}
                {opt.dot && (
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: opt.dot, flexShrink: 0 }} />
                )}
                {opt.badge ? (
                  <span className={opt.badge} style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99 }}>
                    {opt.badgeLabel || opt.label}
                  </span>
                ) : (
                  <span style={{ flex: 1 }}>{opt.label}</span>
                )}
                {opt.sub && !opt.badge && (
                  <span style={{ fontSize: 11, color: isSel ? "var(--blue)" : "var(--gray-400)", marginLeft: "auto" }}>{opt.sub}</span>
                )}
                {isSel && !opt.badge && (
                  <Check size={13} style={{ flexShrink: 0, marginLeft: 4 }} />
                )}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}
