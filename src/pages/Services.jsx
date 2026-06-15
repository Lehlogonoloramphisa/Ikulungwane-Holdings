import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  Check,
  Globe,
  GraduationCap,
  Lightbulb,
  Megaphone,
  Package,
  Palette,
  Plane,
  Users,
  Video,
} from "lucide-react";
import { localApi } from "@/api/localClient";
import { useQuery } from "@tanstack/react-query";
import { useCms } from "@/lib/cms";

const ICONS = { Camera, Video, Users, GraduationCap, Package, Plane, Palette, Globe, Megaphone, Lightbulb };

const DEFAULT_SERVICES = [
  {
    icon: "Camera",
    title: "Photography",
    slug: "photography",
    desc: "Editorial, event, portrait, product, and lifestyle photography shaped with atmosphere and precision.",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1600&q=84",
    packages: [
      { name: "Essential", price: "R2,500", features: ["2 Hours Coverage", "50+ Edited Photos", "Online Gallery"] },
      { name: "Premium", price: "R6,000", features: ["Half Day Coverage", "200+ Edited Photos", "Online Gallery", "1 Photographer"] },
      { name: "Luxury", price: "R12,000", features: ["Full Day Coverage", "500+ Edited Photos", "2 Photographers", "Premium Album"] },
    ],
  },
  {
    icon: "Video",
    title: "Videography",
    slug: "videography",
    desc: "Cinematic video production for weddings, campaigns, events, reels, and brand films.",
    image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1600&q=84",
    packages: [
      { name: "Highlight Film", price: "R5,000", features: ["3-5 Min Edit", "Licensed Music", "Color Grading"] },
      { name: "Full Film", price: "R12,000", features: ["15-20 Min Edit", "Drone Footage", "Licensed Music", "Raw Footage"] },
    ],
  },
  {
    icon: "Palette",
    title: "Branding & Identity Design",
    slug: "branding",
    desc: "Visual identity systems that make your brand feel consistent, premium, and memorable.",
    image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1600&q=84",
    packages: [
      { name: "Starter", price: "R3,500", features: ["Logo Design", "Color Palette", "Brand Guidelines"] },
      { name: "Complete", price: "R8,000", features: ["Full Brand Identity", "Stationery Design", "Social Media Kit"] },
    ],
  },
  {
    icon: "Globe",
    title: "Website Design & Development",
    slug: "web-design",
    desc: "Modern websites with clean structure, strong visuals, responsive layouts, and clear conversion paths.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600&q=84",
    packages: [
      { name: "Starter", price: "R8,000", features: ["5-Page Website", "Mobile Responsive", "SEO Basics", "Contact Form"] },
      { name: "Business", price: "R15,000", features: ["10-Page Website", "Advanced SEO", "Blog Integration"] },
    ],
  },
  {
    icon: "Megaphone",
    title: "Advertising & Marketing",
    slug: "advertising",
    desc: "Campaigns, content calendars, launch visuals, and digital marketing direction that connect with the right audience.",
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1600&q=84",
    packages: [
      { name: "Starter", price: "R4,000", features: ["Social Media Strategy", "Content Calendar", "Monthly Analytics"] },
      { name: "Growth", price: "R10,000", features: ["Ad Management", "Content Creation", "Weekly Reporting"] },
    ],
  },
  {
    icon: "Lightbulb",
    title: "Creative Consulting",
    slug: "consulting",
    desc: "Brand audits, campaign direction, and creative guidance for teams who need clarity before production.",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600&q=84",
    packages: [
      { name: "Consultation", price: "R2,000", features: ["Brand Audit", "Strategy Session", "Action Plan"] },
      { name: "Full Package", price: "R6,000", features: ["Strategy Development", "Implementation Support", "Follow-up"] },
    ],
  },
];

const normalizeServices = (services) =>
  services.map((service, index) => {
    const fallback = DEFAULT_SERVICES[index % DEFAULT_SERVICES.length];
    return {
      ...service,
      icon: service.icon || fallback.icon,
      desc: service.desc || service.description || fallback.desc,
      image: service.image || service.cover_image || fallback.image,
      packages: service.packages?.length ? service.packages : fallback.packages,
    };
  });

export default function Services() {
  const [active, setActive] = useState(0);
  const cms = useCms();
  const page = cms.pages.services;

  const { data: dbServices } = useQuery({
    queryKey: ["services"],
    queryFn: () => localApi.entities.Service.filter({ published: true }, "order", 20),
    initialData: [],
  });

  const services = useMemo(
    () => normalizeServices(dbServices.length > 0 ? dbServices : DEFAULT_SERVICES),
    [dbServices],
  );

  const current = services[active] || services[0];
  const CurrentIcon = ICONS[current?.icon] || Camera;

  return (
    <main className="interior-page services-page">
      <section className="interior-hero services-hero">
        <div className="interior-hero-copy">
          <p className="ashley-kicker">{page.hero.subtitle}</p>
          <h1>{page.hero.title}</h1>
          <span>
            {page.hero.description}
          </span>
        </div>
        <div className="services-hero-frame">
          <img src={current.image} alt={current.title} />
          <div>
            <CurrentIcon />
            <strong>{current.title}</strong>
          </div>
        </div>
      </section>

      <section className="service-menu-section">
        <div className="service-menu-index">
          {services.map((service, index) => {
            const IconComp = ICONS[service.icon] || Camera;
            return (
              <button
                key={service.slug || service.title}
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
          className="service-menu-preview"
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <img src={current.image} alt={current.title} />
          <div>
            <p>{String(active + 1).padStart(2, "0")} / {services.length}</p>
            <h2>{current.title}</h2>
            <span>{current.desc}</span>
            <Link to="/booking">
              Start This Service <ArrowRight />
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="service-packages-section">
        <div className="service-packages-heading">
          <p className="ashley-kicker">{page.packagesSubtitle}</p>
          <h2>{page.packagesTitle}</h2>
        </div>

        <div className="service-package-stream">
          {services.map((service, serviceIndex) => (
            <article key={service.slug || service.title}>
              <div>
                <span>{String(serviceIndex + 1).padStart(2, "0")}</span>
                <h3>{service.title}</h3>
              </div>
              <div className="service-package-list">
                {service.packages?.map((pkg, packageIndex) => (
                  <div key={`${pkg.name}-${packageIndex}`}>
                    <strong>{pkg.name}</strong>
                    <em>{pkg.price}</em>
                    <ul>
                      {pkg.features?.slice(0, 4).map((feature) => (
                        <li key={feature}>
                          <Check />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
