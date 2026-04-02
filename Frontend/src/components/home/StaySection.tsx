type StaySectionProps = {
  openBooking: () => void;
};

export default function StaySection({ openBooking }: StaySectionProps) {
  return (
    <section
      id="sejour"
      className="mx-auto max-w-[1280px] px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#8c7b5d]">
            Séjour
          </p>

          <h2 className="text-3xl font-semibold tracking-tight text-[#2d2c29] sm:text-4xl">
            20 chambres, 49 lits et un séjour pensé pour les familles comme pour
            les groupes
          </h2>

          <div className="mt-8 space-y-6 text-[15px] leading-8 text-[#5f5a52] sm:text-base">
            <p>
              L’auberge dispose de 20 chambres dotées de salles d’eau privatives
              pour une capacité maximale de 49 lits.
            </p>

            <p>
              Deux chambres sont accessibles en fauteuil roulant en autonomie.
              Le linge de toilette n’est pas fourni, avec possibilité de
              location selon les besoins du séjour.
            </p>

            <p>
              Que ce soit pour une nuit, un week-end ou plusieurs jours, le lieu
              s’adapte aussi bien aux séjours en couple ou en famille qu’aux
              réservations de plusieurs chambres.
            </p>

            <p>
              Grâce à la réservation en ligne, il est possible d’organiser plus
              facilement un séjour avec plusieurs voyageurs, différentes
              configurations de chambres et des formules adaptées.
            </p>
          </div>

          <div className="mt-8">
            <button
              type="button"
              onClick={openBooking}
              className="rounded-full bg-[#2f5132] px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#f5f1ea] transition hover:opacity-90"
            >
              Réserver un séjour
            </button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="h-[260px] rounded-[28px] border border-[#d8d1c6] bg-[#d8d2c7]" />
          <div className="h-[260px] rounded-[28px] border border-[#d8d1c6] bg-[#d8d2c7]" />
          <div className="h-[220px] rounded-[28px] border border-[#d8d1c6] bg-[#d8d2c7] sm:col-span-2" />
        </div>
      </div>
    </section>
  );
}