import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, MessageCircle } from "lucide-react";
import { useCms } from "@/lib/cms";

export default function ContactCTA() {
  const cms = useCms();
  const section = cms.pages.home.cta;

  if (!section.show) return null;

  return (
    <section className="studio-closing-section">
      <div className="studio-closing-inner">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="studio-closing-copy"
        >
          <p className="ashley-kicker">{section.subtitle}</p>
          <h2>{section.title}</h2>
          <p>
            {section.description}
          </p>

          <div className="studio-closing-actions">
            <Link to={section.buttonUrl} className="ashley-button ashley-button-primary">
              <Calendar className="h-4 w-4" />
              {section.buttonText}
            </Link>
            <a href={section.whatsappUrl} target="_blank" rel="noopener noreferrer" className="ashley-button">
              <MessageCircle className="h-4 w-4" />
              {section.whatsappButtonText}
            </a>
          </div>
        </motion.div>

        <div className="studio-closing-ticket">
          <span>IKULUNGWANE</span>
          {section.signals.map((item, index) => (
            <div key={item}>
              <small>{String(index + 1).padStart(2, "0")}</small>
              <strong>{item}</strong>
            </div>
          ))}
          <Link to="/contact">
            Request a Quote <ArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
}
