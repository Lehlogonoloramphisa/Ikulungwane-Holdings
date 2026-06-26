<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function json_response($status, $body) {
    http_response_code($status);
    echo json_encode($body);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, ['error' => 'Only POST requests are supported.']);
}

function clean_header($value) {
    return trim(str_replace(["\r", "\n"], ' ', (string) $value));
}

function env_value($key, $fallback = '') {
    $value = getenv($key);
    return $value === false ? $fallback : $value;
}

function parse_bool($value, $fallback = false) {
    if ($value === null || $value === '') {
        return $fallback;
    }
    if (is_bool($value)) {
        return $value;
    }
    return in_array(strtolower((string) $value), ['1', 'true', 'yes', 'on'], true);
}

function split_emails($value) {
    if (is_array($value)) {
        $items = $value;
    } else {
        $items = preg_split('/[\n,;]+/', (string) $value);
    }

    $emails = [];
    foreach ($items as $item) {
        $email = clean_header($item);
        if (filter_var($email, FILTER_VALIDATE_EMAIL) && !in_array($email, $emails, true)) {
            $emails[] = $email;
        }
    }
    return $emails;
}

function escape_html($value) {
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function rows_to_text($rows) {
    $lines = [];
    foreach ($rows as $row) {
        if (isset($row[1]) && trim((string) $row[1]) !== '') {
            $lines[] = $row[0] . ': ' . trim((string) $row[1]);
        }
    }
    return implode("\n", $lines);
}

function rows_to_html($rows) {
    $html = '';
    foreach ($rows as $row) {
        if (isset($row[1]) && trim((string) $row[1]) !== '') {
            $html .= '<tr>';
            $html .= '<td style="padding:10px 14px;border-bottom:1px solid #ececec;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">' . escape_html($row[0]) . '</td>';
            $html .= '<td style="padding:10px 14px;border-bottom:1px solid #ececec;color:#111827;font-size:14px;">' . escape_html($row[1]) . '</td>';
            $html .= '</tr>';
        }
    }
    return $html;
}

function booking_rows($payload) {
    return [
        ['Reference', $payload['reference'] ?? ''],
        ['Name', $payload['full_name'] ?? ''],
        ['Email', $payload['email'] ?? ''],
        ['Phone', $payload['phone'] ?? ''],
        ['Service', $payload['event_type'] ?? ''],
        ['Date', $payload['event_date'] ?? ''],
        ['Location', $payload['event_location'] ?? ''],
        ['Budget', $payload['budget_range'] ?? ''],
        ['Notes', $payload['notes'] ?? ''],
    ];
}

function contact_rows($payload) {
    return [
        ['Name', $payload['name'] ?? ''],
        ['Email', $payload['email'] ?? ''],
        ['Phone', $payload['phone'] ?? ''],
        ['Service', $payload['service_interested'] ?? ''],
        ['Message', $payload['message'] ?? ''],
    ];
}

function build_admin_message($type, $payload, $config) {
    if ($type === 'test') {
        return [
            'subject' => 'Ikulungwane email test',
            'text' => 'This is a test email from your Ikulungwane Holdings website cPanel SMTP setup.',
            'html' => '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;"><h1 style="margin:0 0 12px;font-size:24px;">Email setup is connected.</h1><p>This test was sent from the Ikulungwane Holdings website through the configured cPanel SMTP mailbox.</p></div>',
        ];
    }

    $is_booking = $type === 'booking';
    $rows = $is_booking ? booking_rows($payload) : contact_rows($payload);
    $title = $is_booking ? 'New booking request' : 'New website enquiry';
    $subject = clean_header($is_booking ? ($config['booking_subject'] ?? $title) : ($config['contact_subject'] ?? $title));

    return [
        'subject' => $subject ?: $title,
        'text' => $title . "\n\n" . rows_to_text($rows),
        'html' => '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;"><p style="margin:0 0 8px;color:#e11d2e;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;">Ikulungwane Holdings</p><h1 style="margin:0 0 18px;font-size:26px;">' . escape_html($title) . '</h1><table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #ececec;border-collapse:collapse;">' . rows_to_html($rows) . '</table></div>',
    ];
}

function build_auto_reply($type, $payload, $config) {
    $is_booking = $type === 'booking';
    $subject = clean_header($is_booking ? ($config['booking_auto_reply_subject'] ?? 'We received your booking request') : ($config['contact_auto_reply_subject'] ?? 'We received your enquiry'));
    $message = (string) ($is_booking ? ($config['booking_auto_reply_message'] ?? '') : ($config['contact_auto_reply_message'] ?? ''));
    $message = str_replace('{reference}', (string) ($payload['reference'] ?? ''), $message);

    return [
        'subject' => $subject ?: 'We received your message',
        'text' => $message,
        'html' => '<div style="font-family:Arial,sans-serif;line-height:1.7;color:#111827;"><p style="margin:0 0 8px;color:#e11d2e;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;">Ikulungwane Holdings</p><h1 style="margin:0 0 16px;font-size:24px;">' . escape_html($subject ?: 'We received your message') . '</h1><p>' . nl2br(escape_html($message)) . '</p></div>',
    ];
}

class SimpleSmtpMailer {
    private $socket;
    private $host;
    private $port;
    private $secure;
    private $verify_peer;
    private $username;
    private $password;

    public function __construct($host, $port, $secure, $verify_peer, $username, $password) {
        $this->host = $host;
        $this->port = (int) $port;
        $this->secure = (bool) $secure;
        $this->verify_peer = (bool) $verify_peer;
        $this->username = $username;
        $this->password = $password;
    }

    public function send($from_email, $from_name, $to, $reply_to, $subject, $text, $html) {
        $recipients = split_emails($to);
        if (count($recipients) === 0) {
            throw new Exception('No valid recipients were provided.');
        }

        $this->connect();
        $server_name = $_SERVER['SERVER_NAME'] ?? 'localhost';
        $this->command('EHLO ' . $server_name, [250]);

        if ($this->secure && $this->port !== 465) {
            $this->command('STARTTLS', [220]);
            if (!stream_socket_enable_crypto($this->socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new Exception('Unable to start TLS encryption.');
            }
            $this->command('EHLO ' . $server_name, [250]);
        }

        $this->command('AUTH LOGIN', [334]);
        $this->command(base64_encode($this->username), [334]);
        $this->command(base64_encode($this->password), [235]);
        $this->command('MAIL FROM:<' . $from_email . '>', [250]);

        foreach ($recipients as $recipient) {
            $this->command('RCPT TO:<' . $recipient . '>', [250, 251]);
        }

        $this->command('DATA', [354]);
        $message = $this->build_message($from_email, $from_name, $recipients, $reply_to, $subject, $text, $html);
        fwrite($this->socket, $this->dot_stuff($message) . "\r\n.\r\n");
        $this->expect([250]);
        $this->command('QUIT', [221]);
        fclose($this->socket);

        return uniqid('cpanel-', true);
    }

    private function connect() {
        $transport = ($this->secure && $this->port === 465) ? 'ssl://' : 'tcp://';
        $target = $transport . $this->host . ':' . $this->port;
        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => $this->verify_peer,
                'verify_peer_name' => $this->verify_peer,
                'allow_self_signed' => false,
            ],
        ]);

        $errno = 0;
        $errstr = '';
        $this->socket = stream_socket_client($target, $errno, $errstr, 20, STREAM_CLIENT_CONNECT, $context);
        if (!$this->socket) {
            throw new Exception('SMTP connection failed: ' . $errstr);
        }
        stream_set_timeout($this->socket, 20);
        $this->expect([220]);
    }

    private function command($command, $expected_codes) {
        fwrite($this->socket, $command . "\r\n");
        return $this->expect($expected_codes);
    }

    private function expect($expected_codes) {
        $response = '';
        while (($line = fgets($this->socket, 515)) !== false) {
            $response .= $line;
            if (preg_match('/^\d{3}\s/', $line)) {
                break;
            }
        }

        $code = (int) substr($response, 0, 3);
        if (!in_array($code, $expected_codes, true)) {
            throw new Exception('SMTP error: ' . trim($response));
        }

        return $response;
    }

    private function build_message($from_email, $from_name, $to, $reply_to, $subject, $text, $html) {
        $boundary = 'b_' . bin2hex(random_bytes(12));
        $headers = [
            'MIME-Version: 1.0',
            'Date: ' . date(DATE_RFC2822),
            'From: ' . $this->format_address($from_email, $from_name),
            'To: ' . implode(', ', $to),
            'Reply-To: ' . clean_header($reply_to ?: $from_email),
            'Subject: ' . clean_header($subject),
            'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . ($_SERVER['SERVER_NAME'] ?? 'localhost') . '>',
            'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
        ];

        return implode("\r\n", $headers)
            . "\r\n\r\n--" . $boundary
            . "\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n"
            . $text
            . "\r\n\r\n--" . $boundary
            . "\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n"
            . $html
            . "\r\n\r\n--" . $boundary . "--";
    }

    private function format_address($email, $name) {
        $clean_name = addcslashes(clean_header($name), '"\\');
        return '"' . $clean_name . '" <' . clean_header($email) . '>';
    }

    private function dot_stuff($message) {
        $normalized = str_replace(["\r\n", "\r"], "\n", $message);
        $stuffed = preg_replace('/^\./m', '..', $normalized);
        return str_replace("\n", "\r\n", $stuffed);
    }
}

