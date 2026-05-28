import Image from "next/image";

export default function RestaurantSection() {
  return (
    <section id="restaurant" className=" overflow-hidden bg-[#e7e1d7]">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-4 pt-24 pb-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:px-8 lg:pt-28 lg:pb-24">
        <div className="max-w-[820px]">
          <h2 className="text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-[#2d2c29] sm:text-5xl">
            Le restaurant
          </h2>

          <div className="mt-8 max-w-[780px] space-y-4 text-[17px] leading-8 text-[#5f5a52]">
            <p>
              L’auberge dispose d’une salle de restaurant de 60 places et d’une
              terrasse avec vue sur le Montcalm.
            </p>

            <p>
              La cuisine propose des plats maison, préparés à partir de produits
              frais et de saison, pour les repas sur place comme pour les séjours.
            </p>

            <p>
              <strong className="font-semibold text-[#2d2c29]">
                Demi-pension
              </strong>{" "}
              ou{" "}
              <strong className="font-semibold text-[#2d2c29]">
                pension complète
              </strong>{" "}
              peuvent accompagner le séjour, avec possibilité de pique-nique
              selon les besoins.
            </p>
          </div>
        </div>

        <div className="relative w-full max-w-[300px] overflow-hidden rounded-[22px] border border-[#d2cabf] bg-[#d8d2c7] shadow-[0_12px_34px_rgba(0,0,0,0.06)] lg:justify-self-end">
          <div className="relative aspect-[1/1]">
            <Image
              src="/images/resto-auberge.png"
              alt="Salle de restaurant de l’auberge"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}