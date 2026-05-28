import Image from "next/image";

export default function AubergeSection() {
  return (
    <section id="auberge" className=" bg-[#ece7df]">
       <div className="mx-auto grid max-w-[1280px] gap-12 px-4 pt-28 pb-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:px-8 lg:pt-36 lg:pb-24">
        <div className="max-w-[860px]">
          <h2 className="text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-[#2d2c29] sm:text-5xl">
            L’auberge
          </h2>

          <div className="mt-8 max-w-[820px] space-y-4 text-[17px] leading-8 text-[#5f5a52]">
            <p>
              Installée au cœur du Parc Naturel Régional, au pied du Montcalm
              culminant à 3077 mètres, l’auberge accueille toute l’année les
              séjours nature, les familles, les groupes et les sportifs.
            </p>

            <p>
              Le bâtiment associe bois et pierre locale, avec un accès facile en
              toute saison depuis Auzat, à 1h30 de Toulouse et 15 minutes de
              Tarascon.
            </p>
          </div>

          <div className="mt-10 grid max-w-[620px] grid-cols-3 gap-3">
            <MiniStat label="Chambres" value="20" />
            <MiniStat label="Lits" value="49" />
            <MiniStat label="Restaurant" value="60" suffix="places" />
          </div>
        </div>

        <div className="relative w-full max-w-[300px] overflow-hidden rounded-[22px] border border-[#d8d1c6] bg-[#d9d3c8] shadow-[0_12px_34px_rgba(0,0,0,0.06)] lg:justify-self-end">
          <div className="relative aspect-[4/5]">
            <Image
              src="/images/facade4-auberge.png"
              alt="Auberge du Montcalm"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniStat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-[18px] border border-[#d8d1c6] bg-[#f5f1ea] px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8c7b5d]">
        {label}
      </p>

      <div className="mt-2 flex items-end gap-1.5">
        <p className="text-3xl font-semibold leading-none tracking-tight text-[#2d2c29]">
          {value}
        </p>

        {suffix ? (
          <p className="pb-0.5 text-sm leading-none text-[#6a645d]">{suffix}</p>
        ) : null}
      </div>
    </div>
  );
}