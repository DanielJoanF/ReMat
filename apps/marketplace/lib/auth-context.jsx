"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const AuthContext = createContext(null);

const ROLES = ["GUEST", "CONSUMER", "DISTRIBUTOR", "ADMIN"];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRoleState] = useState("GUEST");
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // Load session from sessionStorage on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("logout") === "true") {
      sessionStorage.removeItem("remat_user_id");
      sessionStorage.removeItem("remat_user_name");
      sessionStorage.removeItem("remat_user_role");
      sessionStorage.removeItem("remat_user_email");

      // Clean query params from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      setRoleState("GUEST");
      setUser(null);
      setIsLoading(false);
      return;
    }

    const storedRole = sessionStorage.getItem("remat_user_role") || "GUEST";
    const storedUserId = sessionStorage.getItem("remat_user_id") || "";
    const storedName = sessionStorage.getItem("remat_user_name") || "";
    const storedEmail = sessionStorage.getItem("remat_user_email") || "";

    setRoleState(storedRole);
    if (storedRole !== "GUEST" && storedUserId) {
      setUser({
        id: storedUserId,
        name: storedName,
        email: storedEmail,
        role: storedRole,
      });
    }
    setIsLoading(false);
  }, []);

  // Enforce role-based routing checks on pathname changes
  useEffect(() => {
    if (isLoading) return;

    // Check if role is DISTRIBUTOR or ADMIN and redirect to their respective portals
    if (role === "DISTRIBUTOR") {
      const url = `http://localhost:3002/?session_id=${user?.id}&session_name=${encodeURIComponent(user?.name || "")}&session_role=DISTRIBUTOR`;
      window.location.href = url;
    } else if (role === "ADMIN") {
      const url = `http://localhost:3001/?session_id=${user?.id}&session_name=${encodeURIComponent(user?.name || "")}&session_role=ADMIN`;
      window.location.href = url;
    }
  }, [role, user, isLoading, pathname]);

  const login = async (email, password) => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || "Gagal masuk");
    }

    const loggedInUser = data.data;
    sessionStorage.setItem("remat_user_id", loggedInUser.id);
    sessionStorage.setItem("remat_user_name", loggedInUser.name);
    sessionStorage.setItem("remat_user_role", loggedInUser.role);
    sessionStorage.setItem("remat_user_email", loggedInUser.email);

    setUser(loggedInUser);
    setRoleState(loggedInUser.role);

    return loggedInUser;
  };

  const register = async (name, email, address, phone, password, role) => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, address, phone, password, role }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || "Gagal mendaftar");
    }

    return data.data;
  };

  const logout = () => {
    sessionStorage.removeItem("remat_user_id");
    sessionStorage.removeItem("remat_user_name");
    sessionStorage.removeItem("remat_user_role");
    sessionStorage.removeItem("remat_user_email");

    setUser(null);
    setRoleState("GUEST");
    router.push("/");
  };

  // Keep compatibility for role switcher in navbar, but make it work with sessionStorage
  const setRole = (newRole) => {
    setRoleState(newRole);
    sessionStorage.setItem("remat_user_role", newRole);

    if (newRole === "GUEST") {
      setUser(null);
      sessionStorage.removeItem("remat_user_id");
      sessionStorage.removeItem("remat_user_name");
      sessionStorage.removeItem("remat_user_email");
    } else {
      const DEMO_USERS = {
        CONSUMER:    { id: "a92f787e-298d-4f07-8bc1-15deab184789", name: "Agus Setiawan",        email: "cons1@remat.id" },
        DISTRIBUTOR: { id: "2e4ac8d1-f113-4eec-ac94-964469281649", name: "Budi Santoso",         email: "dist1@remat.id" },
        ADMIN:       { id: "682787fc-f33a-4c80-9aef-0b7012772017", name: "Super Admin ReMat",    email: "admin@remat.id" },
      };
      const demo = DEMO_USERS[newRole] || { id: `unknown-${newRole}`, name: newRole, email: "" };
      const dummyUser = {
        id: demo.id,
        name: demo.name,
        email: demo.email,
        role: newRole,
      };
      setUser(dummyUser);
      sessionStorage.setItem("remat_user_id", dummyUser.id);
      sessionStorage.setItem("remat_user_name", dummyUser.name);
      sessionStorage.setItem("remat_user_email", dummyUser.email);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, setRole, login, register, logout, isLoading, ROLES }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
