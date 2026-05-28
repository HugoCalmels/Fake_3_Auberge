import Image from "next/image";
import { FaCarSide, FaSkiing } from "react-icons/fa";

export default function VillageSection() {
  return (
    <section id="village" className="overflow-hidden bg-[#f4efe7]">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 pt-24 pb-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_290px] lg:px-8 lg:pt-28 lg:pb-24">
        <div>
<div className="max-w-[720px]">
  <h2
    className="text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-[#2d2c29] sm:text-5xl"
    style={{ marginBottom: "32px" }}
  >
    La vallée du Vicdessos
  </h2>

  <div style={{ marginTop: "32px" }}>
<p className="max-w-[680px] text-[17px] leading-8 text-[#5f5a52]">
  Longue vallée glaciaire d’environ 33 kilomètres, la vallée du Vicdessos remonte
  de Tarascon-sur-Ariège vers les hauts massifs frontaliers, avec Auzat comme
  l’un de ses principaux villages de montagne.
</p>

<p className="mt-5 max-w-[680px] text-[17px] leading-8 text-[#5f5a52]">
  Le secteur a longtemps été marqué par le fer, les mines de Rancié et
  l’hydroélectricité, dont témoignent encore les barrages de Soulcem, Izourt et
  Gnioure.
</p>
  </div>
</div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <ImageCard
              src="/images/gr10.png"
              alt="Sentiers du GR10 autour d'Auzat"
              label="Randonnées du GR10"
            />

            <ImageCard
              src="/images/etang.png"
              alt="Étang d'Izourt"
              label="Étang d'Izourt"
            />

            <ImageCard
              src="/images/village-auzat.png"
              alt="Vue du village d'Auzat"
              label="Village d'Auzat"
            />

            <ImageCard
              src="/images/miglos.png"
              alt="Château de Miglos"
              label="Château de Miglos"
            />

          </div>
        </div>

        <aside className="rounded-[24px] bg-[#314835] px-6 py-6 text-[#f4efe7] shadow-[0_14px_42px_rgba(0,0,0,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f4efe7]">
            Autour d’Auzat
          </p>

          <div className="mt-7 space-y-7">
            <SidebarSection
              title="Sentiers"
              items={[
                "GR10",
                "GRP Tour du pic du Trois Seigneurs",
                "GRT 60 à 65",
              ]}
            />

            <SidebarSection
              title="Étangs"
              items={[
                <>
                  Soulcem
                  <Distance time="15 min" />
                </>,
                <>
                  Izourt
                  <Distance time="20 min" />
                </>,
                <>
                  Gnioure
                  <Distance time="10 min" />
                </>,
              ]}
            />

            <SidebarSection
              title="Lieux"
              items={[
                <>
                  Grotte de Niaux
                  <Distance time="10 min" />
                </>,
                <>
                  Château de Miglos
                  <Distance time="10 min" />
                </>,
              ]}
            />

<SidebarSection
  title="Hiver"
  items={[
    <>
      <span className="inline-flex items-center gap-1.5">
        Goulier neige
        <FaSkiing
          size={13}
          className="translate-y-[1px] text-white"
        />
      </span>

      <Distance time="10 min" />
    </>,
    "Raquettes & sorties montagne",
  ]}
/>

            <SidebarSection
              title="Sommets"
              items={[
                "Pic du Montcalm & Pic d’Estats",
                "Pic des Trois Seigneurs",
                "Pic Rouge de Bassiès",
                "Pic du Midi de Siguer",
              ]}
            />
          </div>
        </aside>
      </div>
    </section>
  );
}

function ImageCard({
  src,
  alt,
  label,
}: {
  src: string;
  alt: string;
  label: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[20px] bg-[#d9d3c8] shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
      <div className="relative aspect-[1.45/1]">
        <Image src={src} alt={alt} fill className="object-cover" />

<div className="absolute inset-x-0 bottom-0 bg-[#314835]/82 px-4 py-3 backdrop-blur-[2px]">
  <p
    className="text-[14px] font-semibold"
    style={{ color: "#f4efe7" }}
  >
    {label}
  </p>
</div>
      </div>
    </div>
  );
}

function SidebarSection({
  title,
  items,
}: {
  title: string;
  items: React.ReactNode[];
}) {
  return (
    <div>
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: "#f4efe7" }}
      >
        {title}
      </p>

      <ul className="mt-3 space-y-2.5 text-[14px] leading-6 text-[#f4efe7]">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2">
            <span className="translate-y-[1px] text-[#d9cfbf]">-</span>

            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Distance({
  time,
  icon = "car",
}: {
  time: string;
  icon?: "car" | "ski";
}) {
  return (
    <span className="ml-1 inline-flex items-center gap-1.5 text-[#f4efe7]">
      <span className="text-[#d7cec1]">—</span>

      <span className="font-medium">{time}</span>

      {icon === "ski" ? (
        <FaSkiing size={13} className="translate-y-[1px] text-white" />
      ) : (
        <FaCarSide size={13} className="translate-y-[1px] text-white" />
      )}
    </span>
  );
}