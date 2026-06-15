import Image from "next/image";
import BookingBar from "@/features/booking/components/BookingBar";

type HeroProps = {
  openBooking: () => void;
};

export default function Hero({ openBooking }: HeroProps) {
  return (
    <section className="relative mb-[165px] h-[88svh] min-h-[680px] overflow-visible bg-black md:mb-[70px]">
      <Image
        src="/images/test2323DD.webp"
        alt="Auberge du Fauxcalm"
        fill
        priority
        className="object-cover"
      />

      <div className="absolute inset-0 bg-[#4d5845]/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#66705d]/8 via-transparent to-[#253023]/22" />

      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="mx-auto h-full w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-full items-center pb-[96px] pt-[76px] md:pb-[64px] md:pt-0">
            <div className="max-w-[720px]">
              <h1
                className="uppercase"
                style={{
                  fontFamily: "var(--font-heading), sans-serif",
                  fontSize: "clamp(3.4rem, 15vw, 6.8rem)",
                  fontWeight: 800,
                  lineHeight: 0.92,
                  letterSpacing: "-0.04em",
                  color: "#f3ede3",
                  textShadow: "0 2px 12px rgba(0,0,0,0.18)",
                }}
              >
                Auberge du
                <br />
                Fauxcalm
              </h1>

              <p
                className="mt-4 max-w-[560px] text-[23px] leading-8 md:mt-6 md:text-[24px] md:leading-9"
                style={{
                  color: "#efe8db",
                  textShadow: "0 1px 8px rgba(0,0,0,0.14)",
                }}
              >
                Hébergement, restaurant et séjours au cœur de la vallée d’Auzat.
              </p>
            </div>
          </div>
        </div>
      </div>

      <BookingBar openBooking={openBooking} />
    </section>
  );
}