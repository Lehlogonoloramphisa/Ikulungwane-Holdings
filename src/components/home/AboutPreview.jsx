import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { orderedEnabled, useCms } from "@/lib/cms";
import { normalizeMediaUrl } from "@/lib/media";

export default function AboutPreview() {
  const cms = useCms();
  const section = cms.pages.home.aboutPreview;
  const principles = orderedEnabled(section.featureCards);
  const stats = orderedEnabled(section.statistics);
  const mainImage = normalizeMediaUrl(section.mainImage);

  if (!section.show) return null;

  return (
    <section className="studio-about-section">
      <div className="studio-chapter-title" aria-hidden="true">About</div>
      <div className="studio-about-inner">
        <motion.div
          className="studio-about-copy"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="ashley-kicker">{section.subtitle}</p>
          <h2>
            {section.title}
          </h2>
          <p>
            {section.mainParagraph}
          </p>
          <p>{section.storyParagraph}</p>

          <div className="studio-principles">
            {principles.map((item, index) => (
              <span key={item.title}>
                <small>{String(index + 1).padStart(2, "0")}</small>
                {item.title}
              </span>
            ))}
          </div>

          <div className="studio-about-actions">
            <Link to={section.primaryButtonLink} className="ashley-button ashley-button-primary">
              {section.primaryButtonText}
            </Link>
            <Link to={section.secondaryButtonLink} className="studio-text-link">
              {section.secondaryButtonText} <ArrowRight />
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="studio-about-visual"
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.82, ease: [0.22, 1, 0.36, 1] }}
        >
          {mainImage && (
            <div className="studio-about-image is-main">
              <img src={mainImage} alt={section.title} />
            </div>
          )}
          <div className="studio-about-stats">
            {stats.map((stat) => (
              <div key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
