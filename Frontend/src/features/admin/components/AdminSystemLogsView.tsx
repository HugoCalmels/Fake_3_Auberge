"use client";

import { useEffect, useState } from "react";
import { getAdminSystemLogs } from "@/features/admin/api/adminSystemLogs.api";
import type {
  AdminSystemLogDto,
  AdminSystemLogType,
} from "@/features/admin/types";

type Props = {
  onSelectBooking?: (bookingId: string) => void;
};

const PAGE_SIZE = 50;
const LOG_FETCH_LIMIT = 500;

const FALLBACK_LOG_CONFIG = {
  title: "Évènement réservation",
  badge: "Journal",
  dot: "bg-[#8a847b]",
};

const LOG_CONFIG: Record<
  AdminSystemLogType,
  {
    title: string;
    badge: string;
    dot: string;
  }
> = {
  website_booking_validated: {
    title: "Réservation depuis le site validée",
    badge: "Réservée",
    dot: "bg-[#3F51B5]",
  },
  website_booking_failed: {
    title: "Réservation depuis le site échouée",
    badge: "Échec",
    dot: "bg-[#D9A520]",
  },
  admin_booking_created: {
    title: "Réservation créée via le panel admin",
    badge: "Réservée",
    dot: "bg-[#3F51B5]",
  },
  admin_booking_updated: {
    title: "Réservation modifiée via le panel admin",
    badge: "Modifiée",
    dot: "bg-[#D9A520]",
  },
  admin_booking_deleted: {
    title: "Réservation supprimée via le panel admin",
    badge: "Supprimée",
    dot: "bg-[#8C1D18]",
  },
  booking_check_in: {
    title: "Check-in réservation",
    badge: "Arrivé",
    dot: "bg-[#0B8043]",
  },
  booking_check_out: {
    title: "Check-out réservation",
    badge: "Parti",
    dot: "bg-[#616161]",
  },
  booking_no_show: {
    title: "Client marqué pas venu",
    badge: "Pas venu",
    dot: "bg-[#D96A3A]",
  },
  booking_cancelled: {
    title: "Réservation annulée via le panel admin",
    badge: "Annulée",
    dot: "bg-[#8C1D18]",
  },
};

