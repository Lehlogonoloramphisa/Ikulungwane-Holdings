const getEmailEndpoint = () => {
  const configuredEndpoint = import.meta.env?.VITE_EMAIL_ENDPOINT;
  if (configuredEndpoint) return configuredEndpoint;

  return "/api/send-email.php";
};

const splitEmails = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/[\n,;]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

export const listToEmailLines = (items = []) => splitEmails(items).join("\n");

export const emailLinesToList = (value) => splitEmails(value);

const publicEmailSettings = (settings = {}) => ({
  enabled: settings.enabled === true,
  provider: settings.provider || "cpanel",
  smtpHost: settings.smtpHost || "",
  smtpPort: Number(settings.smtpPort) || 465,
  smtpSecure: settings.smtpSecure !== false,
  smtpUsername: settings.smtpUsername || "",
  fromName: settings.fromName || "",
  fromEmail: settings.fromEmail || "",
  replyToEmail: settings.replyToEmail || "",
  notificationEmails: splitEmails(settings.notificationEmails),
  adminNotifications: settings.adminNotifications !== false,
  clientAutoReplies: settings.clientAutoReplies === true,
  contactSubject: settings.contactSubject || "New website enquiry",
  bookingSubject: settings.bookingSubject || "New booking request",
  contactAutoReplySubject: settings.contactAutoReplySubject || "We received your enquiry",
  contactAutoReplyMessage: settings.contactAutoReplyMessage || "",
  bookingAutoReplySubject: settings.bookingAutoReplySubject || "We received your booking request",
  bookingAutoReplyMessage: settings.bookingAutoReplyMessage || "",
});

export const sendSiteEmail = async ({ type, payload = {}, cms }) => {
  const emailSettings = publicEmailSettings(cms?.global?.email);

  if (!emailSettings.enabled) {
    return { ok: true, skipped: true, reason: "Email notifications are disabled." };
  }

  if (typeof fetch !== "function") {
    return { ok: false, skipped: true, reason: "Fetch is not available in this environment." };
  }

  try {
    const response = await fetch(getEmailEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, payload, emailSettings }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message: result.error || "Email could not be sent.",
      };
    }

    return { ok: true, ...result };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Email could not be sent.",
    };
  }
};
