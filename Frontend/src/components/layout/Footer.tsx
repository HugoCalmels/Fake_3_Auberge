export default function Footer() {
  return (
  <footer className="bg-[#314835] text-[#f4efe7]">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="text-sm font-semibold">Auberge du Fauxcalm</p>

          <p className="mt-1 text-sm text-[#d9cfbf]">
            Vallée du Vicdessos · Ariège
          </p>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#d9cfbf]">
          <a href="#auberge" className="transition hover:text-white">
            Auberge
          </a>

          <a href="#hebergement" className="transition hover:text-white">
            Hébergement
          </a>

          <a href="#restaurant" className="transition hover:text-white">
            Restaurant
          </a>

          <a href="#groupes" className="transition hover:text-white">
            Groupes
          </a>

          <a href="#village" className="transition hover:text-white">
            Vallée & Village
          </a>

          <a href="#contact" className="transition hover:text-white">
            Contact
          </a>
        </div>

        <p className="text-xs text-[#cfc5b8]">
          Site réalisé par{" "}
          <a
            href="https://hugo-calmels.fr"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-[#f4efe7] transition hover:text-white"
          >
            Hugo Calmels
          </a>
        </p>
      </div>
    </footer>
  );
}