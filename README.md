# Ikulungwane React Site

This is a React + Vite version of the Ikulungwane Holdings website with a cPanel/PHP installer for first-time setup.

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy To cPanel

Build the site:

```bash
npm run build
```

Upload the contents of `dist` into your cPanel `public_html` folder. Upload the contents inside `dist`, not the `dist` folder itself.

The build includes a cPanel `.htaccess` file so React routes like `/portfolio`, `/contact`, and `/admin/login` continue to work after refresh.

If `/admin/login`, `/setup`, or `/portfolio` shows a cPanel 404 page, the `.htaccess` rewrite file is missing or not being read. In cPanel File Manager:

1. Open `public_html`.
2. Click **Settings**.
3. Enable **Show Hidden Files (dotfiles)**.
4. Confirm `public_html/.htaccess` exists.
5. If it does not exist, upload `htaccess.txt`, rename it to `.htaccess`, and keep it in `public_html`.

## First-Time Installer

After uploading to cPanel, open:

```text
https://yourdomain.com/setup
```

The installer wizard uses these routes:

- `/setup`
- `/setup/database`
- `/setup/admin`
- `/setup/site`
- `/setup/finish`

The setup flow:

1. Welcome
2. System Requirements
3. Database Setup
4. Admin Account
5. Website Settings
6. Finish Installation

The installer collects database credentials, creates the database tables, creates the first `super_admin`, saves website settings, writes the server-side database config to `public_html/api/config/database.php`, inserts the `installed=true` flag, then redirects to `/admin/login`.

For cPanel/phpMyAdmin, use MySQL/MariaDB. Do not import `database/postgres/schema.sql` into phpMyAdmin. That file is only for PostgreSQL and will fail on MariaDB with syntax errors such as `CREATE EXTENSION IF NOT EXISTS pgcrypto`.

If you need a manual phpMyAdmin import, use:

```text
database/mysql/schema.sql
```

If the installer shows `SQLSTATE[HY000] [1045] Access denied`, MySQL rejected the database username or password. In cPanel, copy the exact MySQL username, reset that database user's password if needed, then use **Add User To Database** and grant **All Privileges**.

For security:

- Database credentials are posted to `public_html/api/setup.php`.
- The database password is not stored in frontend code.
- Setup does not use `localStorage` for database configuration.
- After `installed=true`, `/setup` redirects to `/admin/login` for normal visitors.

## cPanel Email

Contact and booking forms send email through `public_html/api/send-email.php`.

After uploading the build:

1. In cPanel File Manager, open `public_html/api`.
2. Copy `email-config.example.php` to `email-config.php`.
3. Edit `email-config.php` and add the SMTP details from **cPanel -> Email Accounts -> Connect Devices**.

Example values:

```bash
CPANEL_SMTP_HOST=mail.yourdomain.co.za
CPANEL_SMTP_PORT=465
CPANEL_SMTP_SECURE=true
CPANEL_SMTP_USER=info@yourdomain.co.za
CPANEL_SMTP_PASS=your-cpanel-mailbox-password
SMTP_FROM_NAME=Ikulungwane Holdings
SMTP_FROM_EMAIL=info@yourdomain.co.za
SMTP_TO_EMAIL=info@yourdomain.co.za
EMAIL_TEST_RECIPIENT=info@yourdomain.co.za
EMAIL_CLIENT_AUTOREPLIES=false
```

In `email-config.php`, those become:

```php
'smtp_host' => 'mail.yourdomain.co.za',
'smtp_port' => 465,
'smtp_secure' => true,
'smtp_verify_peer' => true,
'smtp_username' => 'info@yourdomain.co.za',
'smtp_password' => 'your-cpanel-mailbox-password',
'from_email' => 'info@yourdomain.co.za',
'notification_emails' => ['info@yourdomain.co.za'],
```

Then open **Admin -> Settings -> Email**, enable website email, save, and use **Send test email**.

## Local Development

The local Vite server does not execute PHP, so `/setup` can display the wizard but cannot complete installation locally unless you run it behind a PHP server.

When PHP is unavailable, public pages, contact forms, bookings, and admin CRUD screens still use browser `localStorage` through `src/api/localClient.js` for development fallback.
