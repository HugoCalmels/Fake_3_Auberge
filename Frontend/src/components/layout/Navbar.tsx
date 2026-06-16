"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type NavbarProps = {
  openBooking?: () => void;
  showBookingButton?: boolean;
  keepVisibleToken?: number;
};

const NAV_GREEN = "#314835";

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
  const router = useRouter();

  const isAdminPage = pathname === "/admin";
  const isHomePage = pathname === "/";

  const [scrolled, setScrolled] = useState(false);
  const [language, setLanguage] = useState<"FR" | "EN">("FR");
  const [langOpen, setLangOpen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const langRef = useRef<HTMLDivElement | null>(null);
  const lastScrollY = useRef(0);
  const keepNavVisibleUntil = useRef(0);

  const navLinks = useMemo(
    () =>
      NAV_LINKS.map((item) => ({
        ...item,
        href: isHomePage ? item.hash : `/${item.hash}`,
      })),
    [isHomePage],
  );

  const isScrolled = isAdminPage || scrolled;
  const shouldShowBookingButton = showBookingButton && !isAdminPage;

  function keepNavbarVisible() {
    keepNavVisibleUntil.current = Date.now() + 1100;
    setNavVisible(true);
    setLangOpen(false);
  }

  function closeMobileMenu() {
    setMobileOpen(false);
    setLangOpen(false);
  }

  function handleLogoClick() {
    keepNavbarVisible();
    closeMobileMenu();

    if (isHomePage) {
      window.history.pushState(null, "", "/");
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    router.push("/");
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

      if (delta > 10 && currentScrollY > 120 && !mobileOpen) {
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
  }, [isAdminPage, mobileOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      className={`fixed left-0 top-0 z-50 w-full transform transition-transform duration-500 ${
        navVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div
        className={`w-full transition-colors duration-300 ${
          isScrolled
            ? "bg-[#314835] shadow-lg"
            : "bg-[#314835] shadow-lg lg:bg-transparent lg:shadow-none"
        }`}
      >
        <div className="flex h-[76px] items-center justify-between px-4 sm:px-6 lg:h-28 lg:px-16">
          <button
            type="button"
            onClick={handleLogoClick}
            aria-label="Retour à l’accueil"
            className="relative flex h-[58px] w-[58px] shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full sm:h-[64px] sm:w-[64px] lg:h-[94px] lg:w-[94px]"
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
              className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_0_3px_#eee6da,inset_0_0_0_5px_#e3d8c9,inset_0_0_14px_3px_#eee6da] lg:shadow-[inset_0_0_0_4px_#eee6da,inset_0_0_0_6px_#e3d8c9,inset_0_0_18px_4px_#eee6da]"
            />
          </button>

          <nav className="hidden items-center gap-6 lg:flex">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={keepNavbarVisible}
                className="text-[18px] font-semibold !text-white transition-opacity duration-300 hover:opacity-70"
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
                className="cursor-pointer rounded-full bg-[#eee6da] px-7 py-3 text-[#314835] shadow-sm transition-all duration-300 hover:bg-[#e3d8c9]"
              >
                <span className="block text-[14px] font-[800] uppercase tracking-[0.14em]">
                  Réserver
                </span>
              </button>
            ) : null}

            <div ref={langRef} className="relative">
              <button
                type="button"
                onClick={() => setLangOpen((prev) => !prev)}
                className={`min-w-[62px] cursor-pointer rounded-full px-4 py-3 text-white shadow-sm transition-all duration-300 hover:bg-[#466349] ${
                  isScrolled
                    ? "border border-white/45 bg-[#314835]"
                    : "border border-transparent bg-[#314835]"
                }`}
              >
                <span className="block text-[14px] font-[800] uppercase tracking-[0.14em] !text-white">
                  {language}
                </span>
              </button>

              <div
                className={`absolute right-0 mt-2 min-w-[62px] overflow-hidden rounded-xl border border-[#d8d0c2] bg-[#f4f0e8] shadow-lg transition-all duration-300 ${
                  langOpen
                    ? "pointer-events-auto translate-y-0 opacity-100"
                    : "pointer-events-none -translate-y-1 opacity-0"
                }`}
              >
                {(["FR", "EN"] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setLanguage(lang);
                      setLangOpen(false);
                    }}
                    className={`block w-full cursor-pointer px-3 py-2 text-center text-[13px] font-[700] uppercase tracking-[0.08em] transition-colors ${
                      language === lang
                        ? "bg-[#eee6da] text-[#314835]"
                        : "text-[#314835] hover:bg-[#e3d8c9]"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </nav>

          <button
            type="button"
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
            onClick={() => {
              keepNavbarVisible();
              setMobileOpen((prev) => !prev);
            }}
            className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#f4efe7]/10 text-white backdrop-blur-sm transition-all duration-300 hover:bg-[#f4efe7]/20 lg:hidden"
          >
            <span className="relative h-5 w-6">
              <span
                className={`absolute left-0 top-0 h-[2px] w-6 rounded-full bg-current transition-all duration-300 ${
                  mobileOpen ? "translate-y-[9px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-[9px] h-[2px] w-6 rounded-full bg-current transition-all duration-300 ${
                  mobileOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 top-[18px] h-[2px] w-6 rounded-full bg-current transition-all duration-300 ${
                  mobileOpen ? "-translate-y-[9px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div
          className="fixed left-0 top-[76px] z-40 h-[calc(100vh-76px)] w-full overflow-y-auto bg-[#314835] px-6 pb-8 pt-4 lg:hidden"
          style={{ backgroundColor: NAV_GREEN }}
        >
          <nav className="flex flex-col">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => {
                  keepNavbarVisible();
                  closeMobileMenu();
                }}
                className="border-b border-white/15 py-4 text-[20px] font-semibold !text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mt-6 flex gap-3">
            {shouldShowBookingButton ? (
              <button
                type="button"
                onClick={() => {
                  keepNavbarVisible();
                  closeMobileMenu();
                  openBooking?.();
                }}
                className="flex-1 cursor-pointer rounded-full bg-[#eee6da] px-5 py-4 text-[#314835]"
              >
                <span className="block text-[14px] font-[800] uppercase tracking-[0.14em] text-[#314835]">
                  Réserver
                </span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setLanguage(language === "FR" ? "EN" : "FR")}
              className="cursor-pointer rounded-full border border-white/35 bg-[#314835] px-5 py-4 text-white"
            >
              <span className="block text-[14px] font-[800] uppercase tracking-[0.14em] !text-white">
                {language}
              </span>
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}