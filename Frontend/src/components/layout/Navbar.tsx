"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type NavbarProps = {
  openBooking?: () => void;
  showBookingButton?: boolean;
  keepVisibleToken?: number;
};

const NAV_LINKS = [
  { label: "Hébergement", hash: "#hebergement" },
  { label: "Restaurant", hash: "#restaurant" },
  { label: "Groupes", hash: "#groupes" },
  { label: "Infos", hash: "#contact" },
];

export default function Navbar({
  openBooking,
  showBookingButton = true,
  keepVisibleToken = 0,
}: NavbarProps) {
  const pathname = usePathname();
  const isAdminPage = pathname === "/admin";
  const isHomePage = pathname === "/";

  const [scrolled, setScrolled] = useState(false);
  const [language, setLanguage] = useState<"FR" | "EN">("FR");
  const [langOpen, setLangOpen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);

  const langRef = useRef<HTMLDivElement | null>(null);
  const lastScrollY = useRef(0);
  const keepNavVisibleUntil = useRef(0);

  const navLinks = useMemo(() => {
    return NAV_LINKS.map((item) => ({
      ...item,
      href: isHomePage ? item.hash : `/${item.hash}`,
    }));
  }, [isHomePage]);

  const logoHref = isHomePage ? "#top" : "/";

  function keepNavbarVisible() {
    keepNavVisibleUntil.current = Date.now() + 1100;
    setNavVisible(true);
    setLangOpen(false);
  }

  useEffect(() => {
    if (!keepVisibleToken) return;
    keepNavbarVisible();
  }, [keepVisibleToken]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;

      if (!isAdminPage) {
        setScrolled(currentScrollY > 80);
      }

      if (Date.now() < keepNavVisibleUntil.current) {
        setNavVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      if (delta > 10 && currentScrollY > 120) {
        setNavVisible(false);
        setLangOpen(false);
      } else if (delta < -10 || currentScrollY <= 120) {
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

  const isScrolled = isAdminPage || scrolled;
  const shouldShowBookingButton = showBookingButton && !isAdminPage;

  return (
    <header
      className={`fixed left-0 top-0 z-50 w-full transform transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isScrolled
          ? "bg-[#314835]/95 shadow-lg backdrop-blur-sm"
          : "bg-transparent"
      } ${
        navVisible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0"
      }`}
    >
      <div className="flex h-28 items-center justify-between px-10 lg:px-16">
        <a
          href={logoHref}
          onClick={keepNavbarVisible}
          aria-label="Retour à l’accueil"
          className="group relative flex h-[94px] w-[94px] shrink-0 items-center justify-center overflow-hidden rounded-full"
          style={{ boxShadow: "0 8px 22px rgba(0,0,0,0.18)" }}
        >
          <Image
            src="/images/fauxcalm-logo-resized.png"
            alt="Auberge du Fauxcalm"
            fill
            className="scale-[1.02] object-contain"
            priority
          />

          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full transition-all duration-300 shadow-[inset_0_0_0_4px_#eee6da,inset_0_0_0_6px_#e3d8c9,inset_0_0_18px_4px_#eee6da] group-hover:shadow-[inset_0_0_0_4px_#e3d8c9,inset_0_0_0_7px_#d8d0c2,inset_0_0_18px_4px_#e3d8c9]"
          />
        </a>

        <nav className="flex items-center gap-6 text-white">
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={keepNavbarVisible}
              className="text-[16px] font-semibold transition-opacity duration-300 hover:opacity-70"
            >
              {item.label}
            </a>
          ))}

          {shouldShowBookingButton ? (
            <button
              type="button"
              onClick={() => {
                keepNavbarVisible();
                openBooking?.();
              }}
              className="cursor-pointer rounded-full bg-[#eee6da] px-6 py-2.5 text-[12px] font-bold uppercase tracking-[0.16em] text-[#314835] shadow-sm transition-all duration-300 hover:bg-[#e3d8c9]"
            >
              Réserver
            </button>
          ) : null}

          <div ref={langRef} className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((prev) => !prev)}
              className={`min-w-[62px] cursor-pointer rounded-full border px-3.5 py-2.5 text-[12px] font-bold uppercase tracking-[0.16em] transition-all duration-300 ${
                isScrolled
                  ? "border-[#eadbc4] bg-transparent text-[#f4eee3] hover:bg-white/10"
                  : "border-[#eadbc4] bg-[#314835] text-[#f4eee3] shadow-sm hover:bg-[#3a543d]"
              }`}
            >
              {language}
            </button>

            <div
              className={`absolute right-0 mt-2 min-w-[62px] overflow-hidden rounded-xl border border-[#d8d0c2] bg-[#f4f0e8] shadow-lg transition-all duration-300 ${
                langOpen
                  ? "pointer-events-auto translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-1 opacity-0"
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setLanguage("FR");
                  setLangOpen(false);
                }}
                className={`block w-full cursor-pointer px-3 py-2 text-center text-[12px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                  language === "FR"
                    ? "bg-[#eee6da] text-[#314835]"
                    : "text-[#314835] hover:bg-[#e3d8c9]"
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
                className={`block w-full cursor-pointer px-3 py-2 text-center text-[12px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                  language === "EN"
                    ? "bg-[#eee6da] text-[#314835]"
                    : "text-[#314835] hover:bg-[#e3d8c9]"
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