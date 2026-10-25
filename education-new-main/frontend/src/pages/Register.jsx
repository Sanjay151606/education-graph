import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GraduationCap, School, AlertCircle, Sparkles } from "lucide-react";

export default function Register() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") || "student";
  const [selectedRole, setSelectedRole] = useState(initialRole);

  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const isTeacher = selectedRole === "teacher";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setSubmitting(true);
    try {
      const res = await register(
        form.email,
        form.password,
        form.full_name,
        selectedRole
      );
      if (res?.user && !res?.session) {
        setInfo(
          isTeacher
            ? "Teacher registration submitted! Please check your email to confirm your account."
            : "Student account created! Please check your email to confirm your account before logging in."
        );
      } else {
        navigate(isTeacher ? "/teacher" : "/dashboard");
      }
    } catch (err) {
      setError(err.message || "Could not create account.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      await loginWithGoogle(selectedRole);
    } catch (err) {
      setError(err.message || "Failed to initiate Google sign-in.");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-sm w-full max-w-md space-y-6">
        
        {/* Role Selection Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setSelectedRole("student")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              !isTeacher
                ? "bg-white text-brain-700 shadow-xs ring-1 ring-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Student Account</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole("teacher")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isTeacher
                ? "bg-purple-600 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <School className="w-4 h-4" />
            <span>Teacher Account</span>
          </button>
        </div>

        <div className="text-center space-y-1.5">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider mb-1 ${
              isTeacher ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-brain-800"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>{isTeacher ? "Educator Sign Up" : "Learner Sign Up"}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            {isTeacher ? "Create Teacher Account" : "Create Student Account"}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {isTeacher
              ? "Join BrainGraph to manage classrooms, live analytics, and recaps."
              : "Join BrainGraph for ADHD-adapted learning, assessments, and tasks."}
          </p>
        </div>

        {error && (
          <div className="p-3.5 text-xs font-semibold bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div className="p-3.5 text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl">
            {info}
          </div>
        )}

        {/* Google Signup Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition duration-150 shadow-2xs text-xs cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google as {isTeacher ? "Teacher" : "Student"}</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            or continue with email
          </span>
          <div className="border-t border-slate-200 w-full" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Full Name
            </label>
            <input
              className="w-full border border-slate-200 focus:border-brain-500 focus:ring-1 focus:ring-brain-500 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none transition"
              placeholder={isTeacher ? "Prof. Jane Smith" : "Alex Rivera"}
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Email Address
            </label>
            <input
              className="w-full border border-slate-200 focus:border-brain-500 focus:ring-1 focus:ring-brain-500 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none transition"
              placeholder={isTeacher ? "teacher@braingraph.edu" : "student@braingraph.edu"}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <input
              className="w-full border border-slate-200 focus:border-brain-500 focus:ring-1 focus:ring-brain-500 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none transition"
              placeholder="••••••••"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full text-white rounded-xl py-2.5 text-xs font-bold transition duration-150 shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
              isTeacher
                ? "bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                : "bg-brain-600 hover:bg-brain-700 disabled:opacity-50"
            }`}
          >
            {submitting
              ? "Creating account..."
              : `Sign up as ${isTeacher ? "Teacher" : "Student"}`}
          </button>
        </form>

        <p className="text-xs text-center text-slate-500 font-medium">
          Already have an account?{" "}
          <Link
            to={`/login?role=${selectedRole}`}
            className={`font-bold hover:underline ${
              isTeacher ? "text-purple-700" : "text-brain-600"
            }`}
          >
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}
