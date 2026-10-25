import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  GraduationCap,
  School,
  ArrowRight,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Clock,
  BookOpen,
} from "lucide-react";

export default function Login() {
  const [searchParams] = useSearchParams();
  // Role selection state: null = choice screen, "student", "teacher"
  const initialRole = searchParams.get("role") || null;
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const {
    user,
    session,
    role,
    authError,
    setAuthError,
    login,
    loginWithGoogle,
    loginAsDemo,
  } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  useEffect(() => {
    if (session || user) {
      const activeRole = role || user?.role || "student";
      navigate(activeRole === "teacher" ? "/teacher" : "/dashboard");
    }
  }, [session, user, role, navigate]);

  const handleRoleSelect = (r) => {
    setSelectedRole(r);
    setError("");
    if (setAuthError) setAuthError("");
  };

  const handleBackToChoice = () => {
    setSelectedRole(null);
    setError("");
    if (setAuthError) setAuthError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (setAuthError) setAuthError("");
    setSubmitting(true);
    try {
      await login(email, password, selectedRole);
      navigate(selectedRole === "teacher" ? "/teacher" : "/dashboard");
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async (roleType) => {
    setError("");
    if (setAuthError) setAuthError("");
    try {
      await loginAsDemo(roleType);
      navigate(roleType === "teacher" ? "/teacher" : "/dashboard");
    } catch (err) {
      setError("Failed to initialize demo session.");
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    if (setAuthError) setAuthError("");
    try {
      await loginWithGoogle(selectedRole);
    } catch (err) {
      setError(
        err.message ||
          "Failed to initiate Google sign-in. Please ensure Google OAuth is configured."
      );
    }
  };

  const isTeacher = selectedRole === "teacher";

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/90 w-full max-w-md space-y-6">
        
        {/* ========================================================================= */}
        {/* VIEW 1: CHOOSE YOUR ACCOUNT TYPE (INITIAL SELECTION SCREEN)               */}
        {/* ========================================================================= */}
        {!selectedRole ? (
          <div className="space-y-6">
            {/* Header / Brand */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brain-600 text-white text-2xl shadow-sm mx-auto">
                🧠
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                BrainGraph
              </h1>
              <p className="text-sm font-semibold text-slate-500">
                Choose your account type
              </p>
            </div>

            {error && (
              <div className="p-3.5 text-xs font-semibold bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Selection Buttons */}
            <div className="space-y-3 pt-2">
              {/* Student Login Option */}
              <button
                type="button"
                onClick={() => handleRoleSelect("student")}
                className="w-full p-4 rounded-2xl border-2 border-slate-200 hover:border-brain-500 bg-white hover:bg-brain-50/40 transition-all text-left group flex items-center justify-between shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-brain-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 group-hover:text-brain-700">
                      Student Login
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      ADHD tools, 4-section assessment & focus companion
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brain-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Teacher Login Option */}
              <button
                type="button"
                onClick={() => handleRoleSelect("teacher")}
                className="w-full p-4 rounded-2xl border-2 border-slate-200 hover:border-purple-500 bg-white hover:bg-purple-50/40 transition-all text-left group flex items-center justify-between shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <School className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 group-hover:text-purple-700">
                      Teacher Login
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Live 60-student monitoring, clusters & lecture insights
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>

            {/* Quick Demo Access Bar */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Looking for demo mode?</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin("student")}
                  className="font-bold text-brain-600 hover:underline"
                >
                  Student Demo
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => handleDemoLogin("teacher")}
                  className="font-bold text-purple-600 hover:underline"
                >
                  Teacher Demo
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: AUTHENTICATION FORM (STUDENT OR TEACHER)                          */
          /* ========================================================================= */
          <div className="space-y-6">
            
            {/* Back to Account Type Choice */}
            <button
              type="button"
              onClick={handleBackToChoice}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change account type</span>
            </button>

            {/* Header Branding */}
            <div className="text-center space-y-1.5">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider mb-1 ${
                  isTeacher
                    ? "bg-purple-100 text-purple-800"
                    : "bg-blue-100 text-brain-800"
                }`}
              >
                {isTeacher ? (
                  <School className="w-3 h-3 text-purple-600" />
                ) : (
                  <GraduationCap className="w-3 h-3 text-brain-600" />
                )}
                <span>{isTeacher ? "Teacher Portal" : "Student Portal"}</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900">
                {isTeacher ? "Teacher Login" : "Student Login"}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {isTeacher
                  ? "Access classroom live monitoring and diagnostic clustering."
                  : "Access your 4-section assessment, tasks, notes, and study companion."}
              </p>
            </div>

            {error && (
              <div className="p-3.5 text-xs font-semibold bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Google OAuth Login Button */}
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
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                or email & password
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>

            {/* Standard Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Email
                </label>
                <input
                  className="w-full border border-slate-200 focus:border-brain-500 focus:ring-1 focus:ring-brain-500 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none transition"
                  placeholder={
                    isTeacher ? "teacher@braingraph.edu" : "student@braingraph.edu"
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-brain-600 hover:text-brain-700 font-semibold transition"
                  >
                    Forgot?
                  </Link>
                </div>
                <input
                  className="w-full border border-slate-200 focus:border-brain-500 focus:ring-1 focus:ring-brain-500 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none transition"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  required
                  autoComplete="current-password"
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
                {submitting ? "Authenticating..." : "Login"}
              </button>
            </form>

            {/* 1-Click Instant Demo Quick Access */}
            <div
              className={`p-3.5 rounded-2xl border space-y-2 ${
                isTeacher
                  ? "bg-purple-50/70 border-purple-200"
                  : "bg-blue-50/70 border-blue-200"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <span>⚡ 1-Click Demo Access</span>
                <span className="px-2 py-0.2 rounded-full bg-white border">Zero Setup</span>
              </div>

              <button
                type="button"
                onClick={() => handleDemoLogin(selectedRole)}
                className={`w-full py-2 px-3 rounded-xl text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                  isTeacher
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-brain-600 hover:bg-brain-700"
                }`}
              >
                <span>
                  {isTeacher
                    ? "👩‍🏫 Enter as Teacher (Prof. Davis)"
                    : "🧑‍🎓 Enter as Student (Alex Rivera)"}
                </span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Create Account Link */}
            <p className="text-xs text-center text-slate-500 font-medium">
              Don't have an account?{" "}
              <Link
                to={`/register?role=${selectedRole}`}
                className={`font-bold hover:underline ${
                  isTeacher ? "text-purple-700" : "text-brain-600"
                }`}
              >
                {isTeacher
                  ? "Create Teacher Account"
                  : "Create Student Account"}
              </Link>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
