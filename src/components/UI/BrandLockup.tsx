import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

interface BrandLockupProps {
  /** md = sidebar / header / auth, lg = onboarding hero */
  size?: "md" | "lg";
  /** light = white surfaces, dark = the wizard's dark panel */
  surface?: "light" | "dark";
  showSub?: boolean;
  /** render as a home link; otherwise a plain group */
  link?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function BrandLockup({
  size = "md",
  surface = "light",
  showSub = true,
  link = false,
  onClick,
  className = "",
}: BrandLockupProps) {
  const cls = [
    "brand",
    size === "lg" ? "brand-lg" : "",
    surface === "dark" ? "brand-dark" : "",
    className,
  ].filter(Boolean).join(" ");

  const inner = (
    <>
      <span className="brand-mark">
        <GraduationCap size={size === "lg" ? 20 : 16} strokeWidth={2.5} />
      </span>
      <span className="brand-text">
        <span className="brand-name">UniMate</span>
        {showSub && <span className="brand-sub">Uva Wellassa University</span>}
      </span>
    </>
  );

  return link
    ? <Link to="/" onClick={onClick} className={cls} aria-label="UniMate Home">{inner}</Link>
    : <span className={cls} role="img" aria-label="UniMate, Uva Wellassa University">{inner}</span>;
}
