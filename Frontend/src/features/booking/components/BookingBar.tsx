type BookingBarProps = {
  openBooking: () => void;
};

export default function BookingBar({ openBooking }: BookingBarProps) {
  return (
    <div className="absolute bottom-0 left-0 z-30 w-full translate-y-[70%] md:translate-y-1/2">
      <div className="mx-auto max-w-[1280px] px-4 md:px-6">
        <div className="grid overflow-hidden rounded-2xl border border-[#ddd6cb] bg-[#f4f0e8] shadow-[0_10px_24px_rgba(0,0,0,0.12)] md:grid-cols-[1.05fr_1.2fr_1fr_0.9fr]">
          <div className="flex flex-col justify-center border-b border-[#e3dbcf] px-5 py-3 text-left md:border-b-0 md:border-r md:px-7 md:py-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9a9184] md:text-[11px] md:tracking-[0.18em]">
              Hébergement
            </span>

            <span className="mt-1 text-[14px] font-semibold text-[#2d2c29] md:text-[15px]">
              Ouvert toute l'année
            </span>
          </div>

          <div className="flex flex-col justify-center border-b border-[#e3dbcf] px-5 py-3 text-left md:border-b-0 md:border-r md:px-7 md:py-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9a9184] md:text-[11px] md:tracking-[0.18em]">
              Adresse
            </span>

            <span className="mt-1 text-[14px] font-semibold text-[#2d2c29] md:text-[15px]">
              Vallée du Vicdessos · Ariège
            </span>
          </div>

          <div className="flex flex-col justify-center border-b border-[#e3dbcf] px-5 py-3 text-left md:border-b-0 md:border-r md:px-7 md:py-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9a9184] md:text-[11px] md:tracking-[0.18em]">
              Téléphone
            </span>

            <span className="mt-1 text-[14px] font-semibold text-[#2d2c29] md:text-[15px]">
              05 61 00 00 00
            </span>
          </div>

          <button
            type="button"
            onClick={openBooking}
           className="flex cursor-pointer items-center justify-between bg-[#314835] px-5 py-3 text-[#f4eee3] transition hover:bg-[#3b563f] md:px-7 md:py-3.5"
          >
            <span className="block font-sans text-[13px] font-[700] uppercase tracking-[0.12em] md:text-[14px] md:tracking-[0.14em]">
              RÉSERVER
            </span>

            <span className="text-[16px] md:text-[18px]">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}