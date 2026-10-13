import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken, setUnauthorizedHandler } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  useEffect(() => {
    if (!getToken()) return;
    api("/auth/me")
      .then(setUser)
      .catch((e) => {
        if (e.status === 401) setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const finishAuth = (data) => {
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const login = useCallback(
    async (email, password) => finishAuth(await api("/auth/login", { method: "POST", body: { email, password }, auth: false })),
    []
  );

  const register = useCallback(
    async (full_name, email, password) =>
      finishAuth(await api("/auth/register", { method: "POST", body: { full_name, email, password }, auth: false })),
    []
  );

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
