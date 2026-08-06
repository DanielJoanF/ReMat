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

const DEFAULT_USER: User = {
  id: 'd0eaec45-b110-463f-8b9d-6c0a17bf0853', // Budi Santoso (dist1) — real DB user
  role: 'DISTRIBUTOR',
  name: 'Budi Santoso',
};

const STORAGE_KEY_USER_ID = 'x-user-id';
const STORAGE_KEY_USER_ROLE = 'x-user-role';
const STORAGE_KEY_USER_NAME = 'x-user-name';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Read user from localStorage on mount
    const storedId = localStorage.getItem(STORAGE_KEY_USER_ID);
    const storedRole = localStorage.getItem(STORAGE_KEY_USER_ROLE);
    const storedName = localStorage.getItem(STORAGE_KEY_USER_NAME);

    // Migrate stale legacy IDs (e.g. old 'dist-1' string) to real DB user UUID.
    // The old frontend stored a non-UUID id like 'dist-1'. Treat any id that is
    // not a UUID as legacy and remap to the real seeded distributor (Budi Santoso).
    const UUID_RE =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isLegacyId = storedId && !UUID_RE.test(storedId);
    const effectiveId = isLegacyId ? DEFAULT_USER.id : storedId;
    const effectiveRole = isLegacyId ? DEFAULT_USER.role : storedRole;
    const effectiveName = isLegacyId ? DEFAULT_USER.name : storedName;

    if (effectiveId && effectiveRole && effectiveName) {
      localStorage.setItem(STORAGE_KEY_USER_ID, effectiveId);
      localStorage.setItem(STORAGE_KEY_USER_ROLE, effectiveRole);
      localStorage.setItem(STORAGE_KEY_USER_NAME, effectiveName);
      setUser({
        id: effectiveId,
        role: effectiveRole,
        name: effectiveName,
      });
    } else {
      // Set defaults
      localStorage.setItem(STORAGE_KEY_USER_ID, DEFAULT_USER.id);
      localStorage.setItem(STORAGE_KEY_USER_ROLE, DEFAULT_USER.role);
      localStorage.setItem(STORAGE_KEY_USER_NAME, DEFAULT_USER.name);
      setUser(DEFAULT_USER);
    }

    setIsReady(true);
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