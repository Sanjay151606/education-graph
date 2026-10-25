import { createContext, useContext, useState, useEffect } from "react";

const StimulationContext = createContext({
  reducedMode: false,
  toggleReducedMode: () => {},
});

export function StimulationProvider({ children }) {
  const [reducedMode, setReducedMode] = useState(() => {
    return localStorage.getItem("braingraph_reduced_stim") === "true";
  });

  useEffect(() => {
    localStorage.setItem("braingraph_reduced_stim", String(reducedMode));
    if (reducedMode) {
      document.body.classList.add("reduced-stim");
    } else {
      document.body.classList.remove("reduced-stim");
    }
  }, [reducedMode]);

  const toggleReducedMode = () => setReducedMode((prev) => !prev);

  return (
    <StimulationContext.Provider value={{ reducedMode, toggleReducedMode }}>
      {children}
    </StimulationContext.Provider>
  );
}

export const useStimulation = () => useContext(StimulationContext);
export const useStimulationMode = () => {
  const context = useContext(StimulationContext);
  return {
    ...context,
    reducedStimulation: context?.reducedMode ?? false,
    reducedMode: context?.reducedMode ?? false,
  };
};


export default function ReducedStimulationToggle({ className = "" }) {
  const { reducedMode, toggleReducedMode } = useStimulation();

  return (
    <button
      type="button"
      onClick={toggleReducedMode}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
        reducedMode
          ? "bg-slate-900 text-white border-slate-800 shadow-sm"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
      } ${className}`}
      title="Toggle Reduced Stimulation Mode (removes animations, sidebars & distractions)"
    >
      <span>{reducedMode ? "🌙" : "✨"}</span>
      <span>{reducedMode ? "Calm Mode (ON)" : "Calm Mode"}</span>
    </button>
  );
}
