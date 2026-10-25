import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import StudyMaterials from "./pages/StudyMaterials";
import FocusMode from "./pages/FocusMode";
import Progress from "./pages/Progress";
import ReportHistory from "./pages/ReportHistory";
import ActivityHub from "./pages/ActivityHub";
import { Settings } from "./pages/Settings";
import AssessmentIntro from "./pages/assessment/AssessmentIntro";
import SectionA from "./pages/assessment/SectionA";
import SectionB from "./pages/assessment/SectionB";
import SectionC from "./pages/assessment/SectionC";
import SectionD from "./pages/assessment/SectionD";
import AssessmentResults from "./pages/assessment/AssessmentResults";
import { useAuth } from "./context/AuthContext";

// ==================== V2 EXTENSION: CLASSROOM & ADHD SUPPORT ====================
import LiveClassroomStudent from "./pages/LiveClassroomStudent";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherMaterials from "./pages/TeacherMaterials";
import DiagnosticQuiz from "./pages/DiagnosticQuiz";
import PostClassFollowup from "./pages/PostClassFollowup";
import { StimulationProvider } from "./components/v2/ReducedStimulationMode";
// ===============================================================================

function ProtectedRoute({ children, requiredRole }) {
  const { user, session, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh] text-sm text-slate-500 font-semibold">
        Verifying authorization...
      </div>
    );
  }

  if (!session && !user) {
    return <Navigate to="/login" replace />;
  }

  const currentRole = role || user?.role || "student";

  if (requiredRole && requiredRole !== currentRole) {
    if (requiredRole === "teacher") {
      return (
        <Navigate
          to="/dashboard"
          replace
          state={{
            unauthorizedError:
              "You don't have permission to access the Teacher Dashboard.",
          }}
        />
      );
    } else if (requiredRole === "student") {
      return <Navigate to="/teacher" replace />;
    }
  }

  return children;
}

function Private({ children }) {
  const { user, session, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh] text-sm text-slate-500 font-semibold">
        Loading...
      </div>
    );
  }
  return session || user ? children : <Navigate to="/login" replace />;
}

function PublicOnly({ children }) {
  const { session, user, role, loading } = useAuth();
  if (loading) return null;
  if (session || user) {
    const currentRole = role || user?.role || "student";
    return <Navigate to={currentRole === "teacher" ? "/teacher" : "/dashboard"} replace />;
  }
  return children;
}

export default function App() {
  const { role, user } = useAuth();
  const currentRole = role || user?.role || "student";

  return (
    <StimulationProvider>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={<Navigate to={currentRole === "teacher" ? "/teacher" : "/dashboard"} replace />}
        />
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnly>
              <Register />
            </PublicOnly>
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Student Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="student">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute requiredRole="student">
              <Tasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/materials"
          element={
            <ProtectedRoute requiredRole="student">
              <StudyMaterials />
            </ProtectedRoute>
          }
        />
        <Route
          path="/study-materials"
          element={
            <ProtectedRoute requiredRole="student">
              <StudyMaterials />
            </ProtectedRoute>
          }
        />

        <Route
          path="/focus"
          element={
            <ProtectedRoute requiredRole="student">
              <FocusMode />
            </ProtectedRoute>
          }
        />
        <Route
          path="/progress"
          element={
            <ProtectedRoute requiredRole="student">
              <Progress />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute requiredRole="student">
              <ReportHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activities"
          element={
            <ProtectedRoute requiredRole="student">
              <ActivityHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <Private>
              <Settings />
            </Private>
          }
        />
        <Route
          path="/assessment"
          element={
            <ProtectedRoute requiredRole="student">
              <AssessmentIntro />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assessment/section-a"
          element={
            <ProtectedRoute requiredRole="student">
              <SectionA />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assessment/section-b"
          element={
            <ProtectedRoute requiredRole="student">
              <SectionB />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assessment/section-c"
          element={
            <ProtectedRoute requiredRole="student">
              <SectionC />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assessment/section-d"
          element={
            <ProtectedRoute requiredRole="student">
              <SectionD />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assessment/results"
          element={
            <ProtectedRoute requiredRole="student">
              <AssessmentResults />
            </ProtectedRoute>
          }
        />
        <Route
          path="/followup"
          element={
            <ProtectedRoute requiredRole="student">
              <PostClassFollowup />
            </ProtectedRoute>
          }
        />

        {/* Teacher Protected Routes */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute requiredRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/materials"
          element={
            <ProtectedRoute requiredRole="teacher">
              <TeacherMaterials />
            </ProtectedRoute>
          }
        />
        <Route
          path="/diagnostic"
          element={
            <ProtectedRoute requiredRole="teacher">
              <DiagnosticQuiz />
            </ProtectedRoute>
          }
        />

        {/* Shared Classroom Route (Dynamic role handling in component) */}
        <Route
          path="/classroom"
          element={
            <Private>
              <LiveClassroomStudent />
            </Private>
          }
        />
      </Routes>
    </StimulationProvider>
  );
}
