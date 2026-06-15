<?php
/**
 * cPanel SMTP configuration template.
 *
 * Copy this file to:
 *   public_html/api/email-config.php
 *
 * Then replace the values below with the SMTP details from:
 *   cPanel -> Email Accounts -> Connect Devices
 *
 * Do not commit the real email-config.php file with passwords.
 */
return [
    'smtp_host' => 'mail.yourdomain.co.za',
    'smtp_port' => 465,
    'smtp_secure' => true,
    'smtp_verify_peer' => true,
    'smtp_username' => 'info@yourdomain.co.za',
    'smtp_password' => 'replace-with-cpanel-mailbox-password',

    'from_name' => 'Ikulungwane Holdings',
    'from_email' => 'info@yourdomain.co.za',
    'reply_to_email' => 'info@yourdomain.co.za',
    'notification_emails' => ['info@yourdomain.co.za'],
    'test_recipient' => 'info@yourdomain.co.za',

    'admin_notifications' => true,
    'client_auto_replies' => false,

    'contact_subject' => 'New website enquiry',
    'booking_subject' => 'New booking request',
    'contact_auto_reply_subject' => 'We received your enquiry',
    'contact_auto_reply_message' => 'Thank you for contacting Ikulungwane Holdings. We have received your message and will respond within one business day.',
    'booking_auto_reply_subject' => 'We received your booking request',
    'booking_auto_reply_message' => 'Thank you for sending your creative brief. We will review the details and respond within one business day.',
];
