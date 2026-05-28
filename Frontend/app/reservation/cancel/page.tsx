import Link from "next/link";

export default function ReservationCancelPage() {
  return (
    <main className="min-h-screen bg-[#f4f0e8] px-6 py-16">
      <div className="mx-auto max-w-[680px] rounded-[28px] border border-[#d8d0c2] bg-white p-8 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a847b]">
          Réservation
        </p>

        <h1 className="mt-3 text-3xl font-semibold text-[#1e1e1e]">
          Paiement annulé
        </h1>

        <p className="mt-4 text-[15px] leading-7 text-[#5f584d]">
          Le paiement n’a pas été finalisé. Votre réservation n’est donc pas
          confirmée.
        </p>

        <div className="mt-8">
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