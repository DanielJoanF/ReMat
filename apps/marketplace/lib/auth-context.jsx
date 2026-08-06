"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const ROLES = ["GUEST", "CONSUMER", "DISTRIBUTOR", "ADMIN"];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRoleState] = useState("GUEST");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Real UUIDs from seeded database
    const DEMO_USERS = {
      CONSUMER:    { id: "a92f787e-298d-4f07-8bc1-15deab184789", name: "Agus Setiawan",     email: "cons1@remat.id" },
      DISTRIBUTOR: { id: "2e4ac8d1-f113-4eec-ac94-964469281649", name: "Budi Santoso",      email: "dist1@remat.id" },
      ADMIN:       { id: "682787fc-f33a-4c80-9aef-0b7012772017", name: "Super Admin ReMat", email: "admin@remat.id" },
    };

    const storedRole = localStorage.getItem("remat_user_role") || "GUEST";
    let storedUserId = localStorage.getItem("remat_user_id") || "";
    let storedName   = localStorage.getItem("remat_user_name") || "";

    // Auto-fix: if localStorage still has old dummy-* ID, replace with real UUID
    if (storedUserId.startsWith("dummy-") && DEMO_USERS[storedRole]) {
      storedUserId = DEMO_USERS[storedRole].id;
      storedName   = DEMO_USERS[storedRole].name;
      localStorage.setItem("remat_user_id",   storedUserId);
      localStorage.setItem("remat_user_name", storedName);
    }

    setRoleState(storedRole);
    if (storedRole !== "GUEST" && storedUserId) {
      setUser({
        id: storedUserId,
        name: storedName || "Demo User",
        email: DEMO_USERS[storedRole]?.email || `demo.${storedRole.toLowerCase()}@remat.id`,
        role: storedRole,
      });
    }
    setIsLoading(false);
  }, []);

  const setRole = (newRole) => {
    setRoleState(newRole);
    localStorage.setItem("remat_user_role", newRole);

    if (newRole === "GUEST") {
      setUser(null);
      localStorage.removeItem("remat_user_id");
      localStorage.removeItem("remat_user_name");
    } else {
      // Use real UUIDs from the seeded database so API calls succeed
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
      localStorage.setItem("remat_user_id", dummyUser.id);
      localStorage.setItem("remat_user_name", dummyUser.name);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, setRole, isLoading, ROLES }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
