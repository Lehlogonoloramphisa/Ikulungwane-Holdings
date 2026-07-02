import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const TARGET_SKIP_SELECTOR = [
  "[data-scroll-presence-ignore]",
  "button",
  "a.ashley-button",
  "a.studio-text-link",
  "[data-parallax]",
  ".cinema-horizontal",
  ".cinema-case-study",
  ".portfolio-gallery-overlay",
  ".portfolio-image-lightbox",
].join(",");

const SECTION_SKIP_SELECTOR = [
  "[data-scroll-presence-section-ignore]",
  ".cinema-portfolio",
].join(",");

const TEXT_TARGET_SELECTOR = [
  "h1",
  "h2",
  "h3",
  "h4",
  "p",
  "span",
  "strong",
  "em",
  "label",
  "small",
  "li",
  "blockquote",
  "figcaption",
  ".ashley-kicker",
  ".ashley-display",
  ".studio-chapter-title",
  ".cinema-background-title",
  ".interior-hero-copy > span",
  ".cinema-intro-copy > span",
  ".cinema-case-content > span",
  ".service-menu-preview > div > span",
  ".about-story-copy > p",
  ".contact-info-panel > span",
].join(",");

const topLevelSections = (root) =>
  Array.from(root.querySelectorAll("section")).filter((section) => {
    if (section.matches(SECTION_SKIP_SELECTOR)) return false;
    const parentSection = section.parentElement?.closest("section");
    return !parentSection || !root.contains(parentSection);
  });

const targetTextElements = (section) => {
  const targets = Array.from(section.querySelectorAll(TEXT_TARGET_SELECTOR)).filter((element) => {
    if (element.closest(TARGET_SKIP_SELECTOR)) return false;
    if (element.querySelector("img, picture, video, canvas, svg")) return false;
    const style = window.getComputedStyle(element);
    return style.position !== "absolute" && style.position !== "fixed";
  });

  return targets;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const smoothstep = (start, end, value) => {
  const amount = clamp((value - start) / (end - start), 0, 1);
  return amount * amount * (3 - 2 * amount);
};

const resetTarget = (target) => {
  target.style.removeProperty("opacity");
  target.style.removeProperty("filter");
  target.style.removeProperty("transform");
};

const updateTarget = (config) => {
  const sectionRect = config.section.getBoundingClientRect();
  const targetRect = config.target.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;

  if (!targetRect.width && !targetRect.height) {
    resetTarget(config.target);
    return;
  }

  const enterProgress = smoothstep(viewportHeight * 0.96, viewportHeight * 0.58, sectionRect.top);
  const leaveProgress = smoothstep(viewportHeight * 0.38, viewportHeight * 0.04, sectionRect.bottom);
  const isEntering = sectionRect.top > viewportHeight * 0.58;
  const slide = clamp(Math.max(1 - enterProgress, leaveProgress), 0, 1);

  if (slide < 0.015) {
    config.target.style.opacity = "1";
    config.target.style.filter = "blur(0px)";
    config.target.style.transform = "translate3d(0, 0, 0)";
    return;
  }

  const x = config.sideX * slide * (isEntering ? -1 : 1);
  const opacity = clamp(1 - slide * 0.34, 0.66, 1);
  const blur = slide * 2.4;

  config.target.style.opacity = opacity.toFixed(3);
  config.target.style.filter = `blur(${blur.toFixed(2)}px)`;
  config.target.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
};

export default function ScrollPresenceEffects({ enabled = true }) {
  const location = useLocation();

  useEffect(() => {
    const root = document.querySelector(".ashley-frame");
    if (!root || !enabled) return undefined;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return undefined;

    const sections = topLevelSections(root);
    if (sections.length === 0) return undefined;

    const targetsBySection = new Map();
    const targetConfigs = [];
    sections.forEach((section) => {
      section.classList.add("scroll-presence-section");
      const targets = targetTextElements(section);
      targetsBySection.set(section, targets);
      targets.forEach((target, index) => {
        const direction = index % 2 === 0 ? -1 : 1;
        const spread = 34 + (index % 4) * 12;
        target.classList.add("scroll-presence-target");
        target.style.setProperty("--scroll-presence-index", String(index));
        targetConfigs.push({
          section,
          target,
          sideX: direction * spread,
        });
      });
    });

    let ticking = false;
    const updateAll = () => targetConfigs.forEach(updateTarget);
    const scheduleUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        updateAll();
      });
    };

    const frame = window.requestAnimationFrame(() => {
      updateAll();
      root.classList.add("has-scroll-presence");
    });

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      root.classList.remove("has-scroll-presence");
      sections.forEach((section) => {
        section.classList.remove("scroll-presence-section", "is-scroll-active", "is-scroll-before", "is-scroll-after");
        targetsBySection.get(section)?.forEach((target) => {
          target.classList.remove("scroll-presence-target");
          target.style.removeProperty("--scroll-presence-index");
          resetTarget(target);
        });
      });
    };
  }, [enabled, location.key]);

  return null;
}
