type BookingBarProps = {
  openBooking: () => void;
};

export default function BookingBar({ openBooking }: BookingBarProps) {
  return (
    <div className="absolute bottom-0 left-0 z-30 w-full translate-y-1/2">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="grid overflow-hidden rounded-xl border border-[#ddd6cb] bg-[#f4f0e8] shadow-[0_10px_24px_rgba(0,0,0,0.12)] md:grid-cols-[1fr_1fr_1fr_0.9fr]">
          <button
            onClick={openBooking}
            className="flex flex-col justify-center border-r border-[#e3dbcf] px-7 py-4 text-left transition hover:bg-[#f1ece4]"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a9184]">
              Séjour
            </span>
            <span className="mt-1 text-[16px] font-semibold text-[#2d2c29]">
              Choisir les dates
            </span>
          </button>

          <button
            onClick={openBooking}
            className="flex flex-col justify-center border-r border-[#e3dbcf] px-7 py-4 text-left transition hover:bg-[#f1ece4]"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a9184]">
              Voyageurs
            </span>
            <span className="mt-1 text-[16px] font-semibold text-[#2d2c29]">
              Adultes, enfants, chambres
            </span>
          </button>

          <button
            onClick={openBooking}
            className="flex flex-col justify-center border-r border-[#e3dbcf] px-7 py-4 text-left transition hover:bg-[#f1ece4]"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a9184]">
              Hébergement
            </span>
            <span className="mt-1 text-[16px] font-semibold text-[#2d2c29]">
              Type de chambre
            </span>
          </button>

          <button
            onClick={openBooking}
            className="flex items-center justify-between bg-[#314835] px-7 py-4 text-[#f4eee3] transition hover:bg-[#2a3d2d]"
          >
            <span className="text-[13px] font-semibold uppercase tracking-[0.12em]">
              Réserver
            </span>
            <span className="text-[18px]">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}