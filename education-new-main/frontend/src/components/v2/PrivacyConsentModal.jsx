import { useState } from "react";

export default function PrivacyConsentModal({ onAccept, onDecline }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 md:p-8 space-y-6 border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brain-50 text-brain-600 flex items-center justify-center text-2xl">
            🛡️
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Privacy & Consent</h2>
            <p className="text-xs text-slate-500">Live Attention & Engagement Tracking</p>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 space-y-2 text-sm text-emerald-950">
          <div className="flex items-center gap-2 font-semibold text-emerald-800">
            <span>🔒</span>
            <span>100% On-Device Processing Guarantee</span>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">
            Your camera is used strictly to calculate local attention and expression estimates
            (e.g., focused, confused) in your browser. <strong>Raw video and photos NEVER leave your device</strong> and are never transmitted or stored on any server.
          </p>
        </div>

        <div className="space-y-3 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
          <div className="flex items-start gap-2">
            <span className="text-base">📊</span>
            <div>
              <strong className="text-slate-800">Teacher sees class averages only:</strong> The teacher’s dashboard only receives an anonymous, aggregated grid to know when the whole class needs a recap.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-base">👤</span>
            <div>
              <strong className="text-slate-800">Your data stays yours:</strong> Individual attention history is private to your student account and is only used to generate personalized recaps and gentle break nudges.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-base">⚙️</span>
            <div>
              <strong className="text-slate-800">Complete control:</strong> You can pause or disable camera tracking at any time during class.
            </div>
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-slate-300 text-brain-600 focus:ring-brain-500"
          />
          <span className="text-xs text-slate-700 font-medium">
            I understand that on-device attention estimates will be calculated locally and consent to participating in live classroom engagement.
          </span>
        </label>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onDecline}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-100 transition"
          >
            Decline (Simulation Mode)
          </button>
          <button
            type="button"
            disabled={!agreed}
            onClick={onAccept}
            className="flex-1 px-4 py-2.5 rounded-xl bg-brain-600 text-white text-sm font-semibold hover:bg-brain-700 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-brain-600/20"
          >
            Opt In & Begin
          </button>
        </div>
      </div>
    </div>
  );
}
