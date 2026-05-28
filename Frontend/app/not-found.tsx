"use client";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-[#ece7df] text-[#2d2c29]">
      <section className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-[560px] text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#314835]">
            Erreur 404
          </p>

          <h1 className="mt-5 text-5xl font-semibold tracking-[-0.04em] text-[#111111] sm:text-6xl">
            Page introuvable
          </h1>

          <p className="mt-6 text-[17px] leading-8 text-[#2d2c29]">
            La page que vous recherchez n’existe pas ou n’est plus disponible.
          </p>

          <a
            href="/"
            className="mt-10 inline-flex items-center rounded-full bg-[#314835] px-7 py-3 text-sm font-semibold uppercase tracking-[0.14em] !text-white transition hover:bg-[#3d5941]"
          >
            Retour à l’accueil
          </a>
        </div>
      </section>
    </main>
  );
}