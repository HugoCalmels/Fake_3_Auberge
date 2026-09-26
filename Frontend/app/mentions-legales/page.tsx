import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mentions légales · Auberge du Fauxcalm",
  description:
    "Mentions légales, données personnelles et conditions de réservation du site de démonstration Auberge du Fauxcalm.",
};

// NB : globals.css neutralise les marges Tailwind sur <p> et <h*> ;
// l'espacement est donc porté par des <div>/<section>.
export default function MentionsLegalesPage() {
  return (
    <main className="min-h-screen bg-[#f4f0e8] px-6 py-16">
      <div className="mx-auto max-w-[760px] rounded-[28px] border border-[#d8d0c2] bg-white p-8 shadow-sm sm:p-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a847b]">
          Informations légales
        </p>

        <div className="mt-3">
          <h1 className="text-3xl font-semibold text-[#1e1e1e]">
            Mentions légales
          </h1>
        </div>

        <div className="mt-6 rounded-[16px] border border-dashed border-[#c9b98f] bg-[#fbf6e9] px-5 py-4 text-[15px] leading-7 text-[#5c5443]">
          <strong>Site de démonstration.</strong> L’Auberge du Fauxcalm est un
          établissement fictif. Ce site est un projet de portfolio : aucune
          prestation n’y est vendue et les paiements fonctionnent en mode test
          Stripe (aucun débit réel).
        </div>

        <div className="mt-8 space-y-8 text-[15px] leading-7 text-[#5f584d]">
          <LegalSection title="Éditeur du site">
            <p>
              Hugo Calmels, développeur web. Contact :{" "}
              <a
                href="https://hugo-calmels.fr"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-[#314835] underline underline-offset-2"
              >
                hugo-calmels.fr
              </a>
            </p>
          </LegalSection>

          <LegalSection title="Hébergement">
            <p>
              Site : Netlify, Inc. (netlify.com), San Francisco, États-Unis.
            </p>
            <p>
              API et base de données : Hetzner Online GmbH, Industriestr. 25,
              91710 Gunzenhausen, Allemagne (hetzner.com).
            </p>
          </LegalSection>

          <LegalSection title="Données personnelles">
            <p>
              Les informations saisies (nom, email, téléphone, message) servent
              uniquement à faire fonctionner la démonstration : réservation,
              facture et emails de confirmation. Elles ne sont ni revendues ni
              utilisées à des fins commerciales.
            </p>
            <p>
              Prestataires techniques : Stripe (paiement, mode test), Brevo
              (envoi des emails), Google Maps (carte intégrée, susceptible de
              déposer ses propres cookies).
            </p>
            <p>
              Vous pouvez demander la suppression de vos données via le contact
              ci-dessus. Merci de ne pas saisir de vraies coordonnées bancaires :
              utilisez la carte de test indiquée lors du paiement.
            </p>
          </LegalSection>

          <LegalSection title="Conditions de réservation (démonstration)">
            <p>
              Les réservations effectuées sur ce site sont fictives et
              n’engagent aucune des parties. Les tarifs affichés sont TTC et
              donnés à titre d’exemple. Une réservation n’est confirmée
              qu’après validation du paiement de test.
            </p>
          </LegalSection>
        </div>

        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex rounded-xl bg-[#314835] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#2a3d2d]"
          >
            Retour à l’accueil
          </Link>
        </div>
      </div>
    </main>
  );
}

function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-[#1e1e1e]">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
