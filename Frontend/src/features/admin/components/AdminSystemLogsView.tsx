"use client";

import { useEffect, useState } from "react";
import { getAdminSystemLogs } from "@/features/admin/api/adminSystemLogs.api";
import type { AdminSystemLogDto, AdminSystemLogLevel } from "@/features/admin/types";

export default function AdminSystemLogsView() {
  const [logs, setLogs] = useState<AdminSystemLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadLogs() {
      setLoading(true);
      setError("");

      try {
        const data = await getAdminSystemLogs(150);

        if (!ignore) {
          setLogs(data);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err instanceof Error
              ? err.message
              : "Impossible de charger le journal système.",
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadLogs();

    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  return (
    <section className="overflow-hidden rounded-[22px] border border-[#d8d0c2] bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-[#e7dfd2] px-5 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#1e1e1e]">
            Journal système
          </h2>

          <p className="mt-2 max-w-[680px] text-sm leading-6 text-[#6c675f]">
            Suivi des paiements Stripe, réservations, erreurs, nettoyages
            automatiques et évènements importants.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          className="w-fit cursor-pointer rounded-full border border-[#d8d0c2] bg-white px-4 py-2 text-sm font-medium text-[#314835] transition hover:bg-[#eee6da]"
        >
          Rafraîchir
        </button>
      </div>

      {loading ? (
        <div className="px-5 py-8 text-sm text-[#6c675f]">
          Chargement du journal...
        </div>
      ) : error ? (
        <div className="px-5 py-8 text-sm text-red-700">{error}</div>
      ) : logs.length === 0 ? (
        <div className="px-5 py-8 text-sm text-[#6c675f]">
          Aucun évènement disponible.
        </div>
      ) : (
        <div className="divide-y divide-[#efe7db]">
          {logs.map((log) => (
            <LogRow key={log.id} log={log} />
          ))}
        </div>
      )}
    </section>
  );
}

function LogRow({ log }: { log: AdminSystemLogDto }) {
  return (
    <article className="px-5 py-4">
      <div className="flex flex-col gap-3 xl:grid xl:grid-cols-[150px_minmax(0,1fr)_180px] xl:items-start">
        <div className="flex items-center gap-2">
          <LevelBadge level={log.level} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-[#1e1e1e]">
              {formatLogType(log.type)}
            </p>

            <code className="rounded-full bg-[#f7f3ec] px-2 py-1 text-[11px] text-[#756f67]">
              {log.type}
            </code>
          </div>

          <p className="mt-2 text-sm leading-6 text-[#4f4a43]">
            {log.message}
          </p>

          {log.bookingId ? (
            <p className="mt-2 text-xs text-[#8a847b]">
              Réservation liée :{" "}
              <span className="font-mono text-[#314835]">{log.bookingId}</span>
            </p>
          ) : null}

          {log.metadata ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.12em] text-[#8a847b]">
                Détails techniques
              </summary>

              <pre className="mt-2 max-h-[260px] overflow-auto rounded-[14px] border border-[#e8dfd2] bg-[#fcfaf7] p-3 text-xs leading-5 text-[#5f584d]">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </details>
          ) : null}
        </div>

        <p className="text-left text-xs text-[#8a847b] xl:text-right">
          {formatDateTime(log.createdAt)}
        </p>
      </div>
    </article>
  );
}

function LevelBadge({ level }: { level: AdminSystemLogLevel }) {
  const styles: Record<AdminSystemLogLevel, string> = {
    info: "bg-[#dff3e4] text-[#206a3b]",
    warn: "bg-[#fff1d6] text-[#9a6700]",
    error: "bg-[#fde4e4] text-[#a12828]",
  };

  const labels: Record<AdminSystemLogLevel, string> = {
    info: "Info",
    warn: "Alerte",
    error: "Erreur",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${styles[level]}`}
    >
      {labels[level]}
    </span>
  );
}

function formatLogType(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}