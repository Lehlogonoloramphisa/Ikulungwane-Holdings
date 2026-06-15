import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { localApi } from "@/api/localClient";
import { AnimatePresence, motion } from "framer-motion";
import { Star } from "lucide-react";
import { useCms } from "@/lib/cms";

const FALLBACK = [
  {
    id: "1",
    client_name: "Sihle Mazibuko",
    rating: 5,
    review: "Their ability to think outside the box and bring unique ideas to life is truly impressive.",
    service_type: "Branding",
  },
  {
    id: "2",
    client_name: "Jim Mkhonto",
    rating: 5,
    review: "They consistently deliver exceptional creative solutions and make the process feel effortless.",
    service_type: "Photography",
  },
  {
    id: "3",
    client_name: "Phindile Nkosi",
    rating: 5,
    review: "Meticulous attention to detail, visually stunning work, and a final result that felt premium.",
    service_type: "Videography",
  },
];

export default function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const cms = useCms();
  const section = cms.pages.home.testimonials;

  const { data: testimonials } = useQuery({
    queryKey: ["testimonials-featured"],
    queryFn: () => localApi.entities.Testimonial.filter({ featured: true, published: true }, "-created_date", 4),
    initialData: [],
  });

  const display = useMemo(() => {
    const source = testimonials.length > 0 ? testimonials : FALLBACK;
    return source.slice(0, Number(section.testimonialCount) || 4);
  }, [testimonials, section.testimonialCount]);

  const current = display[active] || display[0];

  if (!section.show) return null;

  return (
    <section className="studio-testimonial-section">
      <div className="studio-testimonial-inner">
        <div className="studio-testimonial-heading">
          <p className="ashley-kicker">{section.subtitle}</p>
          <h2>{section.title}</h2>
        </div>

        <div className="studio-testimonial-stage">
          <div className="studio-quote-mark" aria-hidden="true">"</div>
          <AnimatePresence mode="wait">
            {current && (
              <motion.div
                key={current.id || current.client_name}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="studio-testimonial-quote"
              >
                <div className="studio-stars">
                  {Array.from({ length: current.rating || 5 }).map((_, starIndex) => (
                    <Star key={starIndex} />
                  ))}
                </div>
                <blockquote>{current.review}</blockquote>
                <p>{current.client_name}</p>
                <span>{current.service_type || "Creative Production"}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="studio-testimonial-rail">
            {display.map((item, index) => (
              <button
                key={item.id || item.client_name}
                type="button"
                className={index === active ? "is-active" : ""}
                onClick={() => setActive(index)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {item.client_name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
