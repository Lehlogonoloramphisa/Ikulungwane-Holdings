import React, { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function AshleyEffects({ settings = {} }) {
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showBackTop, setShowBackTop] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoaded(true), settings.preloader === false ? 0 : 900);

    const handlePointerMove = (event) => {
      document.documentElement.style.setProperty("--cursor-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--cursor-y", `${event.clientY}px`);
    };

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, nextProgress)));
      setShowBackTop(scrollTop > window.innerHeight * 0.55);
    };

    const handleAnchorClick = (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;

      const id = link.getAttribute("href");
      const target = id && id.length > 1 ? document.querySelector(id) : null;
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    if (settings.cursor !== false) {
      window.addEventListener("pointermove", handlePointerMove);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("click", handleAnchorClick);
    handleScroll();

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("click", handleAnchorClick);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {settings.preloader !== false && <div className={`ashley-preloader ${loaded ? "is-hidden" : ""}`} aria-hidden={loaded}>
        <div className="ashley-preloader-mark">
          <p className="ashley-kicker justify-center mb-5">Ikulungwane</p>
          <p className="text-4xl font-bold text-white">Creative Studio</p>
        </div>
      </div>}

      {settings.cursor !== false && <div className="ashley-cursor" aria-hidden="true" />}

      {settings.scrollProgress !== false && <div className="ashley-progress-track" aria-hidden="true">
        <div className="ashley-progress-bar" style={{ height: `${progress}%` }} />
      </div>}

      <button
        type="button"
        onClick={scrollToTop}
        className={`ashley-back-top ${showBackTop ? "is-visible" : ""}`}
        aria-label="Back to top"
      >
        <ArrowUp className="w-4 h-4" />
      </button>
    </>
  );
}
