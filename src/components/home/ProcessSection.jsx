import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { orderedEnabled, useCms } from "@/lib/cms";

export default function ProcessSection() {
  const [active, setActive] = useState(0);
  const cms = useCms();
  const section = cms.pages.home.process;
  const steps = orderedEnabled(section.steps);
  const current = steps[active] || steps[0];

  if (!section.show || steps.length === 0) return null;

  return (
    <section className="studio-process-section">
      <div className="studio-process-inner">
        <motion.div
          className="studio-process-heading"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="ashley-kicker">{section.subtitle}</p>
          <h2>{section.title}</h2>
          <p>
            {section.description}
          </p>
          <Link to={section.buttonLink} className="studio-text-link">
            {section.buttonText} <ArrowUpRight />
          </Link>
        </motion.div>

        <div className="studio-process-board">
          <motion.div
            key={current.title}
            className="studio-process-image"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <img src={current.image} alt={`${current.title} process`} />
            <span>{current.number} / {current.title}</span>
          </motion.div>

          <div className="studio-process-steps">
            {steps.map((step, index) => (
              <button
                key={step.title}
                type="button"
                className={index === active ? "is-active" : ""}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onClick={() => setActive(index)}
              >
                <span>{step.number || String(index + 1).padStart(2, "0")}</span>
                <strong>{step.title}</strong>
                <em>{step.description}</em>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
