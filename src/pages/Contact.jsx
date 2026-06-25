import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Facebook, Instagram, Mail, MapPin, MessageCircle, Send } from "lucide-react";
import { localApi } from "@/api/localClient";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCms } from "@/lib/cms";
import { sendSiteEmail } from "@/lib/emailNotifications";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", service_interested: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const cms = useCms();
  const page = cms.pages.contact;
  const contact = cms.global.contact;
  const socials = cms.global.socialLinks.filter((item) => item.enabled !== false && item.url);
  const fields = page.formFields.filter((field) => field.enabled !== false);
  const contactLines = [
    { label: "Email", value: contact.email, href: `mailto:${contact.email}`, icon: Mail },
    { label: "WhatsApp", value: contact.phone, href: contact.whatsappUrl, icon: MessageCircle },
    { label: "Studio", value: contact.address, href: contact.googleMapsUrl || null, icon: MapPin },
  ];

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const message = { ...form, status: "new" };
      await localApi.entities.ContactMessage.create(message);
      await sendSiteEmail({ type: "contact", payload: message, cms });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Your message could not be sent. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="interior-page contact-page">
      <section className="interior-hero contact-hero">
        <div className="interior-hero-copy">
          <p className="ashley-kicker">{page.hero.subtitle}</p>
          <h1>{page.hero.title}</h1>
          <span>
            {page.hero.description}
          </span>
        </div>
        <div className="contact-signal-card">
          <span>{page.responseLabel}</span>
          <strong>{page.responseValue}</strong>
          <p>{page.responseDescription}</p>
        </div>
      </section>

      <section className="contact-board-section">
        <div className="contact-info-panel">
          <h2>{page.panelTitle}</h2>
          <div className="contact-line-list">
            {contactLines.map((line) => {
              const Icon = line.icon;
              return (
                <div key={line.label}>
                  <Icon />
                  <span>{line.label}</span>
                  {line.href ? (
                    <a href={line.href} target={line.href.startsWith("http") ? "_blank" : undefined} rel={line.href.startsWith("http") ? "noopener noreferrer" : undefined}>
                      {line.value}
                    </a>
                  ) : (
                    <p>{line.value}</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="contact-socials">
            <a href={contact.whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle />
              WhatsApp
            </a>
            {socials.map((social) => {
              const Icon = social.label.toLowerCase().includes("facebook") ? Facebook : Instagram;
              return (
                <a key={social.label} href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
                  <Icon />
                </a>
              );
            })}
          </div>
        </div>

        <div className="contact-form-panel">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="contact-success"
            >
              <CheckCircle />
              <h2>{page.formSuccessTitle}</h2>
              <p>{page.formSuccessMessage}</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="contact-form-grid">
                {fields.filter((field) => ["name", "email"].includes(field.name)).map((field) => (
                  <Input
                    key={field.name}
                    placeholder={`${field.label}${field.required ? " *" : ""}`}
                    type={field.name === "email" ? "email" : "text"}
                    value={form[field.name] || ""}
                    onChange={(event) => update(field.name, event.target.value)}
                    required={field.required}
                  />
                ))}
              </div>
              {fields.filter((field) => ["phone", "service_interested"].includes(field.name)).map((field) => (
                <Input
                  key={field.name}
                  placeholder={`${field.label}${field.required ? " *" : ""}`}
                  value={form[field.name] || ""}
                  onChange={(event) => update(field.name, event.target.value)}
                  required={field.required}
                />
              ))}
              {fields.filter((field) => field.name === "message").map((field) => (
                <Textarea
                  key={field.name}
                  placeholder={`${field.label}${field.required ? " *" : ""}`}
                  value={form.message}
                  onChange={(event) => update("message", event.target.value)}
                  required={field.required}
                />
              ))}
              {error && <p className="form-error-message">{error}</p>}
              <button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send Message"}
                <Send />
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
