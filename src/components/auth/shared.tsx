import { Link } from "react-router-dom";
import { Calculator } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";

export const AUTH_TAGLINE = "Precision in Academic Excellence";

const inputClass =
  "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm " +
  "placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all";

/** UniMate logo + wordmark row */
export function BrandLogo({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <Link
      to="/"
      className={`flex items-center gap-2 font-heading font-extrabold text-primary hover:opacity-90 transition-opacity cursor-pointer ${className}`}
      aria-label="UniMate Home"
    >
      <div className="w-8 h-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
        <Calculator size={size} strokeWidth={2.5} />
      </div>
      <span>UniMate</span>
    </Link>
  );
}

/** Auth text input with optional leading icon */
export function AuthInput({ icon, ...rest }: { icon?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  if (icon) {
    return (
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          {icon}
        </span>
        <input {...rest} className={`${inputClass} pl-10`} />
      </div>
    );
  }
  return <input {...rest} className={inputClass} />;
}

/** Inline form error banner */
export function FormError({ message }: { message: string }) {
  return (
    <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs font-semibold text-center">
      {message}
    </div>
  );
}

/** Primary full-width submit button */
export function AuthSubmitButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="submit"
      className="w-full bg-primary text-white font-semibold text-sm py-3 px-4 rounded-lg hover:bg-primary-hover flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:shadow-lg transition-all duration-200 cursor-pointer mt-4"
    >
      {children}
    </button>
  );
}
