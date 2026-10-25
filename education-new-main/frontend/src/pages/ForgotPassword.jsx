import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { requestPasswordReset } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSubmitted(true);
    } catch (err) {
      // Keep message generic unless it's a critical rate limit or invalid email format
      console.error("Password reset request error:", err);
      // Still show submitted confirmation or general error
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Reset your password</h1>
          <p className="text-sm text-slate-500">
            Enter your email and we'll send you instructions to reset your password.
          </p>
        </div>

        {submitted ? (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm leading-relaxed">
              If an account exists for <strong>{email}</strong>, we have sent a password reset link to that address. Please check your inbox and spam folder.
            </div>

            <Link
              to="/login"
              className="block w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 rounded-xl transition"
            >
              Back to log in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-700 rounded-xl">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">Email Address</label>
              <input
                className="w-full border border-slate-200 focus:border-brain-500 focus:ring-1 focus:ring-brain-500 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brain-500 hover:bg-brain-600 disabled:opacity-50 text-white rounded-xl py-2.5 font-medium transition duration-150 shadow-sm"
            >
              {loading ? "Sending link..." : "Send reset link"}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-sm text-slate-500 hover:text-slate-700 font-medium">
                ← Back to log in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