$raw_body = file_get_contents('php://input');
$body = json_decode($raw_body ?: '{}', true);
if (!is_array($body)) {
    json_response(400, ['error' => 'Invalid JSON body.']);
}

$config = [
    'smtp_host' => env_value('CPANEL_SMTP_HOST', env_value('SMTP_HOST')),
    'smtp_port' => (int) env_value('CPANEL_SMTP_PORT', env_value('SMTP_PORT', 465)),
    'smtp_secure' => parse_bool(env_value('CPANEL_SMTP_SECURE', env_value('SMTP_SECURE')), true),
    'smtp_verify_peer' => parse_bool(env_value('SMTP_VERIFY_PEER'), true),
    'smtp_username' => env_value('CPANEL_SMTP_USER', env_value('SMTP_USER')),
    'smtp_password' => env_value('CPANEL_SMTP_PASS', env_value('SMTP_PASS')),
    'from_name' => env_value('SMTP_FROM_NAME', 'Ikulungwane Holdings'),
    'from_email' => env_value('SMTP_FROM_EMAIL'),
    'reply_to_email' => env_value('SMTP_REPLY_TO_EMAIL'),
    'notification_emails' => split_emails(env_value('SMTP_TO_EMAIL', env_value('ADMIN_EMAIL'))),
    'test_recipient' => env_value('EMAIL_TEST_RECIPIENT'),
    'admin_notifications' => parse_bool(env_value('EMAIL_ADMIN_NOTIFICATIONS'), true),
    'client_auto_replies' => parse_bool(env_value('EMAIL_CLIENT_AUTOREPLIES'), false),
    'contact_subject' => 'New website enquiry',
    'booking_subject' => 'New booking request',
    'contact_auto_reply_subject' => 'We received your enquiry',
    'contact_auto_reply_message' => 'Thank you for contacting Ikulungwane Holdings. We have received your message and will respond within one business day.',
    'booking_auto_reply_subject' => 'We received your booking request',
    'booking_auto_reply_message' => 'Thank you for sending your creative brief. We will review the details and respond within one business day.',
];

