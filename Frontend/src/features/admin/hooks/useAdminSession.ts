"use client";

import { useEffect, useState } from "react";

import { getMe, loginAdmin } from "@/features/admin/api/auth.api";
import {
  getStoredAdminToken,
  removeStoredAdminToken,
  setStoredAdminToken,
} from "@/features/admin/lib/admin-auth";

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
      const token = getStoredAdminToken();

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const me = await getMe(token);
        setAdmin(me);
      } catch {
        removeStoredAdminToken();
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
      setStoredAdminToken(data.accessToken);
      setAdmin(data.admin);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion.");
      return false;
    }
  }

  function signOut() {
    removeStoredAdminToken();
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
