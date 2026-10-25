import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../api/supabaseClient";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(localStorage.getItem("bg_user_role") || "student");
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const extractUserFromSession = (currSession, currentRole = "student") => {
    if (!currSession?.user) return null;
    const metadata = currSession.user.user_metadata || {};
    const determinedRole = metadata.role || currentRole || "student";
    return {
      id: currSession.user.id,
      email: currSession.user.email,
      name: metadata.full_name || metadata.name || currSession.user.email?.split("@")[0] || "Learner",
      full_name: metadata.full_name || metadata.name || "Learner",
      avatar_url: metadata.avatar_url || metadata.picture || "",
      role: determinedRole,
      status: "active",
      focus_span_minutes: 20,
      preferred_content_style: "visual",
      difficulty_level: "adaptive",
      reminders_enabled: true,
    };
  };

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get("/api/auth/me");
      if (res.data) {
        // Only overwrite name/full_name/avatar_url if the backend returned a non-empty value.
        // This prevents a null profile field from erasing the Google user_metadata name.
        setUser((prev) => ({
          ...prev,
          ...res.data,
          // Preserve existing name/full_name from user_metadata if backend has none
          name: res.data.name || prev?.name || res.data.full_name || prev?.full_name,
          full_name: res.data.full_name || prev?.full_name || res.data.name || prev?.name,
          avatar_url: res.data.avatar_url || prev?.avatar_url,
        }));
        if (res.data.role) {
          setRole(res.data.role);
          localStorage.setItem("bg_user_role", res.data.role);
        }
        return res.data;
      }
    } catch (err) {
      console.warn("Could not fetch backend profile (using Supabase user data):", err?.message);
    }
    return null;
  }, []);

  const switchRole = (newRole) => {
    setRole(newRole);
    localStorage.setItem("bg_user_role", newRole);
    setUser((prev) => (prev ? { ...prev, role: newRole } : prev));
  };

  const handleSessionWithRoleCheck = useCallback(async (currSession) => {
    if (!currSession) {
      setUser(null);
      setSession(null);
      return;
    }

    setSession(currSession);
    if (currSession.access_token) {
      localStorage.setItem("token", currSession.access_token);
    }

    const intentRole = localStorage.getItem("bg_oauth_intent_role");
    let baseUser = extractUserFromSession(currSession, intentRole || "student");
    setUser(baseUser);

    const profile = await fetchProfile();
    if (profile) {
      const actualRole = profile.role || "student";
      const actualStatus = profile.status || "active";

      // Enforce Role Mismatch Checks
      if (intentRole && intentRole !== actualRole) {
        const errorMsg =
          actualRole === "teacher"
            ? "This account is registered as a Teacher. Please use Teacher Login."
            : "Your account is registered as Student. Please use Student Login.";

        setAuthError(errorMsg);
        localStorage.removeItem("token");
        localStorage.removeItem("braingraph_demo_session");
        localStorage.removeItem("bg_oauth_intent_role");
        setUser(null);
        setSession(null);
        try {
          await supabase.auth.signOut();
        } catch (e) {}
        return;
      }

      // Check Teacher Approval Status
      if (actualRole === "teacher" && actualStatus === "pending") {
        setAuthError("Your teacher account is pending administrator approval.");
        localStorage.removeItem("token");
        localStorage.removeItem("braingraph_demo_session");
        localStorage.removeItem("bg_oauth_intent_role");
        setUser(null);
        setSession(null);
        try {
          await supabase.auth.signOut();
        } catch (e) {}
        return;
      }

      setRole(actualRole);
      localStorage.setItem("bg_user_role", actualRole);
      setAuthError("");
    }

    localStorage.removeItem("bg_oauth_intent_role");
  }, [fetchProfile]);

  useEffect(() => {
    let mounted = true;

    // 1. Check for saved demo session
    const savedDemo = localStorage.getItem("braingraph_demo_session");
    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo);
        if (parsed?.access_token) {
          setSession(parsed);
          setUser(parsed.user);
          setRole(parsed.user?.role || "student");
          localStorage.setItem("token", parsed.access_token);
          setLoading(false);
          return;
        }
      } catch (e) {
        localStorage.removeItem("braingraph_demo_session");
      }
    }

    // 2. Load active Supabase session
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      if (!mounted) return;
      if (initSession) {
        handleSessionWithRoleCheck(initSession).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    // 3. Listen for OAuth and auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      if (newSession) {
        await handleSessionWithRoleCheck(newSession);
      } else {
        const activeDemo = localStorage.getItem("braingraph_demo_session");
        if (!activeDemo) {
          setUser(null);
          setSession(null);
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleSessionWithRoleCheck]);

  const loginAsDemo = async (targetRole = "student") => {
    setAuthError("");
    const isTeacher = targetRole === "teacher";
    const demoUser = {
      id: isTeacher ? "t0000000-0000-0000-0000-000000000001" : "a0000000-0000-0000-0000-000000000001",
      email: isTeacher ? "teacher@braingraph.edu" : "alex.learner@braingraph.edu",
      full_name: isTeacher ? "Prof. Davis" : "Alex Rivera (ADHD Learner)",
      name: isTeacher ? "Prof. Davis" : "Alex Rivera",
      role: targetRole,
      status: "active",
      focus_span_minutes: 20,
      preferred_content_style: "visual",
      difficulty_level: "adaptive",
      reminders_enabled: true,
    };
    const demoSession = {
      access_token: isTeacher ? "demo-teacher-token" : "demo-student-token",
      user: demoUser,
    };
    localStorage.setItem("braingraph_demo_session", JSON.stringify(demoSession));
    localStorage.setItem("token", demoSession.access_token);
    localStorage.setItem("bg_user_role", targetRole);
    setSession(demoSession);
    setUser(demoUser);
    setRole(targetRole);
    return demoSession;
  };

  const login = async (email, password, targetRole = "student") => {
    setAuthError("");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data.session?.access_token) {
      localStorage.setItem("token", data.session.access_token);
    }
    setSession(data.session);

    // Fetch trusted DB profile to check role match
    const profile = await fetchProfile();
    if (profile) {
      const actualRole = profile.role || "student";
      const actualStatus = profile.status || "active";

      if (actualRole !== targetRole) {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        localStorage.removeItem("token");
        const msg =
          actualRole === "teacher"
            ? "This account is registered as a Teacher. Please use Teacher Login."
            : "Your account is registered as Student. Please use Student Login.";
        setAuthError(msg);
        throw new Error(msg);
      }

      if (actualRole === "teacher" && actualStatus === "pending") {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        localStorage.removeItem("token");
        const msg = "Your teacher account is pending administrator approval.";
        setAuthError(msg);
        throw new Error(msg);
      }

      setRole(actualRole);
      localStorage.setItem("bg_user_role", actualRole);
    } else {
      localStorage.setItem("bg_user_role", targetRole);
      setRole(targetRole);
    }

    return data;
  };

  const register = async (email, password, full_name, targetRole = "student") => {
    setAuthError("");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          role: targetRole,
        },
      },
    });
    if (error) throw error;
    if (data.session) {
      if (data.session.access_token) {
        localStorage.setItem("token", data.session.access_token);
      }
      localStorage.setItem("bg_user_role", targetRole);
      setRole(targetRole);
      setSession(data.session);
      setUser(extractUserFromSession(data.session, targetRole));
      await fetchProfile();
    }
    return data;
  };

  const loginWithGoogle = async (targetRole = "student") => {
    setAuthError("");
    localStorage.removeItem("braingraph_demo_session");
    localStorage.setItem("bg_oauth_intent_role", targetRole);
    localStorage.setItem("bg_user_role", targetRole);
    setRole(targetRole);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin || "http://localhost:5173",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error) {
      console.error("Google OAuth Error:", error.message);
      throw error;
    }
    return data;
  };

  const requestPasswordReset = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return data;
  };

  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  };

  const updateProfile = async (updates) => {
    const res = await api.patch("/api/auth/me", updates);
    if (res.data) {
      setUser((prev) => ({ ...prev, ...res.data }));
    }
    return res.data;
  };

  const logout = async () => {
    localStorage.removeItem("braingraph_demo_session");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("bg_user_role");
    localStorage.removeItem("bg_oauth_intent_role");
    setAuthError("");
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        loading,
        authError,
        setAuthError,
        switchRole,
        login,
        register,
        loginWithGoogle,
        loginAsDemo,
        requestPasswordReset,
        updatePassword,
        updateProfile,
        logout,
        refetchProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
