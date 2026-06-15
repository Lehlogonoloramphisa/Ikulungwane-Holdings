# Ikulungwane React Site

This is a standalone React + Vite version of the Ikulungwane Holdings website.

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

## Local Data

Public pages, contact forms, bookings, and admin CRUD screens use browser `localStorage` through `src/api/localClient.js`.

Data entered in the admin area is stored in the current browser only. Clearing site data will reset the local content.
