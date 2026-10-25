import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../api/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    // Check if current session is active (e.g. redirected from Supabase recovery email)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session) {
        setIsRecoverySession(true);
      }
      setCheckingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
        setIsRecoverySession(true);
      }
      setCheckingSession(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to update password. Link may have expired.");
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-slate-500 text-sm">Verifying reset link...</div>
      </div>
    );
  }

  if (!isRecoverySession && !success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm w-full max-w-md text-center space-y-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h1 className="text-xl font-bold text-slate-900">Reset link expired or invalid</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            This password recovery link has expired or has already been used. Please request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block bg-brain-500 hover:bg-brain-600 text-white font-medium px-5 py-2.5 rounded-xl transition"
          >
            Request new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Create new password</h1>
          <p className="text-sm text-slate-500">
            Please enter your new password below.
          </p>
        </div>

        {success ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm text-center">
            Password updated successfully! Redirecting you to your dashboard...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-700 rounded-xl">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">New Password</label>
              <input
                className="w-full border border-slate-200 focus:border-brain-500 focus:ring-1 focus:ring-brain-500 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">Confirm New Password</label>
              <input
                className="w-full border border-slate-200 focus:border-brain-500 focus:ring-1 focus:ring-brain-500 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                placeholder="••••••••"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brain-500 hover:bg-brain-600 disabled:opacity-50 text-white rounded-xl py-2.5 font-medium transition duration-150 shadow-sm"
            >
              {submitting ? "Updating password..." : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
