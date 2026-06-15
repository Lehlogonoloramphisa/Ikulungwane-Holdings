import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUpRight, Camera, MonitorPlay, Palette } from "lucide-react";
import { orderedEnabled, useCms } from "@/lib/cms";

const ICONS = { Camera, MonitorPlay, Palette };

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const cms = useCms();
  const hero = cms.pages.home.hero;
  const slides = orderedEnabled(hero.slides).length > 0
    ? orderedEnabled(hero.slides)
    : [{ label: hero.subtitle, image: hero.backgroundImage, video: hero.backgroundVideo }];
  const stats = orderedEnabled(hero.statistics);
  const serviceLinks = orderedEnabled(hero.serviceLinks);

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setCurrent((value) => (value + 1) % slides.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!hero.show) return null;

  const slide = slides[current % slides.length];
  const leadingTitle = hero.outlineText ? hero.title.replace(hero.outlineText, "").trim() : hero.title;

  return (
    <section className="ashley-section relative flex min-h-[88svh] items-end overflow-hidden bg-black pb-14 pt-28">
      <AnimatePresence mode="wait">
        <motion.img
          key={slide.video || slide.image}
          src={slide.image}
          alt={slide.label}
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 0.38, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.94),rgba(0,0,0,0.62),rgba(0,0,0,0.88))]" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black to-transparent" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 px-6 lg:grid-cols-[1fr_360px] lg:items-end">
        <motion.div
          initial={{ opacity: 0, y: 34 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <p className="ashley-kicker mb-6">{hero.subtitle}</p>
          <h1 className="ashley-display max-w-5xl text-5xl font-bold text-white sm:text-6xl md:text-7xl lg:text-8xl">
            {leadingTitle} {hero.outlineText && <span className="ashley-outline-text">{hero.outlineText}</span>}
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-white/56 md:text-lg">
            {hero.paragraph}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to={hero.primaryButtonLink} className="ashley-button ashley-button-primary">
              {hero.primaryButtonText}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link to={hero.secondaryButtonLink} className="ashley-button">
              {hero.secondaryButtonText}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {hero.showStatistics && stats.length > 0 && (
          <div className="mt-12 grid max-w-2xl grid-cols-3 border-y border-white/10">
            {stats.map((stat) => (
              <div key={stat.label} className="border-r border-white/10 py-5 pr-4 last:border-r-0">
                <p className="text-2xl font-bold text-white md:text-3xl">{stat.value}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/38">{stat.label}</p>
              </div>
            ))}
          </div>
          )}
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.18, duration: 0.65 }}
          className="hidden border-l border-white/10 pl-8 lg:block"
        >
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/35">Now Framing</p>
          <p className="mt-3 text-3xl font-semibold text-white">{slide.label}</p>
          <div className="mt-8 space-y-3">
            {serviceLinks.map((item) => {
              const Icon = ICONS[item.icon] || Camera;
              return (
              <Link
                key={item.label}
                to={item.link}
                className="group flex items-center justify-between border-b border-white/10 pb-3 text-white/55 transition-colors hover:text-white"
              >
                <span className="flex items-center gap-3 text-sm uppercase tracking-[0.12em]">
                  <Icon className="h-4 w-4 text-[var(--ashley-accent)]" />
                  {item.label}
                </span>
                <ArrowUpRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
              );
            })}
          </div>

          <div className="mt-10 flex items-center gap-3">
            {slides.map((item, index) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setCurrent(index)}
                className={`h-[2px] transition-all ${index === current ? "w-12 bg-[var(--ashley-accent)]" : "w-5 bg-white/18"}`}
                aria-label={`Show ${item.label}`}
              />
            ))}
          </div>
        </motion.aside>
      </div>

      {hero.enableScrollIndicator && <a
        href="#selected-work"
        className="absolute bottom-5 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-white/32 transition-colors hover:text-white md:flex"
      >
        Scroll
        <ArrowDown className="h-3 w-3" />
      </a>}
    </section>
  );
}
