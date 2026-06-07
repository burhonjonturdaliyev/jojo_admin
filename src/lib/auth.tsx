import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  adminLogin as apiLogin,
  adminLogout as apiLogout,
  adminMe,
  clearTokens,
  getAccessToken,
} from "./api";

export interface AdminUser {
  id: number;
  phone: string | null;
  username: string;
  full_name: string;
  is_superuser: boolean;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AdminUser | null;
  errorMessage: string | null;
  login: (phone: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => !!getAccessToken());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sahifa qayta yuklanganda saqlangan token bilan profilini olamiz.
  useEffect(() => {
    if (!getAccessToken()) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await adminMe();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) {
          clearTokens();
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (phone: string, password: string): Promise<boolean> => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const profile = await apiLogin(phone, password);
        setUser(profile);
        return true;
      } catch (err) {
        const msg =
          (err as { message?: string }).message ||
          "Login muvaffaqiyatsiz tugadi";
        setErrorMessage(msg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: !!user,
      isLoading,
      user,
      errorMessage,
      login,
      logout,
    }),
    [user, isLoading, errorMessage, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
