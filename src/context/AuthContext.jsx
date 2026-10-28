import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { checkAdminAccess, getSession, signIn, signOut, subscribeToAuthChanges } from "../api/auth";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [adminAccess, setAdminAccess] = useState(null);
  const online = useOnlineStatus();

  useEffect(() => {
    let mounted = true;
    let receivedAuthEvent = false;

    getSession().then((next) => {
      if (!mounted || receivedAuthEvent) return;
      setSession(next);
      setAuthLoading(false);
    }).catch(() => {
      if (!mounted || receivedAuthEvent) return;
      setSession(null);
      setAuthLoading(false);
    });

    const unsubscribe = subscribeToAuthChanges((_event, next) => {
      if (!mounted) return;
      receivedAuthEvent = true;
      setSession(next);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Run outside the Auth callback to avoid nested Supabase/Auth lock requests.
  useEffect(() => {
    if (!session) {
      setAdminAccess(null);
      return;
    }
    if (!online) {
      // Keep an already verified editor mounted so an open draft is not lost.
      setAdminAccess((current) => current?.session === session ? current : {
        session,
        isAdmin: false,
        error: "Нет соединения с интернетом. Проверка прав возобновится после подключения.",
      });
      return;
    }
    let cancelled = false;

    async function checkAccess() {
      try {
        const isAdmin = await checkAdminAccess();
        if (!cancelled) {
          setAdminAccess({ session, isAdmin, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setAdminAccess({
            session,
            isAdmin: false,
            error: error.message || "Не удалось проверить права доступа. Попробуйте войти снова или обратитесь к администратору.",
          });
        }
      }
    }

    checkAccess();
    return () => {
      cancelled = true;
    };
  }, [session, online]);

  const accessReady = adminAccess?.session === session;
  const loading = authLoading || Boolean(session && !accessReady);
  const isAdmin = Boolean(session && accessReady && adminAccess?.isAdmin);
  const accessError = accessReady ? adminAccess?.error : null;

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      isAdmin,
      accessError,
      signIn,
      signOut,
    }),
    [session, loading, isAdmin, accessError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
