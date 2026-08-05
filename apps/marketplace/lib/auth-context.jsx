"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const ROLES = ["GUEST", "CONSUMER", "DISTRIBUTOR", "ADMIN"];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRoleState] = useState("GUEST");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage on mount
    const storedRole = localStorage.getItem("remat_user_role") || "GUEST";
    const storedUserId = localStorage.getItem("remat_user_id") || "";
    const storedName = localStorage.getItem("remat_user_name") || "";

    setRoleState(storedRole);
    if (storedRole !== "GUEST" && storedUserId) {
      setUser({
        id: storedUserId,
        name: storedName || "Demo User",
        email: `demo.${storedRole.toLowerCase()}@remat.id`,
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
      const dummyUser = {
        id: `dummy-${newRole.toLowerCase()}-001`,
        name: newRole === "CONSUMER" ? "Budi Santoso" : newRole === "DISTRIBUTOR" ? "PT. Recycle Hub" : "Admin ReMat",
        email: `demo.${newRole.toLowerCase()}@remat.id`,
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