export default function AdminSystemLogsView({ onSelectBooking }: Props) {
  const [logs, setLogs] = useState<AdminSystemLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let ignore = false;

    async function loadLogs() {
      setLoading(true);
      setError("");

      try {
        const data = await getAdminSystemLogs(LOG_FETCH_LIMIT);

        if (!ignore) {
          setLogs(data);
          setPage(1);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err instanceof Error
              ? err.message
              : "Impossible de charger le journal.",
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadLogs();

    return () => {
      ignore = true;
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageEnd = pageStart + PAGE_SIZE;
  const visibleLogs = logs.slice(pageStart, pageEnd);

  function goToPreviousPage() {
    setPage((current) => Math.max(1, current - 1));
  }

  function goToNextPage() {
    setPage((current) => Math.min(totalPages, current + 1));
  }

  return (
    <section className="overflow-hidden rounded-[22px] border border-[#d8d0c2] bg-white shadow-sm">
      <div className="border-b border-[#ece5d8] px-5 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[2rem] font-semibold leading-none text-[#1e1e1e]">
              Activités
            </h2>

            {!loading && !error && logs.length > 0 ? (
              <p className="mt-2 text-sm text-[#6c675f]">
                {logs.length} évènement{logs.length > 1 ? "s" : ""} chargé
                {logs.length > 1 ? "s" : ""} · {PAGE_SIZE} par page
              </p>
            ) : null}
          </div>

          {!loading && !error && logs.length > PAGE_SIZE ? (
            <PaginationControls
              page={safePage}
              totalPages={totalPages}
              from={pageStart + 1}
              to={Math.min(pageEnd, logs.length)}
              total={logs.length}
              onPrevious={goToPreviousPage}
              onNext={goToNextPage}
            />
          ) : null}
        </div>
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
        <div>
          {visibleLogs.map((log, index) => (
            <LogRow
              key={log.id}
              log={log}
              onSelectBooking={onSelectBooking}
              hasBorder={index !== visibleLogs.length - 1}
            />
          ))}

          {logs.length > PAGE_SIZE ? (
            <div className="border-t border-[#ece5d8] px-5 py-4">
              <PaginationControls
                page={safePage}
                totalPages={totalPages}
                from={pageStart + 1}
                to={Math.min(pageEnd, logs.length)}
                total={logs.length}
                onPrevious={goToPreviousPage}
                onNext={goToNextPage}
              />
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

function PaginationControls({
  page,
  totalPages,
  from,
  to,
  total,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  from: number;
  to: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-[#6c675f]">
      <span className="font-medium text-[#1e1e1e]">
        {from}–{to}
      </span>
      <span>sur {total}</span>
      <span className="hidden text-[#b7ae9f] sm:inline">·</span>
      <span>
        page {page} / {totalPages}
      </span>

      <div className="ml-0 flex items-center gap-2 sm:ml-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={onPrevious}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#d8d0c2] bg-white text-[#314835] transition hover:bg-[#faf6ef] disabled:cursor-not-allowed disabled:opacity-45"
          aria-label="Page précédente"
        >
          ←
        </button>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={onNext}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#d8d0c2] bg-white text-[#314835] transition hover:bg-[#faf6ef] disabled:cursor-not-allowed disabled:opacity-45"
          aria-label="Page suivante"
        >
          →
        </button>
      </div>
    </div>
  );
}

function LogRow({
  log,
  onSelectBooking,
  hasBorder,
}: {
  log: AdminSystemLogDto;
  onSelectBooking?: (bookingId: string) => void;
  hasBorder: boolean;
}) {
  const config = LOG_CONFIG[log.type] ?? FALLBACK_LOG_CONFIG;
  const date = formatDateParts(log.createdAt);
  const details = getLogDetails(log);
  const bookingId = getOpenableBookingId(log);

  return (
    <article
      className={`group grid w-full gap-5 px-5 py-5 text-left transition hover:bg-[#fcfaf7] xl:grid-cols-[minmax(0,1.5fr)_150px_170px_150px] ${
        hasBorder ? "border-b border-[#ece5d8]" : ""
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-start gap-3">
          <span
            className={`mt-1 h-3 w-3 shrink-0 rounded-[4px] ${config.dot}`}
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-[1.05rem] font-semibold text-[#1e1e1e]">
              {config.title}
            </p>

            {details.main ? (
              <p className="mt-2 text-sm leading-6 text-[#4f4a43]">
                {details.main}
              </p>
            ) : null}

            {details.secondary ? (
              <p className="mt-1 text-sm leading-6 text-[#6c675f]">
                {details.secondary}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-start xl:justify-end">
        <StatusBadge label={config.badge} type={log.type} />
      </div>

      <div className="xl:text-right">
        <p className="text-base font-bold text-[#1e1e1e]">{date.date}</p>
        <p className="mt-1 text-sm font-bold text-[#1e1e1e]">{date.time}</p>
      </div>

      <div className="flex items-center xl:justify-end">
        {bookingId && onSelectBooking ? (
          <button
            type="button"
            onClick={() => onSelectBooking(bookingId)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#d8d0c2] px-4 py-2 text-sm font-medium text-[#314835] transition group-hover:border-[#314835] group-hover:bg-[#faf6ef]"
          >
            <span>Ouvrir</span>
            <span aria-hidden="true">→</span>
          </button>
        ) : null}
      </div>
    </article>
  );
}

function StatusBadge({
  label,
  type,
}: {
  label: string;
  type: AdminSystemLogType;
}) {
  const classes = getBadgeClasses(type);

  return (
    <span
      className={`inline-flex shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}

function getBadgeClasses(type: AdminSystemLogType) {
  if (
    type === "website_booking_validated" ||
    type === "admin_booking_created"
  ) {
    return "border-[#3F51B5] bg-[#3F51B5] text-white";
  }

  if (
    type === "website_booking_failed" ||
    type === "admin_booking_updated"
  ) {
    return "border-[#D9A520] bg-[#D9A520] text-white";
  }

  if (
    type === "admin_booking_deleted" ||
    type === "booking_cancelled"
  ) {
    return "border-[#8C1D18] bg-[#8C1D18] text-white";
  }

  if (type === "booking_check_in") {
    return "border-[#0B8043] bg-[#0B8043] text-white";
  }

  if (type === "booking_no_show") {
    return "border-[#D96A3A] bg-[#D96A3A] text-white";
  }

  if (type === "booking_check_out") {
    return "border-[#616161] bg-[#616161] text-white";
  }

  return "border-[#8a847b] bg-[#8a847b] text-white";
}

function getLogDetails(log: AdminSystemLogDto) {
  const metadata = getMetadata(log);

  const guestName = getString(metadata.guestName);
  const guestEmail = getString(metadata.guestEmail);
  const totalPrice = getNumber(metadata.totalPrice);
  const amount = getNumber(metadata.amount);
  const bookingIds = getStringArray(metadata.bookingIds);
  const roomCount = bookingIds.length || undefined;
  const client = guestName || guestEmail;

  if (log.type === "website_booking_validated") {
    return {
      main: formatBookingSummary(roomCount, amount ? amount / 100 : totalPrice),
      secondary: client ? `Client : ${client}` : "",
    };
  }

  if (log.type === "website_booking_failed") {
    return {
      main: cleanFailureMessage(log.message),
      secondary: client ? `Client : ${client}` : "",
    };
  }

  if (log.type === "admin_booking_created") {
    return {
      main: formatBookingSummary(roomCount, totalPrice),
      secondary: client ? `Client : ${client}` : "",
    };
  }

  if (log.type === "admin_booking_updated") {
    return {
      main: client ? `Client : ${client}` : cleanAdminMessage(log.message),
      secondary: formatUpdateDetails(metadata, log.message),
    };
  }

  if (
    log.type === "admin_booking_deleted" ||
    log.type === "booking_check_in" ||
    log.type === "booking_check_out" ||
    log.type === "booking_no_show" ||
    log.type === "booking_cancelled"
  ) {
    return {
      main: client ? `Client : ${client}` : cleanAdminMessage(log.message),
      secondary: formatUpdateDetails(metadata, log.message),
    };
  }

  return {
    main: cleanAdminMessage(log.message),
    secondary: "",
  };
}

function getOpenableBookingId(log: AdminSystemLogDto) {
  if (log.bookingId) return log.bookingId;

  const metadata = getMetadata(log);
  const bookingIds = getStringArray(metadata.bookingIds);
  const bookingId = getString(metadata.bookingId);

  return log.type === "admin_booking_deleted"
    ? null
    : bookingId || bookingIds[0] || null;
}

function formatBookingSummary(roomCount?: number, totalPrice?: number) {
  const parts: string[] = [];

  if (roomCount) {
    parts.push(`${roomCount} chambre${roomCount > 1 ? "s" : ""}`);
  }

  if (typeof totalPrice === "number") {
    parts.push(formatPrice(totalPrice));
  }

  return parts.join(" • ");
}

function formatUpdateDetails(
  metadata: Record<string, unknown>,
  message?: string | null,
) {
  const changes = getChangeArray(metadata.changes);

  if (changes.length) {
    return changes
      .map((change) => {
        if (change.from !== undefined && change.to !== undefined) {
          return `${change.label} : ${String(change.from)} → ${String(
            change.to,
          )}`;
        }

        return change.label;
      })
      .join(" • ");
  }

  const previousStatus = getString(metadata.previousStatus);
  const nextStatus = getString(metadata.nextStatus);
  const previousPaymentStatus = getString(metadata.previousPaymentStatus);
  const nextPaymentStatus = getString(metadata.nextPaymentStatus);

  const parts: string[] = [];

  if (previousStatus && nextStatus && previousStatus !== nextStatus) {
    parts.push(
      `Statut : ${formatStatusLabel(previousStatus)} → ${formatStatusLabel(
        nextStatus,
      )}`,
    );
  }

  if (
    previousPaymentStatus &&
    nextPaymentStatus &&
    previousPaymentStatus !== nextPaymentStatus
  ) {
    parts.push(
      `Paiement : ${formatPaymentLabel(
        previousPaymentStatus,
      )} → ${formatPaymentLabel(nextPaymentStatus)}`,
    );
  }

  if (!parts.length) {
    return cleanAdminMessage(message);
  }

  return parts.join(" • ");
}

function cleanFailureMessage(message?: string | null) {
  if (!message) return "";

  return message
    .replace("Réservation depuis le site échouée :", "Cause :")
    .trim();
}

function cleanAdminMessage(message?: string | null) {
  if (!message) return "";

  return message
    .replace("Réservation créée via le panel admin.", "")
    .replace("Réservation modifiée via le panel admin", "Modification")
    .replace("Réservation supprimée via le panel admin", "Suppression")
    .replace("Réservation annulée via le panel admin", "Annulation")
    .trim();
}

function formatStatusLabel(value: string) {
  if (value === "pending") return "En attente";
  if (value === "confirmed") return "Réservée";
  if (value === "checked_in") return "Arrivé";
  if (value === "checked_out") return "Parti";
  if (value === "no_show") return "Pas venu";
  if (value === "cancelled") return "Annulée";

  return value;
}

function formatPaymentLabel(value: string) {
  if (value === "paid") return "Payé";
  if (value === "unpaid") return "Non payé";

  return value;
}

function getMetadata(log: AdminSystemLogDto) {
  if (!log.metadata || typeof log.metadata !== "object") {
    return {} as Record<string, unknown>;
  }

  return log.metadata as Record<string, unknown>;
}

function getChangeArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const record = item as Record<string, unknown>;
    const label = getString(record.label);

    if (!label) {
      return [];
    }

    return [
      {
        field: getString(record.field),
        label,
        from: record.from as string | number | null | undefined,
        to: record.to as string | number | null | undefined,
      },
    ];
  });
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function getNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function getStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function formatDateParts(value: string) {
  const date = new Date(value);

  return {
    date: date.toLocaleDateString("fr-FR"),
    time: date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}
