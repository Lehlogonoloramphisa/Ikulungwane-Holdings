import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Menu, MessageCircle, X } from "lucide-react";
import { orderedEnabled, useCms } from "@/lib/cms";

const HEADER_ORDER = ["/", "/portfolio", "/about", "/services", "/blog", "/contact"];

const orderHeaderLinks = (links) =>
  orderedEnabled(links)
    .map((link) => (link.path === "/about" ? { ...link, label: "About Us" } : link))
    .sort((a, b) => {
      const aIndex = HEADER_ORDER.indexOf(a.path);
      const bIndex = HEADER_ORDER.indexOf(b.path);
      const aOrder = aIndex === -1 ? Number(a.order) || 999 : aIndex;
      const bOrder = bIndex === -1 ? Number(b.order) || 999 : bIndex;
      return aOrder - bOrder;
    });

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const cms = useCms();
  const site = cms.global.site;
  const navigation = cms.global.navigation;
  const contact = cms.global.contact;
  const navLinks = orderHeaderLinks(navigation.menuItems);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-[75] transition-all duration-300 ${
          scrolled || open ? "bg-black/88 backdrop-blur-xl border-b border-white/10" : "bg-transparent"
        }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="site-brand group" aria-label={`${site.companyName} home`}>
            {site.logoImage ? (
              <img src={site.logoImage} alt={site.logoAlt || site.companyName} className="site-brand-logo" />
            ) : (
              <>
                <span className="site-brand-text">
                  {site.logoText}
                </span>
                <span className="site-brand-subtitle">
                  {site.shortName === site.logoText ? site.companyName : site.shortName}
                </span>
              </>
            )}
          </Link>

          <div className="hidden items-center gap-7 xl:flex">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`site-nav-link font-semibold uppercase tracking-[0.18em] transition-colors ${
                  isActive(link.path) ? "text-[var(--ashley-accent)]" : "text-white/52 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <a
              href={contact.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55 transition-colors hover:text-[var(--ashley-accent)] sm:flex"
            >
              <MessageCircle className="h-4 w-4" />
              {navigation.whatsappText}
            </a>
            <Link to={navigation.buttonLink} className="ashley-button ashley-button-primary hidden sm:inline-flex">
              {navigation.buttonText}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="grid h-12 w-12 place-items-center border border-white/12 text-white transition-colors hover:border-[var(--ashley-accent)] hover:text-[var(--ashley-accent)]"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="ashley-menu-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
          >
            <div className="mx-auto grid min-h-screen max-w-7xl gap-12 px-6 pb-12 pt-28 lg:grid-cols-[1fr_360px] lg:items-end">
              <motion.div
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.08 }}
                className="flex flex-col gap-2"
              >
                {navLinks.map((link, index) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`ashley-menu-link ${isActive(link.path) ? "is-active" : ""}`}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {link.label}
                  </Link>
                ))}
              </motion.div>

              <motion.aside
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.16 }}
                className="border-l border-white/10 pl-8"
              >
                <p className="ashley-kicker mb-6">Studio Capabilities</p>
                <div className="flex flex-wrap gap-2">
                  {navigation.capabilities.map((item) => (
                    <span key={item} className="border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.14em] text-white/58">
                      {item}
                    </span>
                  ))}
                </div>
                <p className="mt-8 max-w-sm text-sm leading-7 text-white/45">
                  {navigation.menuDescription}
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <Link to={navigation.buttonLink} className="ashley-button ashley-button-primary">
                    {navigation.buttonText}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="ashley-button">
                    {contact.phone}
                  </a>
                </div>
              </motion.aside>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
