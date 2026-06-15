import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { localApi } from "@/api/localClient";
import { motion } from "framer-motion";
import { ArrowRight, Camera, Globe, Lightbulb, Megaphone, Palette, Video } from "lucide-react";
import { useCms } from "@/lib/cms";

const ICONS = { Camera, Video, Palette, Globe, Megaphone, Lightbulb };

const FALLBACK_SERVICES = [
  {
    id: "1",
    title: "Photography",
    slug: "photography",
    icon: "Camera",
    description: "Editorial, event, portrait, product, and lifestyle photography shaped with atmosphere and precision.",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1400&q=82",
    packages: [{ price: "From R2,500" }],
  },
  {
    id: "2",
    title: "Videography",
    slug: "videography",
    icon: "Video",
    description: "Cinematic video production for weddings, campaigns, events, reels, and brand films.",
    image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1400&q=82",
    packages: [{ price: "From R5,000" }],
  },
  {
    id: "3",
    title: "Branding & Identity",
    slug: "branding",
    icon: "Palette",
    description: "Visual identity systems that make your brand feel consistent, premium, and memorable.",
    image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1400&q=82",
    packages: [{ price: "From R3,500" }],
  },
  {
    id: "4",
    title: "Web Design & Dev",
    slug: "web-design",
    icon: "Globe",
    description: "Modern websites with clean structure, strong visuals, responsive layouts, and clear conversion paths.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1400&q=82",
    packages: [{ price: "From R8,000" }],
  },
];

export default function ServicesPreview() {
  const [active, setActive] = useState(0);
  const cms = useCms();
  const section = cms.pages.home.services;

  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: () => localApi.entities.Service.filter({ published: true }, "order", 20),
    initialData: [],
  });

  const display = useMemo(() => {
    const source = services.length > 0 ? services : FALLBACK_SERVICES;
    return source.slice(0, Number(section.serviceCount) || 5).map((service, index) => {
      const fallback = FALLBACK_SERVICES[index % FALLBACK_SERVICES.length];
      return {
        ...service,
        icon: service.icon || fallback.icon,
        image: service.image || service.cover_image || fallback.image,
        description: service.description || service.desc || fallback.description,
        packages: service.packages?.length ? service.packages : fallback.packages,
      };
    });
  }, [services, section.serviceCount]);

  const current = display[active] || display[0];

  if (!section.show) return null;

  return (
    <section className="studio-services-section">
      <div className="studio-services-inner">
        <div className="studio-services-top">
          <div>
            <p className="ashley-kicker">{section.subtitle}</p>
            <h2>{section.title}</h2>
          </div>
          <Link to="/services" className="studio-text-link">
            All Services <ArrowRight />
          </Link>
        </div>

        <div className="studio-services-grid">
          <div className="studio-service-index">
            {display.map((service, index) => {
              const IconComp = ICONS[service.icon] || Camera;
              return (
                <button
                  key={service.id || service.slug || service.title}
                  type="button"
                  className={index === active ? "is-active" : ""}
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onClick={() => setActive(index)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <IconComp />
                  <strong>{service.title}</strong>
                  <em>{service.packages?.[0]?.price || "Custom quote"}</em>
                </button>
              );
            })}
          </div>

          <motion.div
            key={current?.title}
            className="studio-service-preview"
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            {current && (
              <>
                <img src={current.image} alt={current.title} />
                <div>
                  <span>{current.category || "Creative Service"}</span>
                  <h3>{current.title}</h3>
                  <p>{current.description}</p>
                  <Link to="/booking">
                    Book This Direction <ArrowRight />
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
