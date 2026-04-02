"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type NavbarProps = {
  openBooking?: () => void;
};

export default function Navbar({ openBooking }: NavbarProps) {
  const pathname = usePathname();
  const isAdminPage = pathname === "/admin";

  const [scrolled, setScrolled] = useState(isAdminPage);
  const [language, setLanguage] = useState("FR");
  const [langOpen, setLangOpen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);

  const langRef = useRef<HTMLDivElement | null>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (isAdminPage) {
      setScrolled(true);
      setNavVisible(true);
      setLangOpen(false);
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 24);

      const delta = currentScrollY - lastScrollY.current;

      if (currentScrollY <= 10) {
        setNavVisible(true);
      } else if (delta > 8) {
        setNavVisible(false);
        setLangOpen(false);
      } else if (delta < -8) {
        setNavVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAdminPage]);

  const navTextColor = scrolled ? "text-white" : "text-[#f3ede3]";

  return (
    <header
      className={`fixed top-0 left-0 z-50 w-full transform transition-all duration-300 ease-out ${
        scrolled ? "bg-[#314835] shadow-md" : "bg-transparent"
      } ${navVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}
    >
      <div className="flex h-28 items-center justify-between px-10 lg:px-16">
        <Link href="/" className="relative h-full w-[96px] shrink-0">
          <Image
            src="/images/logo-mountain.png"
            alt="Auberge du Montcalm"
            fill
            className="object-contain scale-[1.08]"
            priority
          />
        </Link>

        <nav className="flex items-center gap-8">
          <a
            className={`text-[17px] font-semibold transition-colors duration-200 ${navTextColor} hover:opacity-80`}
          >
            Hébergement
          </a>

          <a
            className={`text-[17px] font-semibold transition-colors duration-200 ${navTextColor} hover:opacity-80`}
          >
            Restaurant
          </a>

          <a
            className={`text-[17px] font-semibold transition-colors duration-200 ${navTextColor} hover:opacity-80`}
          >
            Groupes
          </a>

          <a
            className={`text-[17px] font-semibold transition-colors duration-200 ${navTextColor} hover:opacity-80`}
          >
            Infos
          </a>

          <button
            onClick={openBooking}
            className="rounded-full bg-[#eadbc4] px-7 py-3.5 text-[14px] font-semibold uppercase tracking-[0.12em] text-[#314835] transition-all duration-200 hover:bg-[#f0e2cf]"
          >
            Réserver
          </button>

          <div ref={langRef} className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((prev) => !prev)}
              className={`min-w-[74px] rounded-full border-2 px-5 py-3.5 text-[14px] font-semibold uppercase tracking-[0.12em] transition-all duration-200 ${
                scrolled
                  ? "border-[#eadbc4] bg-transparent text-white hover:bg-white/10"
                  : "border-[#eadbc4] bg-[#314835] text-[#f4eee3] hover:bg-[#3a543d]"
              }`}
            >
              {language}
            </button>

            <div
              className={`absolute right-0 mt-3 min-w-[88px] overflow-hidden rounded-2xl shadow-lg transition-all duration-200 ${
                langOpen
                  ? "pointer-events-auto translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-1 opacity-0"
              } ${
                scrolled
                  ? "border-[3px] border-[#eadbc4] bg-[#314835]"
                  : "border border-[#ddd6cb] bg-[#f4f0e8]"
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setLanguage("FR");
                  setLangOpen(false);
                }}
                className={`block w-full px-4 py-3 text-center text-[14px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                  scrolled
                    ? language === "FR"
                      ? "bg-[#eadbc4] text-[#314835]"
                      : "text-[#f4eee3] hover:bg-white/10"
                    : language === "FR"
                      ? "bg-[#ebe3d6] text-[#314835]"
                      : "text-[#314835] hover:bg-[#efe8dc]"
                }`}
              >
                FR
              </button>

              <button
                type="button"
                onClick={() => {
                  setLanguage("EN");
                  setLangOpen(false);
                }}
                className={`block w-full px-4 py-3 text-center text-[14px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                  scrolled
                    ? language === "EN"
                      ? "bg-[#eadbc4] text-[#314835]"
                      : "text-[#f4eee3] hover:bg-white/10"
                    : language === "EN"
                      ? "bg-[#ebe3d6] text-[#314835]"
                      : "text-[#314835] hover:bg-[#efe8dc]"
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}