import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  GraduationCap,
  School,
  LogOut,
  Sparkles,
  User,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  Gamepad2,
  Timer,
  Video,
  BarChart3,
  Settings as SettingsIcon,
  FileCheck,
} from "lucide-react";

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentRole = role || user?.role || "student";
  const isTeacher = currentRole === "teacher";

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMoreDropdownOpen(false);
  }, [location.pathname]);

  // Click outside listener for tablet More dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMoreDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.full_name ||
    user?.name ||
    user?.email?.split("@")[0] ||
    "User";

  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    user?.avatar_url ||
    null;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path) => {
    if (path === "/dashboard" && location.pathname === "/") return true;
    if (path === "/teacher" && location.pathname === "/") return isTeacher;
    return location.pathname.startsWith(path);
  };

  // Nav link style generator
  const getNavLinkClass = (path, accentColor = "brain") => {
    const active = isActive(path);
    if (active) {
      return `px-3 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 font-extrabold border border-indigo-500/40 shadow-inner flex items-center transition-all`;
    }
    return `px-3 py-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 font-bold flex items-center transition-all`;
  };

  return (
    <nav className="bg-[#0b0f19]/85 backdrop-blur-xl shadow-2xl border-b border-slate-800/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link
              to={isTeacher ? "/teacher" : "/dashboard"}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 group-hover:from-indigo-500 group-hover:to-purple-500 flex items-center justify-center text-white font-black text-base shadow-lg shadow-indigo-500/20 transition-transform group-hover:scale-105">
                🧠
              </div>
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                BrainGraph
              </span>
            </Link>
          </div>

          {/* Desktop & Tablet Navigation */}
          {user && (
            <div className="hidden md:flex items-center gap-1 lg:gap-2 text-xs font-bold">
              {isTeacher ? (
                // ==================== TEACHER NAVIGATION ====================
                <>
                  <Link to="/teacher" className={getNavLinkClass("/teacher")}>
                    Teacher Dashboard
                  </Link>
                  <Link
                    to="/teacher/materials"
                    className={getNavLinkClass("/teacher/materials")}
                  >
                    Study Materials
                  </Link>
                  <Link
                    to="/classroom"
                    className={getNavLinkClass("/classroom")}
                  >
                    Live Grid
                  </Link>
                  <Link
                    to="/diagnostic"
                    className={getNavLinkClass("/diagnostic")}
                  >
                    Knowledge Clusters
                  </Link>
                  <Link
                    to="/followup"
                    className={getNavLinkClass("/followup")}
                  >
                    Post-Class Recaps
                  </Link>
                </>
              ) : (
                // ==================== STUDENT NAVIGATION ====================
                <>
                  <Link to="/dashboard" className={getNavLinkClass("/dashboard")}>
                    <span className="whitespace-nowrap">Dashboard</span>
                  </Link>
                  <Link to="/assessment" className={getNavLinkClass("/assessment")}>
                    <span className="whitespace-nowrap">Assessment</span>
                  </Link>
                  <Link to="/tasks" className={getNavLinkClass("/tasks")}>
                    <span className="whitespace-nowrap">Tasks</span>
                  </Link>
                  <Link to="/materials" className={getNavLinkClass("/materials")}>
                    <span className="whitespace-nowrap">Materials</span>
                  </Link>
                  <Link to="/focus" className={getNavLinkClass("/focus")}>
                    <span className="whitespace-nowrap">Focus Mode</span>
                  </Link>

                  {/* Desktop Only Extra Links (≥1024px) */}
                  <div className="hidden lg:flex items-center gap-1">
                    <Link
                      to="/activities"
                      className={getNavLinkClass("/activities")}
                    >
                      <span className="whitespace-nowrap">Activities</span>
                    </Link>
                    <Link
                      to="/classroom"
                      className={getNavLinkClass("/classroom")}
                    >
                      <span className="whitespace-nowrap">Live Class</span>
                    </Link>
                    <Link
                      to="/reports"
                      className={getNavLinkClass("/reports")}
                    >
                      <span className="whitespace-nowrap">Reports</span>
                    </Link>
                    <Link
                      to="/settings"
                      className={getNavLinkClass("/settings")}
                    >
                      <span className="whitespace-nowrap">Settings</span>
                    </Link>
                  </div>

                  {/* Tablet "More" Dropdown (768px - 1023px) */}
                  <div className="relative lg:hidden" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setMoreDropdownOpen((prev) => !prev)}
                      className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        moreDropdownOpen ||
                        ["/activities", "/classroom", "/reports", "/settings"].some(
                          (p) => location.pathname.startsWith(p)
                        )
                          ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                      }`}
                      aria-expanded={moreDropdownOpen}
                      aria-haspopup="true"
                    >
                      <span>More</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${
                          moreDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {moreDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-slate-200">
                        <Link
                          to="/activities"
                          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-purple-950/70 hover:text-purple-300 transition-colors"
                        >
                          Interactive Activities
                        </Link>
                        <Link
                          to="/classroom"
                          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-indigo-950/70 hover:text-indigo-300 transition-colors"
                        >
                          <span className="whitespace-nowrap">Live Class</span>
                        </Link>
                        <Link
                          to="/reports"
                          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-pink-950/70 hover:text-pink-300 transition-colors"
                        >
                          <span className="whitespace-nowrap">Reports</span>
                        </Link>
                        <div className="my-1 border-t border-slate-800" />
                        <Link
                          to="/settings"
                          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 transition-colors"
                        >
                          Settings
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Right Section: User Info / Role Badge & Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* User Info Capsule */}
                <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-slate-800">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0 shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0 shadow-md ${
                        isTeacher ? "bg-purple-600 shadow-purple-600/30" : "bg-indigo-600 shadow-indigo-600/30"
                      }`}
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-xs font-black text-slate-200 truncate max-w-[120px]">
                      {displayName}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9px] font-extrabold uppercase tracking-wider mt-0.5 ${
                        isTeacher
                          ? "bg-purple-950/80 text-purple-300 border border-purple-800/60"
                          : "bg-indigo-950/80 text-indigo-300 border border-indigo-800/60"
                      }`}
                    >
                      {isTeacher ? (
                        <School className="w-2.5 h-2.5 text-purple-400" />
                      ) : (
                        <GraduationCap className="w-2.5 h-2.5 text-indigo-400" />
                      )}
                      <span>{isTeacher ? "Teacher" : "Student"}</span>
                    </span>
                  </div>
                </div>

                {/* Desktop Logout Button */}
                <button
                  onClick={handleLogout}
                  className="hidden md:flex p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition items-center gap-1 text-xs font-bold cursor-pointer"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden xl:inline">Logout</span>
                </button>

                {/* Mobile Menu Toggle Button */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((prev) => !prev)}
                  className="md:hidden p-2 rounded-xl text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                  aria-label="Toggle navigation menu"
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? (
                    <X className="w-6 h-6 text-slate-100" />
                  ) : (
                    <Menu className="w-6 h-6 text-slate-100" />
                  )}
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 text-xs transition"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer / Panel (<768px) */}
      {user && mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 pt-3 pb-5 space-y-3 shadow-2xl animate-in slide-in-from-top duration-200 text-slate-100">
          {/* User profile row in mobile drawer */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-9 h-9 rounded-full object-cover border border-slate-700"
              />
            ) : (
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black ${
                  isTeacher ? "bg-purple-600" : "bg-indigo-600"
                }`}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-100 truncate">
                {displayName}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                isTeacher
                  ? "bg-purple-950 text-purple-300 border border-purple-800"
                  : "bg-indigo-950 text-indigo-300 border border-indigo-800"
              }`}
            >
              {isTeacher ? "Teacher" : "Student"}
            </span>
          </div>

          {/* Nav items list */}
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            {isTeacher ? (
              <>
                <Link
                  to="/teacher"
                  className={`p-3 rounded-xl flex items-center gap-2 border ${
                    isActive("/teacher")
                      ? "bg-purple-950/80 text-purple-300 border-purple-700"
                      : "bg-slate-900 text-slate-300 border-slate-800"
                  }`}
                >
                  <span className="whitespace-nowrap">Dashboard</span>
                </Link>
                <Link
                  to="/teacher/materials"
                  className={`p-3 rounded-xl flex items-center gap-2 border ${
                    isActive("/teacher/materials")
                      ? "bg-purple-950/80 text-purple-300 border-purple-700"
                      : "bg-slate-900 text-slate-300 border-slate-800"
                  }`}
                >
                  <span className="whitespace-nowrap">Materials</span>
                </Link>
                <Link
                  to="/classroom"
                  className={`p-3 rounded-xl flex items-center gap-2 border ${
                    isActive("/classroom")
                      ? "bg-indigo-950/80 text-indigo-300 border-indigo-700"
                      : "bg-slate-900 text-slate-300 border-slate-800"
                  }`}
                >
                  <span className="whitespace-nowrap">Live Class</span>
                </Link>
                <Link
                  to="/diagnostic"
                  className={`p-3 rounded-xl flex items-center gap-2 border ${
                    isActive("/diagnostic")
                      ? "bg-indigo-950/80 text-indigo-300 border-indigo-700"
                      : "bg-slate-900 text-slate-300 border-slate-800"
                  }`}
                >
                  <span>🔍</span> Clusters
                </Link>
                <Link
                  to="/followup"
                  className={`p-3 rounded-xl flex items-center gap-2 border ${
                    isActive("/followup")
                      ? "bg-indigo-950/80 text-indigo-300 border-indigo-700"
                      : "bg-slate-900 text-slate-300 border-slate-800"
                  }`}
                >
                  Recaps
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className={`p-3 rounded-xl flex items-center gap-2 border ${
                    isActive("/dashboard")
                      ? "bg-indigo-950/80 text-indigo-300 border-indigo-700"
                      : "bg-slate-900 text-slate-300 border-slate-800"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/assessment"
                  className={`p-3 rounded-xl flex items-center gap-2 border ${
                    isActive("/assessment")
                      ? "bg-blue-950/80 text-blue-300 border-blue-700"
                      : "bg-slate-900 text-slate-300 border-slate-800"
                  }`}
                >
                  Assessment
                </Link>
                <Link
                  to="/tasks"
                  className={`p-3 rounded-xl flex items-center gap-2 border ${
                    isActive("/tasks")
                      ? "bg-indigo-950/80 text-indigo-300 border-indigo-700"
                      : "bg-slate-900 text-slate-300 border-slate-800"
                  }`}
                >
                  Tasks
                </Link>
                <Link
                  to="/materials"
                  className={`p-3 rounded-xl flex items-center gap-2 border ${
                    isActive("/materials")
                      ? "bg-emerald-950/80 text-emerald-300 border-emerald-700"
                      : "bg-slate-900 text-slate-300 border-slate-800"
                  }`}
                >
                  Materials
                </Link>
                <Link
                  to="/focus"
                  className={`p-3 rounded-xl flex items-center gap-2 border ${
                    isActive("/focus")
                      ? "bg-amber-950/80 text-amber-300 border-amber-700"
                      : "bg-slate-900 text-slate-300 border-slate-800"
                  }`}
                >
                  Focus Mode
                </Link>
                <Link
                  to="/activities"
                  className={`p-3 rounded-xl flex items-center gap-2 border ${
                    isActive("/activities")
                      ? "bg-purple-950/80 text-purple-300 border-purple-700"
                      : "bg-slate-900 text-slate-300 border-slate-800"
                  }`}
                >
                  Activities
                </Link>
                <Link
                  to="/classroom"
                  className={`p-3 rounded-xl flex items-center gap-2 border ${
                    isActive("/classroom")
                      ? "bg-indigo-950/80 text-indigo-300 border-indigo-700"
                      : "bg-slate-900 text-slate-300 border-slate-800"
                  }`}
                >
                  <span className="whitespace-nowrap">Live Class</span>
                </Link>
                <Link
                  to="/reports"
                  className={`p-3 rounded-xl flex items-center gap-2 border ${
                    isActive("/reports")
                      ? "bg-pink-950/80 text-pink-300 border-pink-700"
                      : "bg-slate-900 text-slate-300 border-slate-800"
                  }`}
                >
                  <span className="whitespace-nowrap">Reports</span>
                </Link>
                <Link
                  to="/settings"
                  className={`p-3 rounded-xl flex items-center gap-2 border col-span-2 ${
                    isActive("/settings")
                      ? "bg-slate-800 text-white border-slate-700"
                      : "bg-slate-900 text-slate-300 border-slate-800"
                  }`}
                >
                  Settings
                </Link>
              </>
            )}
          </div>

          {/* Logout button in mobile drawer */}
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 rounded-xl bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/60 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </nav>
  );
}

