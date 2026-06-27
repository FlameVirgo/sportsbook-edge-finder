import { createContext, useEffect, useState, type ReactNode } from "react";
import * as api from "../api/client";
import type { UserResponse } from "../types";

export type AuthModalMode = "login" | "signup";

export interface AuthContextValue {
  user: UserResponse | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  authModalOpen: boolean;
  authModalMode: AuthModalMode;
  openAuthModal: (mode?: AuthModalMode) => void;
  closeAuthModal: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>("login");

  function openAuthModal(mode: AuthModalMode = "login") {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  }

  function closeAuthModal() {
    setAuthModalOpen(false);
  }

  async function refreshUser() {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      return;
    }
    try {
      setUser(await api.getCurrentUser());
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadInitialUser() {
      await refreshUser();
      if (active) setLoading(false);
    }

    loadInitialUser();
    return () => {
      active = false;
    };
  }, []);

  async function login(email: string, password: string) {
    const { access_token } = await api.login(email, password);
    localStorage.setItem("token", access_token);
    await refreshUser();
    closeAuthModal();
  }

  async function signup(email: string, password: string) {
    const { access_token } = await api.signup(email, password);
    localStorage.setItem("token", access_token);
    await refreshUser();
    closeAuthModal();
  }

  async function loginWithGoogle(credential: string) {
    const { access_token } = await api.googleLogin(credential);
    localStorage.setItem("token", access_token);
    await refreshUser();
    closeAuthModal();
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        loginWithGoogle,
        logout,
        refreshUser,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
