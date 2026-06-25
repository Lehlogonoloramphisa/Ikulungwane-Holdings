import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, ArrowUpRight, X } from "lucide-react";
import { fallbackPortfolioProjects } from "@/data/portfolioFallback";
import { normalizeMediaUrl } from "@/lib/media";

gsap.registerPlugin(ScrollTrigger);

const WIDTH_CLASSES = ["is-wide", "is-tall", "is-hero", "is-medium", "is-wide", "is-tall"];

const normalizeProject = (project, index) => {
  const fallback = fallbackPortfolioProjects[index % fallbackPortfolioProjects.length];
  return {
    id: project.id || project.slug || fallback.id,
    title: project.title || fallback.title,
    category: project.category || fallback.category,
    description: project.description || project.desc || fallback.description,
    cover_image: normalizeMediaUrl(project.cover_image || project.image || project.featured_image || fallback.cover_image),
  };
};

export default function CinematicPortfolioExperience({
  projects = [],
  eyebrow = "Our Work",
  title = "Selected work as a moving exhibition.",
  backgroundTitle = "Selected Work",
  intro = "A curated gallery of photography, film, brand, and event stories shaped with atmosphere, movement, and detail.",
  showPortfolioLink = true,
  showTransition = true,
  showIntro = true,
  showStickyShowcase = true,
  maxProjects = 8,
}) {
  const rootRef = useRef(null);
  const overlayRef = useRef(null);
  const overlayImageRef = useRef(null);
  const [stickyIndex, setStickyIndex] = useState(0);
  const [caseStudy, setCaseStudy] = useState(null);

  const display = useMemo(() => {
    const source = projects.length > 0 ? projects : fallbackPortfolioProjects;
    return source
      .map(normalizeProject)
      .filter((project) => project.cover_image)
      .slice(0, maxProjects);
  }, [projects, maxProjects]);

  const openCaseStudy = useCallback((project, event) => {
    const source = event.currentTarget.querySelector("img") || event.currentTarget;
    const rect = source.getBoundingClientRect();
    setCaseStudy({
      project,
      from: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
    });
  }, []);

  const closeCaseStudy = useCallback(() => {
    if (!overlayRef.current) {
      setCaseStudy(null);
      return;
    }

    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 0.28,
      ease: "power2.out",
      onComplete: () => setCaseStudy(null),
    });
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || display.length === 0) return undefined;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return undefined;

    const images = Array.from(root.querySelectorAll("img"));
    const refresh = () => ScrollTrigger.refresh();
    images.forEach((image) => {
      if (!image.complete) {
        image.addEventListener("load", refresh, { once: true });
      }
    });

    const hoverTargets = Array.from(
      root.querySelectorAll(".cinema-transition-frame, .cinema-intro-image, .cinema-project-panel"),
    );
    const hoverCleanups = hoverTargets.map((target) => {
      const image = target.querySelector("img");
      if (!image) return () => {};

      const enter = () => {
        gsap.to(image, {
          scale: 1.03,
          filter: "brightness(1.08)",
          duration: 0.42,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      const leave = () => {
        gsap.to(image, {
          scale: 1,
          filter: "brightness(1)",
          duration: 0.42,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      target.addEventListener("mouseenter", enter);
      target.addEventListener("mouseleave", leave);

      return () => {
        target.removeEventListener("mouseenter", enter);
        target.removeEventListener("mouseleave", leave);
      };
    });

    const ctx = gsap.context(() => {
      const transitionImage = root.querySelector(".cinema-transition-image");
      const transitionSection = root.querySelector(".cinema-transition");

      if (transitionImage && transitionSection) {
        gsap.fromTo(
          transitionImage,
          { opacity: 0, scale: 1.15 },
          {
            opacity: 1,
            scale: 1,
            duration: 1.05,
            ease: "power3.out",
            scrollTrigger: {
              trigger: transitionSection,
              start: "top 78%",
              once: true,
            },
          },
        );
      }

      gsap.utils.toArray(".cinema-reveal-image").forEach((image) => {
        gsap.fromTo(
          image,
          { opacity: 0, scale: 1.15 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.95,
            ease: "power3.out",
            scrollTrigger: {
              trigger: image,
              start: "top 82%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });

      const horizontal = root.querySelector(".cinema-horizontal");
      const track = root.querySelector(".cinema-horizontal-track");

      if (horizontal && track) {
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + window.innerWidth * 0.12);
        const horizontalTween = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: horizontal,
            pin: true,
            scrub: 1,
            start: "top top",
            end: () => `+=${distance()}`,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });

        gsap.utils.toArray(".cinema-horizontal-image").forEach((image) => {
          gsap.fromTo(
            image,
            { opacity: 0, scale: 1.15 },
            {
              opacity: 1,
              scale: 1,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: {
                trigger: image,
                containerAnimation: horizontalTween,
                start: "left 82%",
                toggleActions: "play none none reverse",
              },
            },
          );
        });
      }

      gsap.utils.toArray(".cinema-sticky-item").forEach((item, index) => {
        ScrollTrigger.create({
          trigger: item,
          start: "top center",
          end: "bottom center",
          onEnter: () => setStickyIndex(index),
          onEnterBack: () => setStickyIndex(index),
        });

        gsap.fromTo(
          item,
          { opacity: 0.35, y: 34 },
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: {
              trigger: item,
              start: "top 78%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });

      gsap.utils.toArray('[data-parallax="background"]').forEach((element) => {
        gsap.to(element, {
          yPercent: 15,
          ease: "none",
          scrollTrigger: {
            trigger: element.closest("section") || element,
            scrub: true,
          },
        });
      });

      gsap.utils.toArray('[data-parallax="foreground"]').forEach((element) => {
        gsap.to(element, {
          yPercent: -5,
          ease: "none",
          scrollTrigger: {
            trigger: element.closest("section") || element,
            scrub: true,
          },
        });
      });

      gsap.utils.toArray('[data-parallax="text"]').forEach((element) => {
        gsap.to(element, {
          yPercent: -3,
          ease: "none",
          scrollTrigger: {
            trigger: element.closest("section") || element,
            scrub: true,
          },
        });
      });
    }, root);

    ScrollTrigger.refresh();

    return () => {
      images.forEach((image) => image.removeEventListener("load", refresh));
      hoverCleanups.forEach((cleanup) => cleanup());
      ctx.revert();
    };
  }, [display.length]);

  useLayoutEffect(() => {
    if (!caseStudy || !overlayRef.current || !overlayImageRef.current) return;

    const { from } = caseStudy;
    const content = overlayRef.current.querySelector(".cinema-case-content");

    gsap.set(overlayRef.current, { opacity: 1 });
    gsap.fromTo(
      overlayRef.current,
      { backgroundColor: "rgba(0, 0, 0, 0)" },
      { backgroundColor: "rgba(0, 0, 0, 0.94)", duration: 0.45, ease: "power2.out" },
    );

    gsap.fromTo(
      overlayImageRef.current,
      {
        top: from.top,
        left: from.left,
        width: from.width,
        height: from.height,
        scale: 1,
      },
      {
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        scale: 1,
        duration: 0.9,
        ease: "power3.inOut",
      },
    );

    if (content) {
      gsap.fromTo(
        content,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.52, delay: 0.48, ease: "power3.out" },
      );
    }
  }, [caseStudy]);

  if (display.length === 0) return null;
  const introProject = display[1] || display[0];

  return (
    <section ref={rootRef} id="selected-work" className="cinema-portfolio">
      {showTransition && (
        <div className="cinema-transition">
          <div className="cinema-transition-copy" data-parallax="text">
            <p>{eyebrow}</p>
            <h2>{title}</h2>
          </div>
          <button
            type="button"
            className="cinema-transition-frame"
            onClick={(event) => openCaseStudy(display[0], event)}
            aria-label={`Open ${display[0].title}`}
          >
            <img className="cinema-transition-image" src={display[0].cover_image} alt={display[0].title} />
            <span className="cinema-hover-title">
              {display[0].title}
              <ArrowUpRight />
            </span>
          </button>
        </div>
      )}

      {showIntro && (
        <div className="cinema-intro">
          <h2 className="cinema-background-title" data-parallax="background">
            {backgroundTitle}
          </h2>
          <div className="cinema-intro-copy" data-parallax="text">
            <p>{eyebrow}</p>
            <h3>{title}</h3>
            <span>{intro}</span>
          </div>
          <button
            type="button"
            className="cinema-intro-image"
            onClick={(event) => openCaseStudy(introProject, event)}
            aria-label={`Open ${introProject.title}`}
          >
            <img
              className="cinema-reveal-image"
              src={introProject.cover_image}
              alt={introProject.title}
            />
            <span className="cinema-hover-title">
              {introProject.title}
              <ArrowUpRight />
            </span>
          </button>
        </div>
      )}

      <div className="cinema-horizontal">
        <div className="cinema-horizontal-viewport">
          <div className="cinema-horizontal-track">
            {display.map((project, index) => (
              <button
                key={project.id}
                type="button"
                className={`cinema-project-panel ${WIDTH_CLASSES[index % WIDTH_CLASSES.length]}`}
                onClick={(event) => openCaseStudy(project, event)}
                aria-label={`Open ${project.title}`}
              >
                <img className="cinema-horizontal-image" src={project.cover_image} alt={project.title} />
                <span className="cinema-project-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="cinema-hover-title">
                  {project.title}
                  <ArrowUpRight />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {showStickyShowcase && (
        <div className="cinema-sticky-showcase">
          <div className="cinema-sticky-image-wrap">
            <div className="cinema-sticky-image" data-parallax="foreground">
              {display.map((project, index) => (
                <img
                  key={project.id}
                  src={project.cover_image}
                  alt={project.title}
                  className={index === stickyIndex ? "is-active" : ""}
                />
              ))}
            </div>
          </div>

          <div className="cinema-sticky-copy">
            {display.map((project, index) => (
              <button
                key={project.id}
                type="button"
                className="cinema-sticky-item"
                onClick={(event) => openCaseStudy(project, event)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{project.title}</h3>
                <p>{project.category}</p>
                <em>{project.description}</em>
                <ArrowRight />
              </button>
            ))}
          </div>
        </div>
      )}

      {showPortfolioLink && (
        <div className="cinema-portfolio-link">
          <Link to="/portfolio">
            Enter the full portfolio
            <ArrowRight />
          </Link>
        </div>
      )}

      {caseStudy && (
        <div ref={overlayRef} className="cinema-case-study" role="dialog" aria-modal="true">
          <div ref={overlayImageRef} className="cinema-case-image">
            <img src={caseStudy.project.cover_image} alt={caseStudy.project.title} />
          </div>
          <button type="button" className="cinema-case-close" onClick={closeCaseStudy} aria-label="Close project">
            <X />
          </button>
          <div className="cinema-case-content">
            <p>{caseStudy.project.category}</p>
            <h2>{caseStudy.project.title}</h2>
            <span>{caseStudy.project.description}</span>
          </div>
        </div>
      )}
    </section>
  );
}
