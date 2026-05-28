import Link from "next/link";

type Props = {
  searchParams: Promise<{
    session_id?: string;
  }>;
};

export default async function ReservationSuccessPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#f4f0e8] px-6 py-16">
      <div className="mx-auto max-w-[680px] rounded-[28px] border border-[#d8d0c2] bg-white p-8 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a847b]">
          Réservation
        </p>

        <h1 className="mt-3 text-3xl font-semibold text-[#1e1e1e]">
          Paiement confirmé
        </h1>

        <p className="mt-4 text-[15px] leading-7 text-[#5f584d]">
          Merci, votre paiement a bien été pris en compte. Votre réservation est
          en cours de confirmation dans notre système.
        </p>

        {params.session_id ? (
          <div className="mt-5 rounded-[16px] border border-[#e5ded2] bg-[#fcfaf7] p-4 text-sm text-[#6c675f]">
            Référence Stripe :{" "}
            <span className="break-all font-medium text-[#314835]">
              {params.session_id}
            </span>
          </div>
        ) : null}

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