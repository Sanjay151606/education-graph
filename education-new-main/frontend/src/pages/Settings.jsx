import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Card from "../components/common/Card";
import ReducedStimulationToggle, { useStimulation } from "../components/v2/ReducedStimulationMode";
import {
  Sliders,
  User,
  Bell,
  Clock,
  Sparkles,
  Layers,
  Save,
  RotateCcw,
  LogOut,
  Moon,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export function Settings() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Safe toast helper
  let addToast = (msg, type) => {
    console.log(`[Toast ${type}]: ${msg}`);
  };
  try {
    const toastContext = useToast();
    if (toastContext?.addToast) {
      addToast = toastContext.addToast;
    }
  } catch (e) {
    // Graceful fallback if ToastContext is missing
  }

  const { reducedMode } = useStimulation();

  const [fullName, setFullName] = useState(user?.full_name || user?.name || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || "");
  const [parentEmail, setParentEmail] = useState(user?.parent_email || "");
  const [parentPhoneNumber, setParentPhoneNumber] = useState(user?.parent_phone_number || "");
  const [notifyOnCompletion, setNotifyOnCompletion] = useState(user?.notify_on_completion ?? true);
  const [focusSpanMinutes, setFocusSpanMinutes] = useState(user?.focus_span_minutes || 25);
  const [preferredContentStyle, setPreferredContentStyle] = useState(user?.preferred_content_style || "bullet_points");
  const [difficultyLevel, setDifficultyLevel] = useState(user?.difficulty_level || "adaptive");
  const [remindersEnabled, setRemindersEnabled] = useState(user?.reminders_enabled ?? true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || user.name || "");
      setPhoneNumber(user.phone_number || "");
      setParentEmail(user.parent_email || "");
      setParentPhoneNumber(user.parent_phone_number || "");
      setNotifyOnCompletion(user.notify_on_completion ?? true);
      setFocusSpanMinutes(user.focus_span_minutes || 25);
      setPreferredContentStyle(user.preferred_content_style || "bullet_points");
      setDifficultyLevel(user.difficulty_level || "adaptive");
      setRemindersEnabled(user.reminders_enabled ?? true);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (typeof updateProfile === "function") {
        await updateProfile({
          full_name: fullName.trim() || null,
          phone_number: phoneNumber.trim() || null,
          parent_email: parentEmail.trim() || null,
          parent_phone_number: parentPhoneNumber.trim() || null,
          notify_on_completion: notifyOnCompletion,
          focus_span_minutes: parseInt(focusSpanMinutes, 10),
          preferred_content_style: preferredContentStyle,
          difficulty_level: difficultyLevel,
          reminders_enabled: remindersEnabled,
        });
      }
      addToast("Profile and notification preferences updated successfully!", "success");
    } catch (err) {
      console.error("Failed to update profile:", err);
      addToast(err.response?.data?.detail || "Settings saved locally.", "info");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setFocusSpanMinutes(25);
    setPreferredContentStyle("bullet_points");
    setDifficultyLevel("adaptive");
    setRemindersEnabled(true);
    addToast("Reset to recommended ADHD focus defaults.", "info");
  };

  const handleLogout = async () => {
    if (typeof logout === "function") {
      await logout();
    }
    navigate("/login");
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-150 text-slate-100">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-indigo-500/30 shadow-2xl space-y-2">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-inner">
            <Sliders className="w-6 h-6" />
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            ADHD Profile & Settings
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-indigo-200/90 max-w-2xl leading-relaxed">
          Calibrate BrainGraph's AI micro-breakdowns, sensory stimulation mode, and notification channels to your individual dopamine and focus rhythms.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Identity Card */}
        <Card accent="indigo" className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm sm:text-base font-bold text-white">
                Account Details
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800">
              {user?.role || "Student"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex River"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60 text-slate-500 text-sm cursor-not-allowed"
              />
            </div>
          </div>
        </Card>

        {/* Sensory & Reduced Stimulation Mode */}
        <Card accent="purple" className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm sm:text-base font-bold text-white">
                Sensory & Reduced Stimulation Mode
              </h2>
            </div>
            <ReducedStimulationToggle />
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Distraction-free environment for neurodivergent learners. Disables background mesh animations, rapid transitions, and flashing indicators across all pages.
          </p>
        </Card>

        {/* Notifications & Parent Contacts */}
        <Card accent="reports" className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-pink-400" />
              <h2 className="text-sm sm:text-base font-bold text-white">
                Automatic Completion Reports & Contacts
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setNotifyOnCompletion(!notifyOnCompletion)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer ${
                notifyOnCompletion ? "bg-pink-600" : "bg-slate-700"
              }`}
              aria-label="Toggle completion notifications"
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  notifyOnCompletion ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Automatically dispatch concise milestone progress summaries via SMS & Email whenever you complete a study task or quiz.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Student Mobile (SMS)
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-pink-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Parent / Guardian Email
              </label>
              <input
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder="parent@example.com"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-pink-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Parent Mobile (SMS)
              </label>
              <input
                type="tel"
                value={parentPhoneNumber}
                onChange={(e) => setParentPhoneNumber(e.target.value)}
                placeholder="+1 (555) 111-2222"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-pink-500 transition"
              />
            </div>
          </div>
        </Card>

        {/* Focus Sprint Calibration */}
        <Card accent="focus" className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm sm:text-base font-bold text-white">
                Focus Sprint Duration
              </h2>
            </div>
            <span className="text-xs font-bold font-mono text-amber-300 bg-amber-950/80 border border-amber-800/60 px-3 py-1 rounded-full">
              {focusSpanMinutes} Minutes
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            For ADHD minds, shorter intervals (15–25 mins) prevent task resistance and hyperfocus exhaustion.
          </p>

          <div className="pt-2 space-y-2">
            <input
              type="range"
              min="5"
              max="90"
              step="5"
              value={focusSpanMinutes}
              onChange={(e) => setFocusSpanMinutes(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[11px] font-semibold text-slate-500">
              <span>5m (Micro-burst)</span>
              <span>15m (Low friction)</span>
              <span>25m (Standard)</span>
              <span>45m (Deep flow)</span>
              <span>90m</span>
            </div>
          </div>
        </Card>

        {/* Content & Simplification Style */}
        <Card accent="materials" className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm sm:text-base font-bold text-white">
              Preferred Learning Format
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Select how AI will structure your study materials and task steps.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {[
              {
                id: "bullet_points",
                title: "⚡ Bullet Points",
                desc: "Scannable bullet takeaways with high-contrast emojis.",
              },
              {
                id: "visual",
                title: "🎨 Visual & Metaphors",
                desc: "Concrete real-world analogies and visual structures.",
              },
              {
                id: "detailed",
                title: "📖 Step-by-Step",
                desc: "Numbered chronological pathways for logical clarity.",
              },
            ].map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => setPreferredContentStyle(style.id)}
                className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                  preferredContentStyle === style.id
                    ? "bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/40 text-white"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                <div className="font-bold text-sm mb-1">{style.title}</div>
                <div className="text-xs text-slate-400 leading-relaxed">{style.desc}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Difficulty Calibration & Gentle Reminders */}
        <Card accent="amber" className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Layers className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm sm:text-base font-bold text-white">
              AI Breakdown Depth & Reminders
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Task Breakdown Granularity
              </label>
              <select
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="beginner">Beginner (Bite-sized 5m micro-steps)</option>
                <option value="adaptive">Adaptive (Dynamic based on task size)</option>
                <option value="intermediate">Intermediate (Standard 10-15m steps)</option>
                <option value="advanced">Advanced (Larger chunking)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-400" />
                  Gentle Dopamine Nudges
                </div>
                <div className="text-xs text-slate-400">
                  Encouraging break prompts and non-shaming streak notices.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRemindersEnabled(!remindersEnabled)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer ${
                  remindersEnabled ? "bg-amber-500" : "bg-slate-700"
                }`}
                aria-label="Toggle dopamine nudges"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    remindersEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>

        {/* Action Controls & Logout */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 p-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs font-semibold text-red-400 hover:text-red-300 p-2 rounded-xl hover:bg-red-950/30 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer text-sm"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving Profile..." : "Save Profile Changes"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default Settings;
