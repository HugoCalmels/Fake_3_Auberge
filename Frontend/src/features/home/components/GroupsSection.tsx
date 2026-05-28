type GroupsSectionProps = {
  keepNavbarVisible: () => void;
};

export default function GroupsSection({
  keepNavbarVisible,
}: GroupsSectionProps) {
  return (
    <section id="groupes" className="bg-[#314835]">
      <div className="mx-auto max-w-[1280px] px-4 pt-24 pb-20 sm:px-6 lg:px-8 lg:pt-28 lg:pb-24">
        <div className="max-w-[860px]">
          <h2 className="!text-[#f4efe7] text-4xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            Groupes
          </h2>

          <div className="mt-8 max-w-[760px] space-y-5 text-[17px] leading-8 text-[#e4dbcf]">
            <p>
              L’auberge accueille les familles, groupes, randonneurs et sportifs
              dans un environnement calme, accessible et proche de la nature.
            </p>

            <p>
              Pour les{" "}
              <strong className="font-semibold text-[#f4efe7]">
                groupes à partir de 15 personnes
              </strong>
              , une proposition personnalisée peut être préparée selon la durée
              du séjour, le nombre de participants et les besoins du groupe.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap gap-3">
            <InfoPill>Week-ends famille</InfoPill>
            <InfoPill>Anniversaires & mariages</InfoPill>
            <InfoPill>Stages sportifs</InfoPill>
            <InfoPill>Séminaires</InfoPill>
          </div>

          <div className="mt-10">
            <a
              href="#contact"
              onClick={keepNavbarVisible}
              className="inline-flex items-center rounded-full border border-[#d8d0c2]/30 bg-[#f4efe7] px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#314835] transition hover:bg-white"
            >
              Nous contacter
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoPill({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-[#f4efe7]">
      {children}
    </div>
  );
}