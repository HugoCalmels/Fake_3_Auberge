export default function ContactSection() {
  return (
    <section id="contact" className="bg-[#f4efe7]">
      <div className="mx-auto max-w-[1280px] px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#8c7b5d]">
              Contact
            </p>

            <h2 className="text-3xl font-semibold tracking-tight text-[#2d2c29] sm:text-4xl">
              Préparer un séjour, organiser une venue en groupe ou nous contacter
            </h2>

            <div className="mt-8 rounded-[28px] border border-[#d8d1c6] bg-[#f5f1ea] p-8">
              <div className="space-y-6 text-[15px] leading-8 text-[#5f5a52] sm:text-base">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8c7b5d]">
                    Adresse
                  </p>
                  <p className="mt-2 text-[#2d2c29]">
                    AUBERGE DU MONTCALM
                    <br />
                    Rue du Montcalm
                    <br />
                    09220 Auzat
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8c7b5d]">
                    Téléphone
                  </p>
                  <a
                    href="tel:0561046168"
                    className="mt-2 block text-[#2d2c29] transition hover:opacity-70"
                  >
                    05 61 04 61 68
                  </a>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8c7b5d]">
                    Email
                  </p>
                  <a
                    href="mailto:aubergedumontcalm@orange.fr"
                    className="mt-2 block text-[#2d2c29] transition hover:opacity-70"
                  >
                    aubergedumontcalm@orange.fr
                  </a>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8c7b5d]">
                    Sur place
                  </p>
                  <p className="mt-2">
                    Accès handicapé, Wi-Fi, parking, piscine à proximité et
                    accès rapide aux départs de randonnées.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-[#d8d1c6] bg-[#d8d2c7] shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
            <div className="flex h-[420px] items-center justify-center">
              <p className="text-sm uppercase tracking-[0.18em] text-[#6c665e]">
                Google Maps Embed
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}