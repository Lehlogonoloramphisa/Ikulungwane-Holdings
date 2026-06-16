-- Ikulungwane Holdings SQL database schema
-- Target database: PostgreSQL 14+.
-- Suitable hosted providers: Supabase, Neon, Railway, Render, or a VPS Postgres instance.
-- Do not import this file into cPanel/phpMyAdmin/MySQL/MariaDB.
-- For cPanel/phpMyAdmin, use database/mysql/schema.sql instead.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE app_user_role AS ENUM ('admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE booking_status AS ENUM (
    'new',
    'pending_review',
    'quotation_sent',
    'confirmed',
    'completed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE lead_status AS ENUM (
    'new',
    'contacted',
    'qualified',
    'converted',
    'closed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  email text NOT NULL,
  password_hash text,
  full_name text,
  role app_user_role NOT NULL DEFAULT 'user',
  verified boolean NOT NULL DEFAULT false,
  provider text,
  provider_subject text,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_users_email_not_blank CHECK (length(trim(email)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS app_users_email_unique_idx
  ON app_users (lower(email));

CREATE INDEX IF NOT EXISTS app_users_role_idx
  ON app_users (role);

DROP TRIGGER IF EXISTS app_users_set_updated_at ON app_users;
CREATE TRIGGER app_users_set_updated_at
BEFORE UPDATE ON app_users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  user_agent text,
  ip_address inet,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS user_sessions_token_hash_unique_idx
  ON user_sessions (token_hash);

CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx
  ON user_sessions (user_id);

CREATE TABLE IF NOT EXISTS password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS password_resets_token_hash_unique_idx
  ON password_resets (token_hash);

CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  file_url text NOT NULL,
  storage_key text,
  original_filename text,
  category text,
  alt_text text,
  mime_type text,
  size_bytes bigint,
  width integer,
  height integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  uploaded_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS media_assets_category_idx
  ON media_assets (category);

DROP TRIGGER IF EXISTS media_assets_set_updated_at ON media_assets;
CREATE TRIGGER media_assets_set_updated_at
BEFORE UPDATE ON media_assets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS portfolio_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  title text NOT NULL,
  slug text NOT NULL,
  category text NOT NULL DEFAULT 'events',
  cover_image text,
  description text,
  video_url text,
  client_name text,
  client_testimonial text,
  location text,
  project_date date,
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT portfolio_projects_title_not_blank CHECK (length(trim(title)) > 0),
  CONSTRAINT portfolio_projects_slug_not_blank CHECK (length(trim(slug)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS portfolio_projects_slug_unique_idx
  ON portfolio_projects (lower(slug));

CREATE INDEX IF NOT EXISTS portfolio_projects_public_idx
  ON portfolio_projects (published, featured, display_order, created_at DESC);

CREATE INDEX IF NOT EXISTS portfolio_projects_category_idx
  ON portfolio_projects (category);

DROP TRIGGER IF EXISTS portfolio_projects_set_updated_at ON portfolio_projects;
CREATE TRIGGER portfolio_projects_set_updated_at
BEFORE UPDATE ON portfolio_projects
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS portfolio_project_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES portfolio_projects(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portfolio_project_images_project_idx
  ON portfolio_project_images (project_id, display_order);

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  title text NOT NULL,
  slug text NOT NULL,
  icon text,
  description text,
  long_description text,
  cover_image text,
  published boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT services_title_not_blank CHECK (length(trim(title)) > 0),
  CONSTRAINT services_slug_not_blank CHECK (length(trim(slug)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS services_slug_unique_idx
  ON services (lower(slug));

CREATE INDEX IF NOT EXISTS services_public_idx
  ON services (published, display_order);

DROP TRIGGER IF EXISTS services_set_updated_at ON services;
CREATE TRIGGER services_set_updated_at
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS service_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name text NOT NULL,
  price text,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS service_packages_service_idx
  ON service_packages (service_id, display_order);

DROP TRIGGER IF EXISTS service_packages_set_updated_at ON service_packages;
CREATE TRIGGER service_packages_set_updated_at
BEFORE UPDATE ON service_packages
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS service_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS service_faqs_service_idx
  ON service_faqs (service_id, display_order);

DROP TRIGGER IF EXISTS service_faqs_set_updated_at ON service_faqs;
CREATE TRIGGER service_faqs_set_updated_at
BEFORE UPDATE ON service_faqs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  client_name text NOT NULL,
  review text NOT NULL,
  rating smallint NOT NULL DEFAULT 5,
  service_type text,
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT testimonials_rating_range CHECK (rating BETWEEN 1 AND 5)
);

CREATE INDEX IF NOT EXISTS testimonials_public_idx
  ON testimonials (published, featured, created_at DESC);

DROP TRIGGER IF EXISTS testimonials_set_updated_at ON testimonials;
CREATE TRIGGER testimonials_set_updated_at
BEFORE UPDATE ON testimonials
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  name text NOT NULL,
  role text,
  bio text,
  photo text,
  specialties jsonb NOT NULL DEFAULT '[]'::jsonb,
  social_instagram text,
  social_linkedin text,
  published boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS team_members_public_idx
  ON team_members (published, display_order);

DROP TRIGGER IF EXISTS team_members_set_updated_at ON team_members;
CREATE TRIGGER team_members_set_updated_at
BEFORE UPDATE ON team_members
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  title text NOT NULL,
  slug text NOT NULL,
  excerpt text,
  content text,
  featured_image text,
  category text NOT NULL DEFAULT 'news',
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  author text,
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  meta_title text,
  meta_description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blog_posts_title_not_blank CHECK (length(trim(title)) > 0),
  CONSTRAINT blog_posts_slug_not_blank CHECK (length(trim(slug)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_unique_idx
  ON blog_posts (lower(slug));

CREATE INDEX IF NOT EXISTS blog_posts_public_idx
  ON blog_posts (published, published_at DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS blog_posts_category_idx
  ON blog_posts (category);

DROP TRIGGER IF EXISTS blog_posts_set_updated_at ON blog_posts;
CREATE TRIGGER blog_posts_set_updated_at
BEFORE UPDATE ON blog_posts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  reference text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  event_type text NOT NULL,
  event_date date,
  event_location text,
  budget_range text,
  notes text,
  status booking_status NOT NULL DEFAULT 'new',
  deposit_amount text,
  confirmation_email text,
  assigned_to uuid REFERENCES app_users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bookings_reference_not_blank CHECK (length(trim(reference)) > 0),
  CONSTRAINT bookings_full_name_not_blank CHECK (length(trim(full_name)) > 0),
  CONSTRAINT bookings_email_not_blank CHECK (length(trim(email)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS bookings_reference_unique_idx
  ON bookings (upper(reference));

CREATE INDEX IF NOT EXISTS bookings_status_idx
  ON bookings (status, created_at DESC);

CREATE INDEX IF NOT EXISTS bookings_email_idx
  ON bookings (lower(email));

DROP TRIGGER IF EXISTS bookings_set_updated_at ON bookings;
CREATE TRIGGER bookings_set_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  service_interested text,
  message text NOT NULL,
  status lead_status NOT NULL DEFAULT 'new',
  assigned_to uuid REFERENCES app_users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contact_messages_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT contact_messages_email_not_blank CHECK (length(trim(email)) > 0),
  CONSTRAINT contact_messages_message_not_blank CHECK (length(trim(message)) > 0)
);

CREATE INDEX IF NOT EXISTS contact_messages_status_idx
  ON contact_messages (status, created_at DESC);

CREATE INDEX IF NOT EXISTS contact_messages_email_idx
  ON contact_messages (lower(email));

DROP TRIGGER IF EXISTS contact_messages_set_updated_at ON contact_messages;
CREATE TRIGGER contact_messages_set_updated_at
BEFORE UPDATE ON contact_messages
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS email_settings (
  setting_key text PRIMARY KEY DEFAULT 'primary',
  enabled boolean NOT NULL DEFAULT false,
  provider text NOT NULL DEFAULT 'cpanel',
  smtp_host text,
  smtp_port integer NOT NULL DEFAULT 465,
  smtp_secure boolean NOT NULL DEFAULT true,
  smtp_username text,
  password_secret_name text NOT NULL DEFAULT 'CPANEL_SMTP_PASS',
  from_name text,
  from_email text,
  reply_to_email text,
  notification_emails jsonb NOT NULL DEFAULT '[]'::jsonb,
  admin_notifications boolean NOT NULL DEFAULT true,
  client_auto_replies boolean NOT NULL DEFAULT false,
  contact_subject text NOT NULL DEFAULT 'New website enquiry',
  booking_subject text NOT NULL DEFAULT 'New booking request',
  contact_auto_reply_subject text NOT NULL DEFAULT 'We received your enquiry',
  contact_auto_reply_message text,
  booking_auto_reply_subject text NOT NULL DEFAULT 'We received your booking request',
  booking_auto_reply_message text,
  updated_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_settings_singleton CHECK (setting_key = 'primary'),
  CONSTRAINT email_settings_port_range CHECK (smtp_port BETWEEN 1 AND 65535)
);

DROP TRIGGER IF EXISTS email_settings_set_updated_at ON email_settings;
CREATE TRIGGER email_settings_set_updated_at
BEFORE UPDATE ON email_settings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS email_delivery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,
  source_id uuid,
  recipient_email text,
  subject text,
  status text NOT NULL DEFAULT 'queued',
  provider_message_id text,
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_delivery_logs_source_idx
  ON email_delivery_logs (source_type, source_id, created_at DESC);

CREATE INDEX IF NOT EXISTS email_delivery_logs_status_idx
  ON email_delivery_logs (status, created_at DESC);

CREATE TABLE IF NOT EXISTS site_settings (
  setting_key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_key_not_blank CHECK (length(trim(setting_key)) > 0)
);

DROP TRIGGER IF EXISTS site_settings_set_updated_at ON site_settings;
CREATE TRIGGER site_settings_set_updated_at
BEFORE UPDATE ON site_settings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS page_content (
  page_key text PRIMARY KEY,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT page_content_key_not_blank CHECK (length(trim(page_key)) > 0)
);

DROP TRIGGER IF EXISTS page_content_set_updated_at ON page_content;
CREATE TRIGGER page_content_set_updated_at
BEFORE UPDATE ON page_content
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS audit_log (
  id bigserial PRIMARY KEY,
  actor_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  table_name text NOT NULL,
  row_id uuid,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_table_row_idx
  ON audit_log (table_name, row_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_log_actor_idx
  ON audit_log (actor_id, created_at DESC);

COMMIT;
