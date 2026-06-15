import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCms } from "@/lib/cms";

gsap.registerPlugin(ScrollTrigger);

export default function StudioSectionsMotion() {
  const cms = useCms();
  const animations = cms.global.animations;

  useLayoutEffect(() => {
    const root = document.querySelector(".home-studio-flow");
    if (!root) return undefined;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || animations.sectionEntrances === false) return undefined;

    const ctx = gsap.context(() => {
      if (animations.parallax !== false) gsap.utils.toArray(".studio-chapter-title").forEach((element) => {
        gsap.to(element, {
          yPercent: 8,
          ease: "none",
          scrollTrigger: {
            trigger: element.closest("section"),
            scrub: true,
          },
        });
      });

      gsap.utils.toArray(".studio-proof-item").forEach((item) => {
        gsap.fromTo(
          item,
          { opacity: 0.38, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: item,
              start: "top 82%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });

      if (animations.imageReveals !== false) gsap.utils.toArray(".studio-process-image img, .studio-service-preview img").forEach((image) => {
        gsap.fromTo(
          image,
          { scale: 1.08 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: image.closest("section"),
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      });
    }, root);

    return () => ctx.revert();
  }, [animations.parallax, animations.imageReveals, animations.sectionEntrances]);

  return null;
}
