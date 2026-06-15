-- Optional starter seed for Ikulungwane Holdings.
-- Run this after schema.sql if you want default settings rows and page keys.
-- Do not store plain text passwords in production.

BEGIN;

INSERT INTO site_settings (setting_key, value, description)
VALUES
  (
    'global',
    '{
      "site": {
        "companyName": "Ikulungwane Holdings",
        "shortName": "Ikulungwane",
        "tagline": "Premium Photography & Videography",
        "logoText": "Ikulungwane.",
        "logoImage": "",
        "logoAlt": "Ikulungwane Holdings logo",
        "favicon": "",
        "metaTitle": "Ikulungwane Holdings | Premium Creative Studio",
        "metaDescription": "Photography, videography, branding, marketing, and web experiences for brands, events, and creative campaigns.",
        "keywords": "photography, videography, branding, web design, marketing, South Africa"
      },
      "contact": {
        "email": "info@ikulungwaneholdings.co.za",
        "phone": "+27 69 548 7625",
        "whatsapp": "+27695487625",
        "whatsappUrl": "https://wa.me/27695487625",
        "address": "400 16th Road, Midrand, Gauteng",
        "workingHours": "Monday-Friday, 09:00-17:00",
        "googleMapsUrl": ""
      },
      "email": {
        "enabled": false,
        "provider": "cpanel",
        "smtpHost": "mail.ikulungwaneholdings.co.za",
        "smtpPort": 465,
        "smtpSecure": true,
        "smtpUsername": "info@ikulungwaneholdings.co.za",
        "passwordSecretName": "CPANEL_SMTP_PASS",
        "fromName": "Ikulungwane Holdings",
        "fromEmail": "info@ikulungwaneholdings.co.za",
        "replyToEmail": "info@ikulungwaneholdings.co.za",
        "notificationEmails": ["info@ikulungwaneholdings.co.za"],
        "adminNotifications": true,
        "clientAutoReplies": false,
        "testRecipient": "info@ikulungwaneholdings.co.za",
        "contactSubject": "New website enquiry",
        "bookingSubject": "New booking request"
      },
      "branding": {
        "primaryColor": "#e11d2e",
        "secondaryColor": "#39d6c2",
        "accentColor": "#e11d2e",
        "typography": "Outfit",
        "bodyFont": "Outfit",
        "headingFont": "Outfit",
        "displayFont": "Outfit",
        "textSizes": {
          "logo": 24,
          "footerLogo": 30,
          "navigation": 11,
          "heroHeading": 88,
          "sectionHeading": 52,
          "body": 16
        }
      },
      "animations": {
        "parallax": true,
        "horizontalScrolling": true,
        "imageReveals": true,
        "speed": 1,
        "intensity": 1,
        "transitionStyle": "smooth editorial",
        "hoverEffects": true,
        "sectionEntrances": true,
        "preloader": true,
        "cursor": true,
        "scrollProgress": true
      }
    }'::jsonb,
    'Global website, contact, branding, and animation settings.'
  )
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO email_settings (
  setting_key,
  enabled,
  provider,
  smtp_host,
  smtp_port,
  smtp_secure,
  smtp_username,
  password_secret_name,
  from_name,
  from_email,
  reply_to_email,
  notification_emails,
  admin_notifications,
  client_auto_replies
)
VALUES (
  'primary',
  false,
  'cpanel',
  'mail.ikulungwaneholdings.co.za',
  465,
  true,
  'info@ikulungwaneholdings.co.za',
  'CPANEL_SMTP_PASS',
  'Ikulungwane Holdings',
  'info@ikulungwaneholdings.co.za',
  'info@ikulungwaneholdings.co.za',
  '["info@ikulungwaneholdings.co.za"]'::jsonb,
  true,
  false
)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO page_content (page_key, content)
VALUES
  ('home', '{}'::jsonb),
  ('portfolio', '{}'::jsonb),
  ('services', '{}'::jsonb),
  ('about', '{}'::jsonb),
  ('journal', '{}'::jsonb),
  ('contact', '{}'::jsonb),
  ('booking', '{}'::jsonb)
ON CONFLICT (page_key) DO NOTHING;

-- Example only: create the first admin with a hashed password.
-- Replace the email and password before running, or create admins through your backend.
--
-- INSERT INTO app_users (email, password_hash, full_name, role, verified)
-- VALUES (
--   'owner@example.com',
--   crypt('change-this-password', gen_salt('bf')),
--   'Studio Owner',
--   'admin',
--   true
-- );

COMMIT;
