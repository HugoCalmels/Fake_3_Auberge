"use client";

import type { AdminWorkspacePanel } from "@/features/admin/types";

type Props = {
  panel: AdminWorkspacePanel;
  onChange: (panel: AdminWorkspacePanel) => void;
};

export default function AdminReservationsSidebar({
  panel,
  onChange,
}: Props) {
  return (
    <aside className="rounded-[20px] border border-[#d8d0c2] bg-white p-4 shadow-sm">
      <div className="space-y-6">
        <SidebarSection title="Réservations">
          <SidebarButton
            label="Dashboard"
            active={panel === "reservations-dashboard"}
            onClick={() => onChange("reservations-dashboard")}
          />
          <SidebarButton
            label="À venir"
            active={panel === "bookings-upcoming"}
            onClick={() => onChange("bookings-upcoming")}
          />
          <SidebarButton
            label="En cours"
            active={panel === "bookings-current"}
            onClick={() => onChange("bookings-current")}
          />
          <SidebarButton
            label="Historique"
            active={panel === "bookings-history"}
            onClick={() => onChange("bookings-history")}
          />
        </SidebarSection>

        <SidebarSection title="Gestion">
          <SidebarButton
            label="Chambres"
            active={panel === "rooms"}
            onClick={() => onChange("rooms")}
          />
          <SidebarButton
            label="Types de chambres"
            active={panel === "roomTypes"}
            onClick={() => onChange("roomTypes")}
          />
        </SidebarSection>

        <SidebarSection title="Infos">
          <SidebarButton
            label="Stats"
            active={panel === "stats"}
            onClick={() => onChange("stats")}
          />
        </SidebarSection>
      </div>
    </aside>
  );
}

function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a847b]">
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SidebarButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
        active
          ? "bg-[#314835] text-white"
          : "bg-[#f8f3ea] text-[#314835] hover:bg-[#efe8dc]"
      }`}
    >
      <span>{label}</span>
    </button>
  );
}
