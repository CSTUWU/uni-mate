import React, { useState } from "react";
import { User, Mail, Lock, GraduationCap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandLogo, FormError, AuthSubmitButton, AuthInput } from "./shared";

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setError("");
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword || !formData.agree) {
      setError("Please fill in all fields and agree to the terms.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setSubmitted(true);
  };

  const getPasswordStrength = (pw: string) => {
    if (!pw) return { score: 0, label: "None", color: "bg-slate-200", text: "text-slate-400" };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-rose-500", text: "text-rose-500" };
    if (score <= 3) return { score: 2, label: "Medium", color: "bg-amber-500", text: "text-amber-500" };
    return { score: 3, label: "Strong", color: "bg-emerald-500", text: "text-emerald-500" };
  };

  const strength = getPasswordStrength(formData.password);

  if (submitted) {
    return (
      <div className="w-full max-w-5xl bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-lg flex flex-col items-center justify-center min-h-[580px]">
        <div className="w-16 h-16 bg-primary-soft text-primary rounded-full flex items-center justify-center mb-6">
          <GraduationCap size={36} />
        </div>
        <h2 className="font-heading font-extrabold text-3xl text-slate-900 mb-3">Welcome to UniMate!</h2>
        <p className="text-slate-500 max-w-md mx-auto mb-8">
          Your account for <strong className="text-slate-800">{formData.fullName}</strong> ({formData.email}) has been simulated successfully.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="bg-primary text-white font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-primary-hover transition-colors duration-200 cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xl flex flex-col md:flex-row min-h-[580px]">
      <div className="w-full md:w-[45%] bg-slate-50/50 p-8 md:p-10 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-200/80">
        <div className="max-w-[340px] mx-auto w-full">
          <BrandLogo size={18} className="text-lg mb-8" />

          <h2 className="font-heading font-extrabold text-3xl text-slate-900 leading-[1.2] tracking-tight mb-4">
            Your academic journey, <br />
            <span className="text-primary">perfectly calculated.</span>
          </h2>

          <p className="text-slate-500 text-[14px] leading-relaxed">
            The dedicated academic performance tracker for Uva Wellassa University students. Track GPA, plan semesters, and verify honours classifications.
          </p>
        </div>
      </div>

      <div className="w-full md:w-[55%] p-8 md:p-12 flex flex-col justify-center bg-white">
        <div className="max-w-[400px] w-full mx-auto">
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-slate-900 tracking-tight mb-2">
            Create Your Account
          </h1>
          <p className="text-slate-400 text-sm mb-8">
            Start tracking your academic journey at Uva Wellassa University.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">Full Name</label>
              <AuthInput
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                icon={<User size={16} />}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">UWU Student Email</label>
              <AuthInput
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. cst20001@std.uwu.ac.lk"
                icon={<Mail size={16} />}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Password</label>
                <AuthInput
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  icon={<Lock size={16} />}
                  required
                />

                {formData.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1 h-1 w-full">
                      <div className={`h-full flex-grow rounded-full transition-all duration-300 ${strength.score >= 1 ? strength.color : "bg-slate-100"}`} />
                      <div className={`h-full flex-grow rounded-full transition-all duration-300 ${strength.score >= 2 ? strength.color : "bg-slate-100"}`} />
                      <div className={`h-full flex-grow rounded-full transition-all duration-300 ${strength.score >= 3 ? strength.color : "bg-slate-100"}`} />
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">Strength:</span>
                      <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Re-enter Password</label>
                <AuthInput
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  icon={<Lock size={16} />}
                  required
                />
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="mt-1.5 text-[10px] text-rose-500 font-semibold">Passwords do not match</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-2">
              <input
                type="checkbox"
                name="agree"
                id="agree"
                checked={formData.agree}
                onChange={handleChange}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                required
              />
              <label htmlFor="agree" className="text-xs text-slate-500 leading-normal cursor-pointer select-none">
                I agree to the{" "}
                <a href="#terms" className="text-primary font-medium hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#privacy" className="text-primary font-medium hover:underline">
                  Privacy Policy
                </a>
                , and consent to receiving academic updates.
              </label>
            </div>

            {error && <FormError message={error} />}

            <AuthSubmitButton>
              <span>Create Account</span>
              <ArrowRight size={15} strokeWidth={2.5} />
            </AuthSubmitButton>
          </form>

          <div className="text-center mt-8">
            <span className="text-xs text-slate-400">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Log In
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
