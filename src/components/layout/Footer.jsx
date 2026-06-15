import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Mail, MapPin, MessageCircle } from "lucide-react";
import { orderedEnabled, useCms } from "@/lib/cms";

export default function Footer() {
  const cms = useCms();
  const footer = cms.global.footer;
  const site = cms.global.site;
  const contact = cms.global.contact;
  const socials = cms.global.socialLinks.filter((item) => item.enabled !== false && item.url);
  const quickLinks = orderedEnabled(footer.links);
  const legalLinks = orderedEnabled(footer.legalLinks);

  return (
    <footer className="relative border-t border-white/10 bg-black text-white/58">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.9fr_1.1fr]">
          <div>
            {footer.logoImage ? (
              <img src={footer.logoImage} alt={footer.logoAlt || site.companyName} className="site-footer-logo" />
            ) : (
              <h3 className="site-footer-logo-text">
                {footer.logoText}
              </h3>
            )}
            <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--ashley-accent)]">{footer.subtitle}</p>
            <p className="max-w-sm text-sm leading-7">
              {footer.description}
            </p>
          </div>

          <div>
            <h4 className="mb-6 text-sm font-semibold uppercase tracking-[0.15em] text-white">Quick Links</h4>
            <div className="flex flex-col gap-3">
              {quickLinks.map((link) => (
                <Link key={link.path} to={link.path} className="text-sm transition-colors hover:text-[var(--ashley-accent)]">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-6 text-sm font-semibold uppercase tracking-[0.15em] text-white">Creative Services</h4>
            <div className="flex flex-col gap-3 text-sm">
              {footer.serviceLabels.map((service) => (
                <span key={service}>{service}</span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-6 text-sm font-semibold uppercase tracking-[0.15em] text-white">Get in Touch</h4>
            <div className="flex flex-col gap-4 text-sm">
              <a href={`mailto:${contact.email}`} className="flex items-center gap-3 transition-colors hover:text-[var(--ashley-accent)]">
                <Mail className="h-4 w-4 text-[var(--ashley-accent)]" />
                {contact.email}
              </a>
              <a
                href={contact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 transition-colors hover:text-[var(--ashley-accent)]"
              >
                <MessageCircle className="h-4 w-4 text-[var(--ashley-accent)]" />
                {contact.phone}
              </a>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 flex-shrink-0 text-[var(--ashley-accent)]" />
                <span>{contact.address}</span>
              </div>
              <div className="mt-4 flex items-center gap-4">
                {socials.map((social) => {
                  const Icon = social.label.toLowerCase().includes("facebook") ? Facebook : Instagram;
                  return (
                    <a
                      key={social.label}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="grid h-10 w-10 place-items-center border border-white/10 transition-all hover:border-[var(--ashley-accent)] hover:text-[var(--ashley-accent)]"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-white/30">
            Copyright {new Date().getFullYear()} {footer.copyrightText}
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-white/30">
            {legalLinks.map((link) => (
              <Link key={link.path} to={link.path} className="transition-colors hover:text-white/60">{link.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
