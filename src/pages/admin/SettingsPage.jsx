import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  CalendarCheck,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  LayoutTemplate,
  Link2,
  Mail,
  Navigation,
  Palette,
  Phone,
  Plus,
  Pencil,
  Save,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Trash2,
  Type,
  Upload,
  Wand2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminMediaField from "@/components/admin/AdminMediaField";
import { localApi } from "@/api/localClient";
import { cmsDefaults } from "@/data/cmsDefaults";
import { applyBrandingVariables } from "@/lib/branding";
import { deepMerge, getValueByPath, saveCmsContent, setValueByPath, useCmsOverride } from "@/lib/cms";
import { emailLinesToList, listToEmailLines, sendSiteEmail } from "@/lib/emailNotifications";
import {
  defaultLegalDocuments,
  deleteLegalDocument,
  emptyLegalDocument,
  legalPath,
  listLegalDocuments,
  normalizeLegalSlug,
  saveLegalDocument,
} from "@/lib/legalDocuments";
import { normalizeDocumentUrl } from "@/lib/media";

const SETTINGS_NAV = [
  { key: "identity", label: "Identity", icon: Building2 },
  { key: "contact", label: "Contact", icon: Phone },
  { key: "email", label: "Email", icon: Mail },
  { key: "socials", label: "Socials", icon: Share2 },
  { key: "navigation", label: "Navigation", icon: Navigation },
  { key: "booking", label: "Booking", icon: CalendarCheck },
  { key: "seo", label: "SEO", icon: Search },
  { key: "experience", label: "Experience", icon: Palette },
  { key: "legal", label: "Legal", icon: ShieldCheck },
];

const clone = (value) => JSON.parse(JSON.stringify(value));

const linesToList = (value) =>
  String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const listToLines = (items = []) => items.filter(Boolean).join("\n");

const FONT_OPTIONS = [
  "Outfit",
  "Inter",
  "Manrope",
  "Montserrat",
  "Poppins",
  "Lora",
  "Playfair Display",
  "Cormorant Garamond",
  "Bebas Neue",
];

const makeWhatsappUrl = (value) => {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (!digits || digits.length < 8) return "";
  const normalized = digits.startsWith("0") ? `27${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}`;
};

