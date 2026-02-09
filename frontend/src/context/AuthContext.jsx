import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getMeRequest, loginRequest, signupRequest } from "../api/endpoints";
import { setAuthToken } from "../api/client";

const AuthContext = createContext(null);

const STORAGE_KEY = "restaurant_auth";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      setToken(parsed.token);
      setUser(parsed.user);
      setAuthToken(parsed.token);
    }
  }, []);

  const persist = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    setAuthToken(nextToken);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: nextToken, user: nextUser }));
  };

  const updateUser = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user: nextUser }));
  };

  const login = async (payload) => {
    const { data } = await loginRequest(payload);
    persist(data.token, data.user);
    return data.user;
  };

  const signup = async (payload) => {
    const { data } = await signupRequest(payload);
    persist(data.token, data.user);
    return data.user;
  };

  const refreshMe = async () => {
    const { data } = await getMeRequest();
    updateUser(data);
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      login,
      signup,
      logout,
      updateUser,
      refreshMe
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
