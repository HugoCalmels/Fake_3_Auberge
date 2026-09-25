"use client";

import { useEffect, useState } from "react";

import { getMe, loginAdmin, logoutAdmin } from "@/features/admin/api/auth.api";

type Admin = {
  id: string;
  email: string;
  role: string;
};

export function useAdminSession() {
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function init() {
      try {
        const me = await getMe();
        setAdmin(me);
      } catch {
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  async function signIn(email: string, password: string) {
    setError("");

    try {
      const data = await loginAdmin({ email, password });
      setAdmin(data.admin);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion.");
      return false;
    }
  }

  function signOut() {
    void logoutAdmin();
    setAdmin(null);
    setError("");
  }

  return {
    admin,
    loading,
    error,
    signIn,
    signOut,
  };
}