function Field({ label, value, onChange, type = "text", multiline = false, help, placeholder, options, min, max, step }) {
  return (
    <div className="admin-field">
      <Label>{label}</Label>
      {options ? (
        <select value={value || ""} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : multiline ? (
        <Textarea
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <Input
          type={type}
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
        />
      )}
      {help && <p>{help}</p>}
    </div>
  );
}

function ToggleRow({ label, checked, onChange, help }) {
  return (
    <div className="admin-toggle-row">
      <div>
        <strong>{label}</strong>
        {help && <p>{help}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function AdminDocumentField({ label, value, documentName, onChange, onNameChange, help }) {
  const inputId = React.useId();
  const [externalUrl, setExternalUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const previewUrl = normalizeDocumentUrl(value);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setError("");

    try {
      const result = await localApi.integrations.Core.UploadFile({ file });
      onChange(result.file_url || "");
      if (result.original_filename) {
        onNameChange?.(result.original_filename);
      }
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleUseUrl = () => {
    const url = externalUrl.trim();
    if (!url) return;
    onChange(url);
    setExternalUrl("");
    setError("");
  };

  return (
    <div className="admin-media-field admin-document-field">
      <div className="admin-media-head">
        <div>
          <Label htmlFor={inputId}>{label}</Label>
          <p>Recommended: PDF, exported clearly and kept under 30MB.</p>
          {help && <span>{help}</span>}
        </div>
        <FileText className="h-5 w-5" />
      </div>

      <div className="admin-document-preview">
        <FileText className="h-8 w-8" />
        <div>
          <strong>{documentName || "No document selected"}</strong>
          <span>{previewUrl || "Upload a PDF or paste a public Google Drive PDF link."}</span>
        </div>
      </div>

      <div className="admin-media-actions">
        <label htmlFor={inputId}>
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading..." : value ? "Replace document" : "Upload document"}
        </label>
        {value && (
          <>
            <a href={previewUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              View
            </a>
            <button type="button" onClick={() => onChange("")}>
              <Trash2 className="h-4 w-4" />
              Remove
            </button>
          </>
        )}
      </div>

      <input
        id={inputId}
        type="file"
        accept=".pdf,application/pdf"
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <div className="admin-media-url-row">
        <Input
          value={externalUrl}
          onChange={(event) => setExternalUrl(event.target.value)}
          placeholder="Paste PDF URL or Google Drive PDF share link"
        />
        <button type="button" onClick={handleUseUrl}>
          <Link2 className="h-4 w-4" />
          Use Link
        </button>
      </div>

      <p className="admin-media-note">
        For Google Drive, set sharing to anyone with the link so visitors can open the document.
      </p>
      {error && <p className="admin-media-error">{error}</p>}
    </div>
  );
}

function SettingsSection({ title, description, children }) {
  return (
    <section className="admin-settings-section">
      <div className="admin-settings-heading">
        <div>
          <p className="admin-eyebrow">Settings</p>
          <h2>{title}</h2>
        </div>
        {description && <p>{description}</p>}
      </div>
      <div className="admin-settings-body">{children}</div>
    </section>
  );
}

export default function SettingsPage({ initialTab = "identity" }) {
  const override = useCmsOverride();
  const [active, setActive] = useState(initialTab);
  const [saved, setSaved] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailTest, setEmailTest] = useState(null);
  const [whatsappFeedback, setWhatsappFeedback] = useState(null);
  const [content, setContent] = useState(() => deepMerge(cmsDefaults, override));
  const [legalDocuments, setLegalDocuments] = useState(defaultLegalDocuments);
  const [legalLoading, setLegalLoading] = useState(true);
  const [legalSaving, setLegalSaving] = useState(false);
  const [legalEditing, setLegalEditing] = useState(null);
  const isLegalRoute = initialTab === "legal";

  useEffect(() => {
    setActive(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setContent(deepMerge(cmsDefaults, override));
  }, [override]);

  useEffect(() => {
    applyBrandingVariables(content.global.branding);
  }, [content.global.branding]);

  const loadLegalDocuments = async () => {
    setLegalLoading(true);
    try {
      setLegalDocuments(await listLegalDocuments());
    } finally {
      setLegalLoading(false);
    }
  };

  useEffect(() => {
    loadLegalDocuments();
  }, []);

  const get = (path, fallback = "") => getValueByPath(content, path) ?? fallback;

  const update = (path, value) => {
    setContent((current) => setValueByPath(current, path, value));
  };

  const updateArrayItem = (path, index, key, value) => {
    setContent((current) => {
      const items = [...(getValueByPath(current, path) || [])];
      items[index] = { ...items[index], [key]: value };
      return setValueByPath(current, path, items);
    });
  };

  const addArrayItem = (path, item) => {
    setContent((current) => {
      const items = [...(getValueByPath(current, path) || []), item];
      return setValueByPath(current, path, items);
    });
  };

  const removeArrayItem = (path, index) => {
    setContent((current) => {
      const items = [...(getValueByPath(current, path) || [])].filter((_, itemIndex) => itemIndex !== index);
      return setValueByPath(current, path, items);
    });
  };

  const handleGenerateWhatsapp = () => {
    const sourceNumber = get("global.contact.whatsapp") || get("global.contact.phone");
    const url = makeWhatsappUrl(sourceNumber);

    if (!url) {
      setWhatsappFeedback({
        type: "error",
        message: "Add a valid WhatsApp number first, then generate the links.",
      });
      return;
    }

    let next = setValueByPath(content, "global.contact.whatsappUrl", url);
    next = setValueByPath(next, "pages.home.cta.whatsappUrl", url);
    setContent(next);
    saveCmsContent(next);

    setSaved(true);
    setWhatsappFeedback({
      type: "success",
      message: `Generated and saved: ${url}`,
    });
    window.setTimeout(() => setSaved(false), 1800);
  };

  const handleSave = () => {
    saveCmsContent(content);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const handleEmailTest = async () => {
    setTestingEmail(true);
    setEmailTest(null);

    const result = await sendSiteEmail({
      type: "test",
      payload: { testRecipient: get("global.email.testRecipient") },
      cms: content,
    });

    if (result.ok && !result.skipped) {
      setEmailTest({ type: "success", message: "Test email sent. Check the selected inbox." });
    } else {
      setEmailTest({
        type: "error",
        message: result.message || result.reason || "The test email could not be sent.",
      });
    }

    setTestingEmail(false);
  };

  const handleRestoreDefaults = () => {
    if (!window.confirm("Restore all website settings and page content to the Ikulungwane defaults?")) return;
    const defaults = clone(cmsDefaults);
    setContent(defaults);
    saveCmsContent(defaults);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const handleNewLegalDocument = () => {
    setLegalEditing({
      ...emptyLegalDocument(legalDocuments.length + 1),
      slug: `legal-document-${legalDocuments.length + 1}`,
    });
  };

  const handleManageLegalDocument = (document) => {
    setLegalEditing({ ...document });
  };

  const handleLegalField = (field, value) => {
    setLegalEditing((current) => {
      const next = { ...current, [field]: value };
      if (field === "title" && !current.footer_label) {
        next.footer_label = value;
      }
      if (field === "slug") {
        next.slug = normalizeLegalSlug(value);
      }
      return next;
    });
  };

  const handleSaveLegalDocument = async () => {
    if (!legalEditing) return;
    setLegalSaving(true);
    try {
      await saveLegalDocument({
        ...legalEditing,
        slug: normalizeLegalSlug(legalEditing.slug || legalEditing.title),
      });
      await loadLegalDocuments();
      setLegalEditing(null);
    } finally {
      setLegalSaving(false);
    }
  };

  const handleToggleLegalDocument = async (document) => {
    await saveLegalDocument({ ...document, show_in_footer: !document.show_in_footer });
    await loadLegalDocuments();
  };

  const handleDeleteLegalDocument = async (document) => {
    if (!window.confirm(`Delete ${document.title}? This removes the footer link and legal page content.`)) return;
    await deleteLegalDocument(document);
    await loadLegalDocuments();
  };

  const socialLinks = get("global.socialLinks", []);
  const notificationEmailLines = listToEmailLines(get("global.email.notificationEmails", []));
  const navItems = get("global.navigation.menuItems", []);
  const bookingServices = get("pages.booking.services", []);
  const bookingBudgets = get("pages.booking.budgets", []);

  return (
    <div className="admin-settings-page">
      <div className="admin-settings-hero">
        <div>
          <p className="admin-eyebrow">{isLegalRoute ? "Documents" : "Site Control"}</p>
          <h1>{isLegalRoute ? "Legal Documents" : "Settings"}</h1>
          <span>
            {isLegalRoute
              ? "Upload Privacy Policy, Terms & Conditions, and Cookie Policy documents directly under Legal."
              : "Manage the business identity, contact channels, booking options, SEO, buttons, legal links, and visual experience."}
          </span>
        </div>
        <div className="admin-settings-actions">
          <Link to="/" className="admin-ghost-cta">
            View Site
            <ExternalLink className="h-4 w-4" />
          </Link>
          <Link to="/admin/page-builder" className="admin-ghost-cta">
            Page Builder
            <LayoutTemplate className="h-4 w-4" />
          </Link>
          <button type="button" onClick={handleSave} className="admin-hero-cta">
            {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Saved" : "Save Settings"}
          </button>
        </div>
      </div>

      <div className="admin-settings-layout">
        <aside className="admin-settings-tabs">
          {SETTINGS_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActive(item.key)}
                className={active === item.key ? "is-active" : ""}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </aside>

        <div className="admin-settings-content">
          {active === "identity" && (
            <SettingsSection title="Brand Identity" description="These fields control the visible studio name, logo text, footer identity, and brand language.">
              <div className="admin-upload-grid">
                <AdminMediaField
                  label="Header logo image"
                  value={get("global.site.logoImage")}
                  recommendedSize="Horizontal: about 300 x 120 px. Vertical: about 200 x 200 px. SVG or transparent PNG recommended."
                  help="Used in the website header. Display height is kept around 40-60 px on desktop and 32-48 px on mobile. If the logo is very tall, upload a horizontal header version."
                  onChange={(fileUrl) => update("global.site.logoImage", fileUrl)}
                />
                <AdminMediaField
                  label="Footer logo image"
                  value={get("global.footer.logoImage")}
                  recommendedSize="Vertical/full logo: about 400 x 400 px, exported at 2x resolution for sharpness."
                  help="Used in the footer. Display height is kept around 60-100 px, so the full vertical logo can be used here if it needs more space."
                  onChange={(fileUrl) => update("global.footer.logoImage", fileUrl)}
                />
                <AdminMediaField
                  label="Favicon"
                  value={get("global.site.favicon")}
                  recommendedSize="512 x 512 px, PNG or ICO"
                  help="Used in the browser tab and bookmarks."
                  accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
                  onChange={(fileUrl) => update("global.site.favicon", fileUrl)}
                />
              </div>
              <div className="admin-form-grid">
                <Field label="Company name" value={get("global.site.companyName")} onChange={(value) => update("global.site.companyName", value)} />
                <Field label="Short name" value={get("global.site.shortName")} onChange={(value) => update("global.site.shortName", value)} />
                <Field label="Tagline" value={get("global.site.tagline")} onChange={(value) => update("global.site.tagline", value)} />
                <Field label="Logo text" value={get("global.site.logoText")} onChange={(value) => update("global.site.logoText", value)} />
                <Field label="Header logo alt text" value={get("global.site.logoAlt")} onChange={(value) => update("global.site.logoAlt", value)} />
                <Field label="Footer logo" value={get("global.footer.logoText")} onChange={(value) => update("global.footer.logoText", value)} />
                <Field label="Footer logo alt text" value={get("global.footer.logoAlt")} onChange={(value) => update("global.footer.logoAlt", value)} />
                <Field label="Footer subtitle" value={get("global.footer.subtitle")} onChange={(value) => update("global.footer.subtitle", value)} />
                <div className="md:col-span-2">
                  <Field label="Footer description" multiline value={get("global.footer.description")} onChange={(value) => update("global.footer.description", value)} />
                </div>
                <div className="md:col-span-2">
                  <Field label="Copyright text" value={get("global.footer.copyrightText")} onChange={(value) => update("global.footer.copyrightText", value)} />
                </div>
              </div>
            </SettingsSection>
          )}

          {active === "contact" && (
            <SettingsSection title="Contact Channels" description="These values power the navbar, footer, contact page, and WhatsApp buttons.">
              <div className="admin-form-grid">
                <Field label="Email address" type="email" value={get("global.contact.email")} onChange={(value) => update("global.contact.email", value)} />
                <Field label="Phone number" value={get("global.contact.phone")} onChange={(value) => update("global.contact.phone", value)} />
                <Field label="WhatsApp number" value={get("global.contact.whatsapp")} onChange={(value) => update("global.contact.whatsapp", value)} />
                <Field label="WhatsApp URL" value={get("global.contact.whatsappUrl")} onChange={(value) => update("global.contact.whatsappUrl", value)} />
                <Field label="Studio address" value={get("global.contact.address")} onChange={(value) => update("global.contact.address", value)} />
                <Field label="Working hours" value={get("global.contact.workingHours")} onChange={(value) => update("global.contact.workingHours", value)} />
                <div className="md:col-span-2">
                  <Field label="Google Maps URL" value={get("global.contact.googleMapsUrl")} onChange={(value) => update("global.contact.googleMapsUrl", value)} />
                </div>
              </div>
              <button type="button" onClick={handleGenerateWhatsapp} className="admin-settings-tool">
                <Wand2 className="h-4 w-4" />
                Generate WhatsApp links
              </button>
              {whatsappFeedback && (
                <p className={`admin-settings-feedback is-${whatsappFeedback.type}`}>
                  {whatsappFeedback.message}
                </p>
              )}
            </SettingsSection>
          )}

          {active === "email" && (
            <SettingsSection title="cPanel Email Setup" description="Send website enquiries, booking requests, test emails, and optional client replies through your cPanel mailbox.">
              <div className="admin-toggle-grid">
                <ToggleRow
                  label="Enable website email"
                  checked={Boolean(get("global.email.enabled", false))}
                  onChange={(value) => update("global.email.enabled", value)}
                  help="When enabled, contact and booking submissions will try to send email after saving to admin."
                />
                <ToggleRow
                  label="Admin notifications"
                  checked={Boolean(get("global.email.adminNotifications", true))}
                  onChange={(value) => update("global.email.adminNotifications", value)}
                  help="Send every new enquiry and booking request to the notification inboxes."
                />
                <ToggleRow
                  label="Client auto-replies"
                  checked={Boolean(get("global.email.clientAutoReplies", false))}
                  onChange={(value) => update("global.email.clientAutoReplies", value)}
                  help="Send a simple confirmation email to the client after they submit a form."
                />
                <ToggleRow
                  label="SSL/TLS"
                  checked={Boolean(get("global.email.smtpSecure", true))}
                  onChange={(value) => update("global.email.smtpSecure", value)}
                  help="Use port 465 with SSL/TLS for most cPanel mailboxes. Use 587 only if your host tells you to."
                />
              </div>

              <div className="admin-email-note">
                <Mail className="h-5 w-5" />
                <div>
                  <strong>Server values stay in cPanel</strong>
                  <p>
                    Put the live SMTP host, username, recipients, and real mailbox password in <code>public_html/api/email-config.php</code>. Do not save the password inside the website admin.
                  </p>
                </div>
              </div>

              <div className="admin-form-grid">
                <Field label="SMTP host" value={get("global.email.smtpHost")} onChange={(value) => update("global.email.smtpHost", value)} placeholder="mail.yourdomain.co.za" help="Find this in cPanel Email Accounts > Connect Devices > SMTP settings." />
                <Field label="SMTP port" type="number" value={get("global.email.smtpPort", 465)} onChange={(value) => update("global.email.smtpPort", Number(value))} help="Usually 465 for SSL or 587 for TLS." />
                <Field label="SMTP username" type="email" value={get("global.email.smtpUsername")} onChange={(value) => update("global.email.smtpUsername", value)} placeholder="info@yourdomain.co.za" />
                <Field label="Password server variable" value={get("global.email.passwordSecretName", "CPANEL_SMTP_PASS")} onChange={(value) => update("global.email.passwordSecretName", value)} help="Optional fallback name for hosts that expose environment variables. On cPanel, use api/email-config.php for the real password." />
                <Field label="From name" value={get("global.email.fromName")} onChange={(value) => update("global.email.fromName", value)} />
                <Field label="From email" type="email" value={get("global.email.fromEmail")} onChange={(value) => update("global.email.fromEmail", value)} />
                <Field label="Reply-to email" type="email" value={get("global.email.replyToEmail")} onChange={(value) => update("global.email.replyToEmail", value)} />
                <Field label="Test recipient" type="email" value={get("global.email.testRecipient")} onChange={(value) => update("global.email.testRecipient", value)} help="On cPanel, api/email-config.php controls where test messages go." />
                <div className="md:col-span-2">
                  <Field
                    label="Notification emails"
                    multiline
                    value={notificationEmailLines}
                    onChange={(value) => update("global.email.notificationEmails", emailLinesToList(value))}
                    help="One email per line. These receive contact and booking notifications."
                  />
                </div>
                <Field label="Contact notification subject" value={get("global.email.contactSubject")} onChange={(value) => update("global.email.contactSubject", value)} />
                <Field label="Booking notification subject" value={get("global.email.bookingSubject")} onChange={(value) => update("global.email.bookingSubject", value)} />
                <Field label="Contact auto-reply subject" value={get("global.email.contactAutoReplySubject")} onChange={(value) => update("global.email.contactAutoReplySubject", value)} />
                <Field label="Booking auto-reply subject" value={get("global.email.bookingAutoReplySubject")} onChange={(value) => update("global.email.bookingAutoReplySubject", value)} />
                <div className="md:col-span-2">
                  <Field label="Contact auto-reply message" multiline value={get("global.email.contactAutoReplyMessage")} onChange={(value) => update("global.email.contactAutoReplyMessage", value)} />
                </div>
                <div className="md:col-span-2">
                  <Field label="Booking auto-reply message" multiline value={get("global.email.bookingAutoReplyMessage")} onChange={(value) => update("global.email.bookingAutoReplyMessage", value)} help="Use {reference} to include the booking reference." />
                </div>
              </div>

              <div className="admin-email-test-row">
                <button type="button" onClick={handleEmailTest} disabled={testingEmail || !get("global.email.enabled", false)} className="admin-settings-tool">
                  <Send className="h-4 w-4" />
                  {testingEmail ? "Sending..." : "Send test email"}
                </button>
                {emailTest && (
                  <p className={`admin-email-status is-${emailTest.type}`}>
                    {emailTest.message}
                  </p>
                )}
              </div>
            </SettingsSection>
          )}

          {active === "socials" && (
            <SettingsSection title="Social Channels" description="Enable or disable each platform and control the exact outgoing URL.">
              <div className="admin-row-stack">
                {socialLinks.map((social, index) => (
                  <div key={`${social.label}-${index}`} className="admin-repeat-row">
                    <Switch checked={social.enabled !== false} onCheckedChange={(value) => updateArrayItem("global.socialLinks", index, "enabled", value)} />
                    <Input value={social.label || ""} onChange={(event) => updateArrayItem("global.socialLinks", index, "label", event.target.value)} placeholder="Label" />
                    <Input value={social.url || ""} onChange={(event) => updateArrayItem("global.socialLinks", index, "url", event.target.value)} placeholder="https://..." />
                    <button type="button" onClick={() => removeArrayItem("global.socialLinks", index)} aria-label={`Remove ${social.label || "social link"}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addArrayItem("global.socialLinks", { label: "New Channel", url: "", enabled: true })}
                className="admin-settings-tool"
              >
                <Plus className="h-4 w-4" />
                Add social channel
              </button>
            </SettingsSection>
          )}

          {active === "navigation" && (
            <SettingsSection title="Navigation And Buttons" description="Manage the primary navbar button, home CTA, menu text, footer service labels, and menu links.">
              <div className="admin-form-grid">
                <Field label="Navbar button text" value={get("global.navigation.buttonText")} onChange={(value) => update("global.navigation.buttonText", value)} />
                <Field label="Navbar button link" value={get("global.navigation.buttonLink")} onChange={(value) => update("global.navigation.buttonLink", value)} />
                <Field label="WhatsApp label" value={get("global.navigation.whatsappText")} onChange={(value) => update("global.navigation.whatsappText", value)} />
                <Field label="Home CTA button text" value={get("pages.home.cta.buttonText")} onChange={(value) => update("pages.home.cta.buttonText", value)} />
                <Field label="Home CTA button URL" value={get("pages.home.cta.buttonUrl")} onChange={(value) => update("pages.home.cta.buttonUrl", value)} />
                <Field label="Home CTA WhatsApp URL" value={get("pages.home.cta.whatsappUrl")} onChange={(value) => update("pages.home.cta.whatsappUrl", value)} />
                <div className="md:col-span-2">
                  <Field label="Menu description" multiline value={get("global.navigation.menuDescription")} onChange={(value) => update("global.navigation.menuDescription", value)} />
                </div>
                <Field
                  label="Menu capability chips"
                  multiline
                  value={listToLines(get("global.navigation.capabilities", []))}
                  onChange={(value) => update("global.navigation.capabilities", linesToList(value))}
                  help="One capability per line."
                />
                <Field
                  label="Footer service labels"
                  multiline
                  value={listToLines(get("global.footer.serviceLabels", []))}
                  onChange={(value) => update("global.footer.serviceLabels", linesToList(value))}
                  help="One service per line."
                />
              </div>

              <div className="admin-repeat-heading">
                <strong>Main menu links</strong>
                <button
                  type="button"
                  onClick={() => addArrayItem("global.navigation.menuItems", { label: "New Link", path: "/", enabled: true, order: navItems.length + 1 })}
                >
                  <Plus className="h-4 w-4" />
                  Add link
                </button>
              </div>
              <div className="admin-row-stack">
                {navItems.map((item, index) => (
                  <div key={`${item.label}-${index}`} className="admin-repeat-row is-menu-row">
                    <Switch checked={item.enabled !== false} onCheckedChange={(value) => updateArrayItem("global.navigation.menuItems", index, "enabled", value)} />
                    <Input value={item.label || ""} onChange={(event) => updateArrayItem("global.navigation.menuItems", index, "label", event.target.value)} placeholder="Label" />
                    <Input value={item.path || ""} onChange={(event) => updateArrayItem("global.navigation.menuItems", index, "path", event.target.value)} placeholder="/path" />
                    <Input type="number" value={item.order || index + 1} onChange={(event) => updateArrayItem("global.navigation.menuItems", index, "order", Number(event.target.value))} />
                    <button type="button" onClick={() => removeArrayItem("global.navigation.menuItems", index)} aria-label={`Remove ${item.label || "menu link"}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </SettingsSection>
          )}

          {active === "booking" && (
            <SettingsSection title="Booking Experience" description="Manage the booking page text, follow-up details, packages shown to clients, and budget options.">
              <div className="admin-form-grid">
                <Field label="Booking page subtitle" value={get("pages.booking.hero.subtitle")} onChange={(value) => update("pages.booking.hero.subtitle", value)} />
                <Field label="Brief label" value={get("pages.booking.briefLabel")} onChange={(value) => update("pages.booking.briefLabel", value)} />
                <div className="md:col-span-2">
                  <Field label="Booking page title" value={get("pages.booking.hero.title")} onChange={(value) => update("pages.booking.hero.title", value)} />
                </div>
                <div className="md:col-span-2">
                  <Field label="Booking page description" multiline value={get("pages.booking.hero.description")} onChange={(value) => update("pages.booking.hero.description", value)} />
                </div>
                <Field label="Deposit amount" value={get("pages.booking.depositAmount")} onChange={(value) => update("pages.booking.depositAmount", value)} />
                <Field label="Confirmation email" type="email" value={get("pages.booking.confirmationEmail")} onChange={(value) => update("pages.booking.confirmationEmail", value)} />
                <div className="md:col-span-2">
                  <Field label="Confirmation message" multiline value={get("pages.booking.confirmationMessage")} onChange={(value) => update("pages.booking.confirmationMessage", value)} />
                </div>
                <div className="md:col-span-2">
                  <Field label="Confirmation WhatsApp message" multiline value={get("pages.booking.confirmationWhatsAppMessage")} onChange={(value) => update("pages.booking.confirmationWhatsAppMessage", value)} />
                </div>
              </div>

              <div className="admin-repeat-heading">
                <strong>Bookable services</strong>
                <button
                  type="button"
                  onClick={() => addArrayItem("pages.booking.services", { value: "new-service", label: "New Service", note: "", enabled: true, order: bookingServices.length + 1 })}
                >
                  <Plus className="h-4 w-4" />
                  Add service
                </button>
              </div>
              <div className="admin-row-stack">
                {bookingServices.map((service, index) => (
                  <div key={`${service.value}-${index}`} className="admin-repeat-row is-booking-row">
                    <Switch checked={service.enabled !== false} onCheckedChange={(value) => updateArrayItem("pages.booking.services", index, "enabled", value)} />
                    <Input value={service.value || ""} onChange={(event) => updateArrayItem("pages.booking.services", index, "value", event.target.value)} placeholder="value" />
                    <Input value={service.label || ""} onChange={(event) => updateArrayItem("pages.booking.services", index, "label", event.target.value)} placeholder="Label" />
                    <Input value={service.note || ""} onChange={(event) => updateArrayItem("pages.booking.services", index, "note", event.target.value)} placeholder="Short note" />
                    <button type="button" onClick={() => removeArrayItem("pages.booking.services", index)} aria-label={`Remove ${service.label || "service"}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="admin-repeat-heading">
                <strong>Budget options</strong>
                <button
                  type="button"
                  onClick={() => addArrayItem("pages.booking.budgets", { label: "New Budget", enabled: true, order: bookingBudgets.length + 1 })}
                >
                  <Plus className="h-4 w-4" />
                  Add budget
                </button>
              </div>
              <div className="admin-row-stack">
                {bookingBudgets.map((budget, index) => (
                  <div key={`${budget.label}-${index}`} className="admin-repeat-row is-budget-row">
                    <Switch checked={budget.enabled !== false} onCheckedChange={(value) => updateArrayItem("pages.booking.budgets", index, "enabled", value)} />
                    <Input value={budget.label || ""} onChange={(event) => updateArrayItem("pages.booking.budgets", index, "label", event.target.value)} placeholder="Budget label" />
                    <Input type="number" value={budget.order || index + 1} onChange={(event) => updateArrayItem("pages.booking.budgets", index, "order", Number(event.target.value))} />
                    <button type="button" onClick={() => removeArrayItem("pages.booking.budgets", index)} aria-label={`Remove ${budget.label || "budget"}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </SettingsSection>
          )}

          {active === "seo" && (
            <SettingsSection title="SEO And Sharing" description="Manage browser title, search description, keywords, and default social sharing image.">
              <div className="admin-form-grid">
                <div className="md:col-span-2">
                  <Field label="Meta title" value={get("global.site.metaTitle")} onChange={(value) => update("global.site.metaTitle", value)} />
                </div>
                <div className="md:col-span-2">
                  <Field label="Meta description" multiline value={get("global.site.metaDescription")} onChange={(value) => update("global.site.metaDescription", value)} />
                </div>
                <div className="md:col-span-2">
                  <Field label="Keywords" multiline value={get("global.site.keywords")} onChange={(value) => update("global.site.keywords", value)} help="Separate keywords with commas." />
                </div>
                <Field label="Open Graph image" value={get("global.site.openGraphImage")} onChange={(value) => update("global.site.openGraphImage", value)} />
                <Field label="Favicon URL" value={get("global.site.favicon")} onChange={(value) => update("global.site.favicon", value)} />
              </div>
            </SettingsSection>
          )}

          {active === "experience" && (
            <SettingsSection title="Visual Experience" description="Control brand colours and performance-sensitive motion effects.">
              <div className="admin-color-grid">
                <Field label="Primary colour" type="color" value={get("global.branding.primaryColor")} onChange={(value) => update("global.branding.primaryColor", value)} />
                <Field label="Accent colour" type="color" value={get("global.branding.accentColor")} onChange={(value) => update("global.branding.accentColor", value)} />
                <Field label="Secondary colour" type="color" value={get("global.branding.secondaryColor")} onChange={(value) => update("global.branding.secondaryColor", value)} />
              </div>
              <div className="admin-repeat-heading">
                <strong>Typography</strong>
                <Type className="h-4 w-4 text-primary" />
              </div>
              <div className="admin-form-grid">
                <Field label="Body font" options={FONT_OPTIONS} value={get("global.branding.bodyFont") || get("global.branding.typography")} onChange={(value) => update("global.branding.bodyFont", value)} />
                <Field label="Heading font" options={FONT_OPTIONS} value={get("global.branding.headingFont") || get("global.branding.typography")} onChange={(value) => update("global.branding.headingFont", value)} />
                <Field label="Display font" options={FONT_OPTIONS} value={get("global.branding.displayFont") || get("global.branding.typography")} onChange={(value) => update("global.branding.displayFont", value)} />
                <Field label="Body text size" type="number" min="14" max="16" value={get("global.branding.textSizes.body")} onChange={(value) => update("global.branding.textSizes.body", Number(value))} help="Recommended: 14-16 px for the centered layout." />
                <Field label="Header logo text size" type="number" min="18" max="24" value={get("global.branding.textSizes.logo")} onChange={(value) => update("global.branding.textSizes.logo", Number(value))} help="Used when no header image logo is uploaded." />
                <Field label="Footer logo text size" type="number" min="22" max="30" value={get("global.branding.textSizes.footerLogo")} onChange={(value) => update("global.branding.textSizes.footerLogo", Number(value))} help="Recommended: 22-30 px." />
                <Field label="Navigation text size" type="number" min="10" max="12" value={get("global.branding.textSizes.navigation")} onChange={(value) => update("global.branding.textSizes.navigation", Number(value))} help="Recommended: 10-12 px." />
                <Field label="Hero heading max size" type="number" min="46" max="76" value={get("global.branding.textSizes.heroHeading")} onChange={(value) => update("global.branding.textSizes.heroHeading", Number(value))} help="Recommended: 64-72 px. The public site caps this at 76 px." />
                <Field label="Section heading max size" type="number" min="30" max="46" value={get("global.branding.textSizes.sectionHeading")} onChange={(value) => update("global.branding.textSizes.sectionHeading", Number(value))} help="Recommended: 38-42 px. The public site caps this at 46 px." />
              </div>
              <div className="admin-toggle-grid">
                <ToggleRow label="Preloader" checked={Boolean(get("global.animations.preloader", true))} onChange={(value) => update("global.animations.preloader", value)} />
                <ToggleRow label="Custom cursor" checked={Boolean(get("global.animations.cursor", true))} onChange={(value) => update("global.animations.cursor", value)} />
                <ToggleRow label="Scroll progress" checked={Boolean(get("global.animations.scrollProgress", true))} onChange={(value) => update("global.animations.scrollProgress", value)} />
                <ToggleRow label="Parallax" checked={Boolean(get("global.animations.parallax", true))} onChange={(value) => update("global.animations.parallax", value)} />
                <ToggleRow label="Horizontal portfolio scroll" checked={Boolean(get("global.animations.horizontalScrolling", true))} onChange={(value) => update("global.animations.horizontalScrolling", value)} />
                <ToggleRow label="Image reveals" checked={Boolean(get("global.animations.imageReveals", true))} onChange={(value) => update("global.animations.imageReveals", value)} />
                <ToggleRow label="Hover effects" checked={Boolean(get("global.animations.hoverEffects", true))} onChange={(value) => update("global.animations.hoverEffects", value)} />
                <ToggleRow label="Section entrances" checked={Boolean(get("global.animations.sectionEntrances", true))} onChange={(value) => update("global.animations.sectionEntrances", value)} />
              </div>
              <div className="admin-form-grid">
                <Field label="Animation speed" type="number" value={get("global.animations.speed")} onChange={(value) => update("global.animations.speed", Number(value))} />
                <Field label="Animation intensity" type="number" value={get("global.animations.intensity")} onChange={(value) => update("global.animations.intensity", Number(value))} />
                <Field label="Transition style" value={get("global.animations.transitionStyle")} onChange={(value) => update("global.animations.transitionStyle", value)} />
                <Field label="Button style" value={get("global.branding.buttonStyle")} onChange={(value) => update("global.branding.buttonStyle", value)} />
              </div>
            </SettingsSection>
          )}

          {active === "legal" && (
            <>
              <SettingsSection title="Legal And Footer Links" description="Each footer legal link has its own editable content, slug, footer visibility, optional PDF, and SEO fields.">
                <div className="admin-repeat-heading">
                  <div>
                    <strong>Footer legal links</strong>
                    <span className="admin-muted-inline">Manage the document behind each legal footer link.</span>
                  </div>
                  <button type="button" onClick={handleNewLegalDocument}>
                    <Plus className="h-4 w-4" />
                    Add legal link
                  </button>
                </div>

                <div className="admin-legal-link-list">
                  {legalLoading ? (
                    <div className="admin-empty-state">Loading legal documents...</div>
                  ) : legalDocuments.length === 0 ? (
                    <div className="admin-empty-state">No legal documents yet.</div>
                  ) : (
                    legalDocuments.map((document) => (
                      <article key={document.id || document.slug} className="admin-legal-link-row">
                        <div className="admin-legal-link-main">
                          <span className="admin-legal-order">{String(document.sort_order || 0).padStart(2, "0")}</span>
                          <div>
                            <strong>{document.footer_label || document.title}</strong>
                            <p>{legalPath(document.slug)}</p>
                          </div>
                        </div>

                        <div className="admin-legal-link-meta">
                          <span className={document.show_in_footer ? "is-visible" : "is-hidden"}>
                            {document.show_in_footer ? "Shown in footer" : "Hidden from footer"}
                          </span>
                          {document.pdf_url && <em>PDF attached</em>}
                        </div>

                        <div className="admin-legal-row-actions">
                          <button type="button" onClick={() => handleManageLegalDocument(document)}>
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                          <button type="button" onClick={() => handleToggleLegalDocument(document)}>
                            {document.show_in_footer ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            {document.show_in_footer ? "Hide" : "Show"}
                          </button>
                          <button type="button" onClick={() => handleManageLegalDocument(document)}>
                            <FileText className="h-4 w-4" />
                            Manage Document
                          </button>
                          <button type="button" onClick={() => handleDeleteLegalDocument(document)} className="is-danger">
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>

                <div className="admin-danger-zone">
                  <div>
                    <strong>Restore default content</strong>
                    <p>This resets settings and page builder content back to the original Ikulungwane defaults.</p>
                  </div>
                  <button type="button" onClick={handleRestoreDefaults}>
                    Restore Defaults
                  </button>
                </div>
              </SettingsSection>

              <Dialog open={Boolean(legalEditing)} onOpenChange={(open) => !open && setLegalEditing(null)}>
                <DialogContent className="bg-[#111] border-white/10 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-display text-xl text-white">
                      {legalEditing?.id ? "Manage Document" : "Add Legal Document"}
                    </DialogTitle>
                  </DialogHeader>

                  {legalEditing && (
                    <div className="admin-dialog-form admin-legal-editor-form">
                      <div className="admin-form-grid">
                        <Field label="Title" value={legalEditing.title} onChange={(value) => handleLegalField("title", value)} />
                        <Field label="Slug" value={legalEditing.slug} onChange={(value) => handleLegalField("slug", value)} help="Use privacy, terms, or cookies for the main public legal pages." />
                        <Field label="Footer label" value={legalEditing.footer_label} onChange={(value) => handleLegalField("footer_label", value)} />
                        <Field label="Sort order" type="number" value={legalEditing.sort_order} onChange={(value) => handleLegalField("sort_order", Number(value))} />
                        <div className="md:col-span-2">
                          <Field
                            label="Content editor"
                            multiline
                            value={legalEditing.content}
                            onChange={(value) => handleLegalField("content", value)}
                            help="Write the legal document content here. Use blank lines to separate paragraphs."
                          />
                        </div>
                      </div>

                      <AdminDocumentField
                        label="Optional uploaded PDF"
                        value={legalEditing.pdf_url}
                        documentName={legalEditing.footer_label || legalEditing.title}
                        onChange={(fileUrl) => handleLegalField("pdf_url", fileUrl)}
                        help="Attach a PDF only when you want visitors to download a formal document."
                      />

                      <div className="admin-form-grid">
                        <div className="md:col-span-2">
                          <Field label="SEO title" value={legalEditing.meta_title} onChange={(value) => handleLegalField("meta_title", value)} />
                        </div>
                        <div className="md:col-span-2">
                          <Field label="SEO description" multiline value={legalEditing.meta_description} onChange={(value) => handleLegalField("meta_description", value)} />
                        </div>
                      </div>

                      <ToggleRow
                        label="Show in footer"
                        checked={Boolean(legalEditing.show_in_footer)}
                        onChange={(value) => handleLegalField("show_in_footer", value)}
                        help="When enabled, this document appears in the footer legal links."
                      />

                      <div className="admin-dialog-actions">
                        <button type="button" className="admin-secondary-action" onClick={() => setLegalEditing(null)}>
                          Cancel
                        </button>
                        <button type="button" className="admin-primary-action" disabled={legalSaving} onClick={handleSaveLegalDocument}>
                          <Save className="h-4 w-4" />
                          {legalSaving ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
