type Props = {
  stats: {
    totalRooms: number;
    availableRooms: number;
    occupiedRooms: number;
    roomTypesCount: number;
    totalBookings: number;
  };
};

export default function AdminStatsPanel({ stats }: Props) {
  const cards = [
    { label: "Chambres totales", value: stats.totalRooms },
    { label: "Disponibles", value: stats.availableRooms },
    { label: "Occupees", value: stats.occupiedRooms },
    { label: "Types de chambres", value: stats.roomTypesCount },
    { label: "Reservations", value: stats.totalBookings },
  ];

  return (
    <section className="rounded-[20px] border border-[#d8d0c2] bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-[#1e1e1e]">Stats</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-[18px] border border-[#e3dbcf] bg-[#fcfaf7] p-5"
          >
            <p className="text-sm text-[#6c675f]">{card.label}</p>
            <p className="mt-3 text-4xl font-semibold text-[#1e1e1e]">
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
