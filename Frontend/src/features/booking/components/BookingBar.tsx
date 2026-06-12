type BookingBarProps = {
  openBooking: () => void;
};

export default function BookingBar({ openBooking }: BookingBarProps) {
  return (
    <div className="absolute bottom-0 left-0 z-30 w-full translate-y-1/2">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="grid overflow-hidden rounded-2xl border border-[#ddd6cb] bg-[#f4f0e8] shadow-[0_10px_24px_rgba(0,0,0,0.12)] md:grid-cols-[1.05fr_1.2fr_1fr_0.9fr]">
          <div className="flex flex-col justify-center border-r border-[#e3dbcf] px-7 py-3.5 text-left">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a9184]">
              Ouvert aujourd’hui
            </span>
            <span className="mt-1 text-[15px] font-semibold text-[#2d2c29]">
              12:00–13:45 · 19:30–22:00
            </span>
          </div>

          <div className="flex flex-col justify-center border-r border-[#e3dbcf] px-7 py-3.5 text-left">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a9184]">
              Adresse
            </span>
            <span className="mt-1 text-[15px] font-semibold text-[#2d2c29]">
              Vallée du Vicdessos · Ariège
            </span>
          </div>

          <div className="flex flex-col justify-center border-r border-[#e3dbcf] px-7 py-3.5 text-left">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a9184]">
              Téléphone
            </span>
            <span className="mt-1 text-[15px] font-semibold text-[#2d2c29]">
              05 61 00 00 00
            </span>
          </div>

<button
  type="button"
  onClick={openBooking}
  className="flex cursor-pointer items-center justify-between bg-[#314835] px-7 py-3.5 text-[#f4eee3] transition hover:bg-[#2a3d2d]"
>
  <span className="block font-sans text-[14px] font-[700] uppercase tracking-[0.14em]">
    RÉSERVER
  </span>
  <span className="text-[18px]">→</span>
</button>
        </div>
      </div>
    </div>
  );
}