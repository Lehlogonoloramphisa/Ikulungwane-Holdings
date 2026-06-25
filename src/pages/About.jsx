import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Users } from "lucide-react";
import { localApi } from "@/api/localClient";
import { useQuery } from "@tanstack/react-query";
import { orderedEnabled, useCms } from "@/lib/cms";
import { normalizeMediaUrl } from "@/lib/media";

const LIVE_TEAM = [
  {
    name: "Patrick Mgidi",
    role: "Creative Director . Photographer . Videographer . Graphic Designer . Branding Specialist",
    photo: "https://ikulungwaneholdings.co.za/img/faces/1.jpg",
  },
  {
    name: "Adrianne McDonalds",
    role: "Graphic Designer . Videographer . Social Media Manager",
    photo: "https://ikulungwaneholdings.co.za/img/faces/3.jpg",
  },
  {
    name: "Carly Kgaogelo",
    role: "Marketing Director . Content Creator . Social Media Manager",
    photo: "https://ikulungwaneholdings.co.za/img/faces/2.jpg",
  },
];

export default function About() {
  const cms = useCms();
  const page = cms.pages.about;
  const values = orderedEnabled(page.values);
  const stats = orderedEnabled(page.stats);
  const { data: team } = useQuery({
    queryKey: ["team"],
    queryFn: () => localApi.entities.TeamMember.filter({ published: true }, "order", 20),
    initialData: [],
  });

  const displayTeam = team.length > 0 ? team : LIVE_TEAM;
  const heroStats = stats.slice(0, 3);
  const heroValues = values.slice(0, 3);
  const capabilities = cms.global.navigation.capabilities.slice(0, 5);

  return (
    <main className="interior-page about-page">
      <section className="interior-hero about-hero about-hero-editorial">
        <div className="about-hero-backdrop" aria-hidden="true">About</div>
        <motion.div
          className="interior-hero-copy about-hero-copy"
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="ashley-kicker">{page.hero.subtitle}</p>
          <h1>{page.hero.title}</h1>
          <span>
            {page.hero.description}
          </span>
          <div className="about-hero-actions">
            <Link to="/portfolio">
              View Work <ArrowRight />
            </Link>
            <Link to="/contact">
              Start a Brief <ArrowRight />
            </Link>
          </div>
        </motion.div>

        <motion.aside
          className="about-hero-manifesto"
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.16, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="about-hero-language">
            <span>Studio Language</span>
            <strong>Direction / Production / Presence</strong>
          </div>

          {heroStats.length > 0 && (
            <div className="about-hero-statline">
              {heroStats.map((stat) => (
                <div key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          )}

          {heroValues.length > 0 && (
            <div className="about-hero-values">
              {heroValues.map((value, index) => (
                <div key={value.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{value.title}</p>
                </div>
              ))}
            </div>
          )}
        </motion.aside>

        {capabilities.length > 0 && (
          <div className="about-hero-capabilities" aria-hidden="true">
            {capabilities.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        )}
      </section>

      <section className="about-story-section">
        <div className="about-story-kicker">{page.storySubtitle}</div>
        <div className="about-story-copy">
          <h2>{page.storyTitle}</h2>
          <p>
            {page.storyContent}
          </p>
          <p>
            {page.storyContentTwo}
          </p>
        </div>
        <div className="about-values">
          {values.map((value, index) => (
            <div key={value.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{value.title}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="about-team-section">
        <div className="about-team-heading">
          <p className="ashley-kicker">{page.teamSubtitle}</p>
          <h2>{page.teamTitle}</h2>
        </div>
        <div className="about-team-strip">
          {displayTeam.map((member, index) => {
            const photo = normalizeMediaUrl(member.photo);
            return (
              <motion.article
                key={member.id || member.name}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: index * 0.08 }}
              >
                <div>
                  {photo ? (
                    <img src={photo} alt={member.name} />
                  ) : (
                    <span><Users /></span>
                  )}
                </div>
                <p>{String(index + 1).padStart(2, "0")}</p>
                <h3>{member.name}</h3>
                <em>{member.role}</em>
                {member.bio && <small>{member.bio}</small>}
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="about-stats-section">
        {stats.map((stat) => (
          <div key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
        <Link to="/contact">
          Work With Us <ArrowRight />
        </Link>
      </section>
    </main>
  );
}
