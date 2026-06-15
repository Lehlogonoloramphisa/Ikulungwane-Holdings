import React from "react";
import { motion } from "framer-motion";
import { Award, Camera, Globe, Users } from "lucide-react";
import { orderedEnabled, useCms } from "@/lib/cms";

const ICONS = { Award, Camera, Globe, Users };

export default function WhyChooseUs() {
  const cms = useCms();
  const section = cms.pages.home.whyChoose;
  const reasons = orderedEnabled(section.items);

  if (!section.show) return null;

  return (
    <section className="studio-proof-section">
      <div className="studio-proof-inner">
        <motion.div
          className="studio-proof-heading"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="ashley-kicker">{section.subtitle}</p>
          <h2>{section.title}</h2>
        </motion.div>

        <div className="studio-proof-wall">
          {reasons.map((reason, index) => {
            const Icon = ICONS[reason.icon] || Camera;
            return (
            <motion.div
              key={reason.title}
              className="studio-proof-item"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ delay: index * 0.08 }}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <Icon />
              <h3>{reason.title}</h3>
              <p>{reason.description}</p>
            </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
