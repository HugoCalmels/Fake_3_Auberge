export default function RestaurantSection() {
  return (
    <section id="restaurant" className="bg-[#e7e1d7]">
      <div className="mx-auto max-w-[1280px] px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="h-[260px] rounded-[28px] border border-[#d2cabf] bg-[#d8d2c7]" />
            <div className="h-[260px] rounded-[28px] border border-[#d2cabf] bg-[#d8d2c7]" />
            <div className="h-[240px] rounded-[28px] border border-[#d2cabf] bg-[#d8d2c7] sm:col-span-2" />
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#8c7b5d]">
              Restaurant
            </p>

            <h2 className="text-3xl font-semibold tracking-tight text-[#2d2c29] sm:text-4xl">
              Une salle de restaurant de 60 places avec terrasse et vue sur le
              Montcalm
            </h2>

            <div className="mt-8 space-y-6 text-[15px] leading-8 text-[#5f5a52] sm:text-base">
              <p>
                Lors d’un week-end de détente ou pour un bon repas, l’auberge
                dispose d’un restaurant avec une belle terrasse avec vue sur le
                Montcalm, idéal pour les repas de famille, les anniversaires,
                les mariages ou tout autre évènement familial.
              </p>

              <p>
                La salle est aussi parfaitement adaptée aux évènements
                professionnels ou associatifs, comme les séminaires, les
                formations ou les stages sportifs.
              </p>

              <p>
                Nous proposons une cuisine faite de plats maison, préparés à
                partir de produits frais et de saison.
              </p>

              <p>
                Pour un séjour en demi-pension, en pension complète ou un repas
                sur place, la restauration accompagne naturellement le rythme du
                séjour et l’accueil des groupes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}