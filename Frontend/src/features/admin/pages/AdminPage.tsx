"use client";

import { FormEvent, useState } from "react";

import Navbar from "@/components/layout/Navbar";
import AdminReservationsWorkspace from "@/features/admin/components/AdminReservationsWorkspace";
import { useAdminSession } from "@/features/admin/hooks/useAdminSession";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { admin, loading, error, signIn, signOut } = useAdminSession();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const success = await signIn(email, password);
    if (success) {
      setPassword("");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f4f0e8] px-6 pt-36 text-[#1e1e1e]">
        <Navbar showBookingButton={false} />
        <div className="mx-auto max-w-7xl">Chargement...</div>
      </main>
    );
  }

  if (!admin) {
    return (
      <main className="min-h-screen bg-[#f4f0e8] px-6 pt-36 text-[#1e1e1e]">
        <Navbar showBookingButton={false} />
        <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-md items-center justify-center">
          <div className="w-full rounded-[28px] border border-[#d8d0c2] bg-white p-8 shadow-sm">
            <h1 className="mb-2 text-3xl font-semibold text-[#1e1e1e]">Admin</h1>
            <p className="mb-6 text-sm text-[#6c675f]">
              Connectez-vous pour acceder au dashboard.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#1e1e1e]">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5 text-[#1e1e1e] outline-none transition focus:border-[#314835]"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="owner@auberge.com"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#1e1e1e]">
                  Mot de passe
                </label>
                <input
                  type="password"
                  className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5 text-[#1e1e1e] outline-none transition focus:border-[#314835]"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  required
                />
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <button
                type="submit"
                className="w-full rounded-xl bg-[#314835] px-4 py-3 font-medium text-white transition hover:bg-[#3a543d]"
              >
                Se connecter
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f0e8] px-6 pt-36 text-[#1e1e1e]">
      <Navbar showBookingButton={false} />
      <div className="mx-auto max-w-7xl">
        <AdminReservationsWorkspace admin={admin} onLogout={signOut} />
      </div>
    </main>
  );
}
