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
};

export default function AdminSystemLogsView({ onSelectBooking }: Props) {
  const [logs, setLogs] = useState<AdminSystemLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadLogs() {
      setLoading(true);
      setError("");

      try {
        const data = await getAdminSystemLogs(150);
        if (!ignore) setLogs(data);
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

  return (
    <section className="overflow-hidden rounded-[22px] border border-[#d8d0c2] bg-white shadow-sm">
      <div className="border-b border-[#ece5d8] px-5 py-5">
        <h2 className="text-[2rem] font-semibold leading-none text-[#1e1e1e]">
          Journal des réservations
        </h2>

   
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
          {logs.map((log, index) => (
            <LogRow
              key={log.id}
              log={log}
              onSelectBooking={onSelectBooking}
              hasBorder={index !== logs.length - 1}
            />
          ))}
        </div>
      )}
    </section>
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
  const config = LOG_CONFIG[log.type];
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

  if (type === "website_booking_failed") {
    return "border-[#D9A520] bg-[#D9A520] text-white";
  }

  if (type === "admin_booking_deleted") {
    return "border-[#8C1D18] bg-[#8C1D18] text-white";
  }

  if (type === "booking_check_in") {
    return "border-[#0B8043] bg-[#0B8043] text-white";
  }

  return "border-[#616161] bg-[#616161] text-white";
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

  if (
    log.type === "admin_booking_deleted" ||
    log.type === "booking_check_in" ||
    log.type === "booking_check_out"
  ) {
    return {
      main: client ? `Client : ${client}` : cleanAdminMessage(log.message),
      secondary: "",
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

  return bookingIds[0] ?? null;
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
    .replace("Réservation supprimée via le panel admin", "Suppression")
    .trim();
}

function getMetadata(log: AdminSystemLogDto) {
  if (!log.metadata || typeof log.metadata !== "object") {
    return {} as Record<string, unknown>;
  }

  return log.metadata as Record<string, unknown>;
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