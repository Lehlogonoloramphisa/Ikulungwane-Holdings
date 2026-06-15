# Ikulungwane Holdings Postgres Database

This folder contains the SQL database foundation for the Ikulungwane Holdings website and admin system.

The current React app still uses browser storage through `src/api/localClient.js`. These SQL files create the real database layer that a backend, cPanel PHP API, Supabase API, or another server can connect to next.

## Files

- `schema.sql` creates the database structure.
- `seed.sql` adds safe starter settings and page keys.

## What The Schema Covers

- Admin and user accounts with hashed password storage
- User sessions and password resets
- Media uploads and logo/favicon assets
- Portfolio projects and project images
- Services, service packages, and FAQs
- Testimonials
- Team members
- Journal/blog posts
- Bookings
- Contact leads/enquiries
- cPanel/SMTP email settings and delivery logs
- Global site settings
- Page builder content
- Audit log table for future admin activity tracking

## Run Locally Or On A Hosted Postgres Database

With `psql`:

```bash
psql "$DATABASE_URL" -f database/postgres/schema.sql
psql "$DATABASE_URL" -f database/postgres/seed.sql
```

For Supabase:

1. Open your Supabase project.
2. Go to SQL Editor.
3. Paste and run `schema.sql`.
4. Paste and run `seed.sql`.

## Create The First Admin

Do not store plain text passwords. The schema stores `password_hash`.

`seed.sql` includes a commented example using Postgres `crypt()`:

```sql
INSERT INTO app_users (email, password_hash, full_name, role, verified)
VALUES (
  'owner@example.com',
  crypt('change-this-password', gen_salt('bf')),
  'Studio Owner',
  'admin',
  true
);
```

Your backend login check should compare passwords with:

```sql
SELECT *
FROM app_users
WHERE lower(email) = lower($1)
  AND password_hash = crypt($2, password_hash);
```

## Mapping From Current Local Storage

The current local API entity names map to these SQL tables:

- `PortfolioProject` -> `portfolio_projects` and `portfolio_project_images`
- `Service` -> `services`, `service_packages`, and `service_faqs`
- `Testimonial` -> `testimonials`
- `TeamMember` -> `team_members`
- `BlogPost` -> `blog_posts`
- `Booking` -> `bookings`
- `ContactMessage` -> `contact_messages`
- `User` -> `app_users`
- Admin cPanel email settings -> `email_settings`
- Sent/failed email history -> `email_delivery_logs`
- CMS/page builder content -> `site_settings` and `page_content`

Most tables include `legacy_id` so existing browser-storage records can be imported without losing their old IDs.

## Important Deployment Note

cPanel/static frontend code should not connect directly to a private SQL database with admin credentials. The next step is to add a secure API layer, for example:

- cPanel PHP endpoints connecting to Postgres/MySQL
- Supabase client with Row Level Security policies
- A small Node/Express API
- A hosted backend service

That API layer should replace `localApi` calls with real database calls.

## cPanel Email Setup

The SQL schema includes `email_settings`, but do not store the actual cPanel mailbox password in the public frontend. For cPanel hosting, store the password in `public_html/api/email-config.php`, which is executed by PHP and should not be committed to Git.

The PHP sender can also read environment variables if your host supports them:

```bash
CPANEL_SMTP_HOST=mail.yourdomain.co.za
CPANEL_SMTP_PORT=465
CPANEL_SMTP_SECURE=true
CPANEL_SMTP_USER=info@yourdomain.co.za
CPANEL_SMTP_PASS=your-cpanel-mailbox-password
SMTP_FROM_EMAIL=info@yourdomain.co.za
SMTP_TO_EMAIL=info@yourdomain.co.za
EMAIL_CLIENT_AUTOREPLIES=false
```

The `password_secret_name` column records which environment variable contains the password when your hosting environment supports secrets. The optional `email_delivery_logs` table can be used by a backend or PHP API to record sent, skipped, or failed notifications.
