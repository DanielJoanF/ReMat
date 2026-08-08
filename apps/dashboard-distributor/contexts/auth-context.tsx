'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

interface User {
  id: string;
  role: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  switchRole: (role: string) => void;
  login: (user: User) => void;
  logout: () => void;
  isReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER_ID = 'x-user-id';
const STORAGE_KEY_USER_ROLE = 'x-user-role';
const STORAGE_KEY_USER_NAME = 'x-user-name';

// URL halaman login. Di production pakai env; dev default login app (3003).
const LOGIN_URL =
  process.env.NEXT_PUBLIC_LOGIN_URL || 'http://localhost:3003/';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 1. Process URL query parameters for session transfer
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const sessionName = params.get('session_name');
    const sessionRole = params.get('session_role');

    if (sessionId && sessionName && sessionRole) {
      sessionStorage.setItem(STORAGE_KEY_USER_ID, sessionId);
      sessionStorage.setItem(STORAGE_KEY_USER_NAME, sessionName);
      sessionStorage.setItem(STORAGE_KEY_USER_ROLE, sessionRole);

      // Clean query params from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }

    // 2. Read session from sessionStorage
    const storedId = sessionStorage.getItem(STORAGE_KEY_USER_ID);
    const storedRole = sessionStorage.getItem(STORAGE_KEY_USER_ROLE);
    const storedName = sessionStorage.getItem(STORAGE_KEY_USER_NAME);

    // Enforce that the user is logged in and is a DISTRIBUTOR
    if (!storedId || storedRole !== 'DISTRIBUTOR') {
      window.location.href = LOGIN_URL;
      return;
    }

    setUser({
      id: storedId,
      role: storedRole,
      name: storedName || 'Distributor User',
    });
    setIsReady(true);
  }, []);

  const login = useCallback((userData: User) => {
    sessionStorage.setItem(STORAGE_KEY_USER_ID, userData.id);
    sessionStorage.setItem(STORAGE_KEY_USER_ROLE, userData.role);
    sessionStorage.setItem(STORAGE_KEY_USER_NAME, userData.name);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY_USER_ID);
    sessionStorage.removeItem(STORAGE_KEY_USER_ROLE);
    sessionStorage.removeItem(STORAGE_KEY_USER_NAME);
    setUser(null);
    window.location.href = `${LOGIN_URL}?logout=true`;
  }, []);

  const switchRole = useCallback(
    (role: string) => {
      if (user) {
        const updatedUser = { ...user, role };
        sessionStorage.setItem(STORAGE_KEY_USER_ROLE, role);
        setUser(updatedUser);
      }
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, switchRole, login, logout, isReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export type { User, AuthContextType };