$config_file = __DIR__ . '/email-config.php';
if (file_exists($config_file)) {
    $file_config = include $config_file;
    if (is_array($file_config)) {
        $config = array_merge($config, $file_config);
    }
}

$config['smtp_host'] = clean_header($config['smtp_host'] ?? '');
$config['smtp_port'] = (int) ($config['smtp_port'] ?? 465);
$config['smtp_username'] = clean_header($config['smtp_username'] ?? '');
$config['smtp_password'] = (string) ($config['smtp_password'] ?? '');
$config['from_email'] = clean_header($config['from_email'] ?: $config['smtp_username']);
$config['from_name'] = clean_header($config['from_name'] ?? 'Ikulungwane Holdings');
$config['reply_to_email'] = clean_header($config['reply_to_email'] ?: $config['from_email']);
$config['notification_emails'] = split_emails($config['notification_emails'] ?? []);
$config['test_recipient'] = split_emails($config['test_recipient'] ?? ($config['notification_emails'][0] ?? ''));

if (
    !$config['smtp_host']
    || !$config['smtp_port']
    || !$config['smtp_username']
    || !$config['smtp_password']
    || $config['smtp_password'] === 'replace-with-cpanel-mailbox-password'
    || !filter_var($config['from_email'], FILTER_VALIDATE_EMAIL)
) {
    json_response(500, [
        'error' => 'Email is not fully configured. Copy public_html/api/email-config.example.php to public_html/api/email-config.php and add the cPanel SMTP details.',
    ]);
}

$type = clean_header($body['type'] ?? 'contact');
$payload = is_array($body['payload'] ?? null) ? $body['payload'] : [];
$mailer = new SimpleSmtpMailer(
    $config['smtp_host'],
    $config['smtp_port'],
    parse_bool($config['smtp_secure'] ?? true, true),
    parse_bool($config['smtp_verify_peer'] ?? true, true),
    $config['smtp_username'],
    $config['smtp_password']
);

$sent = [];

try {
    if (($config['admin_notifications'] || $type === 'test') && ($type === 'test' ? count($config['test_recipient']) : count($config['notification_emails']))) {
        $message = build_admin_message($type, $payload, $config);
        $reply_to = filter_var($payload['email'] ?? '', FILTER_VALIDATE_EMAIL) ? $payload['email'] : $config['reply_to_email'];
        $message_id = $mailer->send(
            $config['from_email'],
            $config['from_name'],
            $type === 'test' ? $config['test_recipient'] : $config['notification_emails'],
            $reply_to,
            $message['subject'],
            $message['text'],
            $message['html']
        );
        $sent[] = ['kind' => 'admin', 'messageId' => $message_id];
    }

    $client_email = split_emails($payload['email'] ?? '')[0] ?? '';
    if ($type !== 'test' && $config['client_auto_replies'] && $client_email) {
        $message = build_auto_reply($type, $payload, $config);
        $message_id = $mailer->send(
            $config['from_email'],
            $config['from_name'],
            [$client_email],
            $config['reply_to_email'],
            $message['subject'],
            $message['text'],
            $message['html']
        );
        $sent[] = ['kind' => 'client', 'messageId' => $message_id];
    }
} catch (Exception $error) {
    json_response(502, ['error' => $error->getMessage()]);
}

if (count($sent) === 0) {
    json_response(200, ['ok' => true, 'skipped' => true, 'message' => 'No email recipients were enabled.']);
}

json_response(200, ['ok' => true, 'sent' => $sent]);
