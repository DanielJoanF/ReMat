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
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_USER: User = {
  id: 'dist-1',
  role: 'DISTRIBUTOR',
  name: 'Budi Distributor',
};

const STORAGE_KEY_USER_ID = 'x-user-id';
const STORAGE_KEY_USER_ROLE = 'x-user-role';
const STORAGE_KEY_USER_NAME = 'x-user-name';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Read user from localStorage on mount
    const storedId = localStorage.getItem(STORAGE_KEY_USER_ID);
    const storedRole = localStorage.getItem(STORAGE_KEY_USER_ROLE);
    const storedName = localStorage.getItem(STORAGE_KEY_USER_NAME);

    if (storedId && storedRole && storedName) {
      setUser({
        id: storedId,
        role: storedRole,
        name: storedName,
      });
    } else {
      // Set defaults
      localStorage.setItem(STORAGE_KEY_USER_ID, DEFAULT_USER.id);
      localStorage.setItem(STORAGE_KEY_USER_ROLE, DEFAULT_USER.role);
      localStorage.setItem(STORAGE_KEY_USER_NAME, DEFAULT_USER.name);
      setUser(DEFAULT_USER);
    }

    setIsLoading(false);
  }, []);

  const login = useCallback((userData: User) => {
    localStorage.setItem(STORAGE_KEY_USER_ID, userData.id);
    localStorage.setItem(STORAGE_KEY_USER_ROLE, userData.role);
    localStorage.setItem(STORAGE_KEY_USER_NAME, userData.name);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_USER_ID);
    localStorage.removeItem(STORAGE_KEY_USER_ROLE);
    localStorage.removeItem(STORAGE_KEY_USER_NAME);
    setUser(null);
  }, []);

  const switchRole = useCallback(
    (role: string) => {
      if (user) {
        const updatedUser = { ...user, role };
        localStorage.setItem(STORAGE_KEY_USER_ROLE, role);
        setUser(updatedUser);
      }
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, switchRole, login, logout, isLoading }}>
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