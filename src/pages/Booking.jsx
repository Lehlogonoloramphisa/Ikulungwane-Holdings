import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Calendar, Camera, CheckCircle, FileText, Wallet } from "lucide-react";
import { localApi } from "@/api/localClient";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { orderedEnabled, useCms } from "@/lib/cms";
import { sendSiteEmail } from "@/lib/emailNotifications";

const STEPS = [
  { icon: Camera, label: "Service", kicker: "What are we creating?" },
  { icon: Calendar, label: "Details", kicker: "Who, when, and where?" },
  { icon: Wallet, label: "Budget", kicker: "What investment range fits?" },
  { icon: FileText, label: "Notes", kicker: "What should it feel like?" },
];

export default function Booking() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refNum, setRefNum] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    event_type: "",
    event_date: "",
    event_location: "",
    budget_range: "",
    notes: "",
  });
  const cms = useCms();
  const page = cms.pages.booking;
  const contact = cms.global.contact;
  const eventTypes = orderedEnabled(page.services);
  const budgets = orderedEnabled(page.budgets);
  const fields = page.formFields.filter((field) => field.enabled !== false);
  const fieldLabel = (name, fallback) => fields.find((field) => field.name === name)?.label || fallback;

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const canAdvance = () => {
    if (step === 0) return form.event_type;
    if (step === 1) return form.full_name && form.email && form.phone;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const ref = "IKU-" + Date.now().toString(36).toUpperCase();
      const booking = {
        ...form,
        reference: ref,
        status: "new",
        deposit_amount: page.depositAmount,
        confirmation_email: page.confirmationEmail,
      };
      await localApi.entities.Booking.create(booking);
      await sendSiteEmail({ type: "booking", payload: booking, cms });
      setRefNum(ref);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Your booking request could not be submitted. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    const followUpMessage = String(page.confirmationWhatsAppMessage || "")
      .replace(/\{reference\}/g, refNum)
      .trim();
    const whatsappFollowUpUrl = followUpMessage
      ? `${contact.whatsappUrl}${contact.whatsappUrl?.includes("?") ? "&" : "?"}text=${encodeURIComponent(followUpMessage)}`
      : "";

    return (
      <main className="interior-page booking-page">
        <section className="booking-success-section">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="booking-success-card"
          >
            <CheckCircle />
            <p className="ashley-kicker">Request Received</p>
            <h1>{page.confirmationTitle}</h1>
            <span>
              Your booking reference is <strong>{refNum}</strong>. {page.confirmationMessage}
              {page.depositAmount ? <> Deposit guidance: <strong>{page.depositAmount}</strong>.</> : null}
            </span>
            <div className="booking-success-actions">
              <Link to="/">
                Back to Home <ArrowRight />
              </Link>
              {whatsappFollowUpUrl && (
                <a href={whatsappFollowUpUrl} target="_blank" rel="noopener noreferrer">
                  WhatsApp Follow-up <ArrowRight />
                </a>
              )}
            </div>
          </motion.div>
        </section>
      </main>
    );
  }

  const activeStep = STEPS[step];

  return (
    <main className="interior-page booking-page">
      <section className="interior-hero booking-hero">
        <div className="interior-hero-copy">
          <p className="ashley-kicker">{page.hero.subtitle}</p>
          <h1>{page.hero.title}</h1>
          <span>
            {page.hero.description}
          </span>
        </div>
        <div className="booking-brief-card">
          <span>{page.briefLabel}</span>
          <strong>{String(step + 1).padStart(2, "0")}</strong>
          <p>{activeStep.kicker}</p>
        </div>
      </section>

      <section className="booking-board-section">
        <aside className="booking-step-rail">
          {STEPS.map((item, index) => (
            <button
              key={item.label}
              type="button"
              className={index === step ? "is-active" : index < step ? "is-complete" : ""}
              onClick={() => {
                if (index <= step || canAdvance()) setStep(index);
              }}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <item.icon />
              <strong>{item.label}</strong>
              <em>{item.kicker}</em>
            </button>
          ))}
        </aside>

        <div className="booking-form-stage">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="booking-stage-heading">
                <span>{activeStep.label}</span>
                <h2>{activeStep.kicker}</h2>
              </div>

              {step === 0 && (
                <div className="booking-choice-grid">
                  {eventTypes.map((eventType) => (
                    <button
                      key={eventType.value}
                      type="button"
                      onClick={() => update("event_type", eventType.value)}
                      className={form.event_type === eventType.value ? "is-selected" : ""}
                    >
                      <strong>{eventType.label}</strong>
                      <span>{eventType.note}</span>
                    </button>
                  ))}
                </div>
              )}

              {step === 1 && (
                <div className="booking-field-stack">
                  <div className="booking-field-grid">
                    <Input placeholder={`${fieldLabel("full_name", "Full Name")} *`} value={form.full_name} onChange={(event) => update("full_name", event.target.value)} />
                    <Input placeholder={`${fieldLabel("email", "Email Address")} *`} type="email" value={form.email} onChange={(event) => update("email", event.target.value)} />
                  </div>
                  <Input placeholder={`${fieldLabel("phone", "Phone Number")} *`} value={form.phone} onChange={(event) => update("phone", event.target.value)} />
                  <div className="booking-field-grid">
                    <Input type="date" value={form.event_date} onChange={(event) => update("event_date", event.target.value)} />
                    <Input placeholder={fieldLabel("event_location", "Event Location")} value={form.event_location} onChange={(event) => update("event_location", event.target.value)} />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="booking-budget-grid">
                  {budgets.map((budget) => (
                    <button
                      key={budget.label}
                      type="button"
                      onClick={() => update("budget_range", budget.label)}
                      className={form.budget_range === budget.label ? "is-selected" : ""}
                    >
                      {budget.label}
                    </button>
                  ))}
                </div>
              )}

              {step === 3 && (
                <div className="booking-field-stack">
                  <Textarea
                    placeholder={fieldLabel("notes", "Tell us about the mood, must-have moments, inspiration, deliverables, or any special requests")}
                    value={form.notes}
                    onChange={(event) => update("notes", event.target.value)}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {error && <p className="form-error-message">{error}</p>}

          <div className="booking-actions">
            <button
              type="button"
              onClick={() => setStep((current) => current - 1)}
              disabled={step === 0}
            >
              <ArrowLeft />
              Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((current) => current + 1)}
                disabled={!canAdvance()}
                className="is-primary"
              >
                Next
                <ArrowRight />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="is-primary"
              >
                {loading ? "Submitting..." : "Submit Brief"}
                <ArrowRight />
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
