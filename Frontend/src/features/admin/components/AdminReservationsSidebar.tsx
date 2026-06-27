"use client";

import type { AdminWorkspacePanel } from "@/features/admin/types";

type Props = {
  panel: AdminWorkspacePanel;
  onChange: (panel: AdminWorkspacePanel) => void;
};

export default function AdminReservationsSidebar({ panel, onChange }: Props) {
  return (
    <aside className="self-start rounded-[20px] border border-[#d8d0c2] bg-white p-4 shadow-sm">
      <nav className="space-y-7">
        <SidebarSection title="Réservations">
          <SidebarButton
            label="Planning"
            active={panel === "reservations-planning"}
            onClick={() => onChange("reservations-planning")}
          />

          <SidebarButton
            label="Liste"
            active={panel === "bookings-list"}
            onClick={() => onChange("bookings-list")}
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

          <SidebarButton
            label="Activités"
            active={panel === "system-logs"}
            onClick={() => onChange("system-logs")}
          />
        </SidebarSection>
      </nav>
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
    <section>
      <p className="px-1 text-[12px] font-extrabold uppercase tracking-[0.22em] text-[#1e1e1e]">
        {title}
      </p>

      <div className="mt-3 space-y-2.5">{children}</div>
    </section>
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
      className={`flex w-full cursor-pointer items-center rounded-xl px-3.5 py-2.5 text-left text-[14px] font-medium transition ${
active
  ? "bg-[#314835] text-white hover:bg-[#3b563f]"
  : "bg-[#eee6da] text-[#314835] hover:bg-[#e3d8c9]"
      }`}
    >
      <span>{label}</span>
    </button>
  );
}