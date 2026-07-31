import React from "react";
import { Clock, Mail, MessageCircle, Sparkles } from "lucide-react";

export default function MaintenancePage({ cms }) {
  const { site, contact, maintenance = {} } = cms.global;
  const logoImage = site.logoImage || "";
  const title = maintenance.title || "We are refining the experience.";
  const message = maintenance.message || "The website is temporarily offline while we make updates. Please check back soon.";
  const estimatedReturn = maintenance.estimatedReturn || "";
  const showContactLinks = maintenance.showContactLinks !== false;
  const email = contact.email || "";
  const whatsappUrl = contact.whatsappUrl || "";

  return (
    <main className="maintenance-page" role="main">
      <div className="maintenance-shell">
        <div className="maintenance-brand">
          {logoImage ? (
            <img src={logoImage} alt={site.logoAlt || site.companyName} />
          ) : (
            <strong>{site.logoText || site.companyName}</strong>
          )}
        </div>

        <section className="maintenance-panel" aria-labelledby="maintenance-title">
          <div className="maintenance-status">
            <Sparkles className="h-4 w-4" />
            <span>{maintenance.statusLabel || "Maintenance Mode"}</span>
          </div>

          <h1 id="maintenance-title">{title}</h1>
          <p>{message}</p>

          {estimatedReturn && (
            <div className="maintenance-return">
              <Clock className="h-5 w-5" />
              <span>{estimatedReturn}</span>
            </div>
          )}

          {showContactLinks && (email || whatsappUrl) && (
            <div className="maintenance-actions" aria-label="Contact options">
              {email && (
                <a href={`mailto:${email}`}>
                  <Mail className="h-4 w-4" />
                  Email Us
                </a>
              )}
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
