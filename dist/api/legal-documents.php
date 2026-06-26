<?php
header('Content-Type: application/json; charset=utf-8');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

session_start();

define('IKU_DB_CONFIG', __DIR__ . '/config/database.php');

function legal_json($status, $body) {
    http_response_code($status);
    echo json_encode($body);
    exit;
}

function legal_body() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);
    return is_array($data) ? $data : [];
}

function db_config() {
    if (!file_exists(IKU_DB_CONFIG)) {
        legal_json(503, ['error' => 'The system is not installed yet.']);
    }

    $config = include IKU_DB_CONFIG;
    if (!is_array($config)) {
        legal_json(500, ['error' => 'Database configuration is invalid.']);
    }

    return $config;
}

function legal_pdo() {
    $config = db_config();
    $host = $config['host'] ?? 'localhost';
    $port = (int) ($config['port'] ?? 3306);
    $name = $config['name'] ?? '';
    $username = $config['username'] ?? '';
    $password = $config['password'] ?? '';
    $charset = $config['charset'] ?? 'utf8mb4';
    $dsn = "mysql:host={$host};port={$port};dbname={$name};charset={$charset}";

    return new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}

function ensure_legal_table(PDO $pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS legal_documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(191) NOT NULL,
      slug VARCHAR(120) UNIQUE NOT NULL,
      footer_label VARCHAR(191) NOT NULL,
      content LONGTEXT,
      pdf_url LONGTEXT,
      meta_title VARCHAR(191),
      meta_description TEXT,
      show_in_footer TINYINT(1) NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX legal_footer_idx (show_in_footer, sort_order),
      INDEX legal_slug_idx (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function default_legal_documents() {
    return [
        [
            'title' => 'Privacy Policy',
            'slug' => 'privacy',
            'footer_label' => 'Privacy Policy',
            'content' => "We collect the information you share through contact, booking, and enquiry forms so we can respond to your request and deliver creative services.\n\nLocally entered admin and form data is stored in your browser for this standalone React version. Production deployments should connect these forms to your chosen secure backend or CRM.\n\nWe do not sell personal information. Contact us if you need a stored enquiry corrected or removed.",
            'pdf_url' => '',
            'meta_title' => 'Privacy Policy | Ikulungwane Holdings',
            'meta_description' => 'How Ikulungwane Holdings handles website enquiries, bookings, and personal information.',
            'show_in_footer' => 1,
            'sort_order' => 1,
        ],
        [
            'title' => 'Terms & Conditions',
            'slug' => 'terms',
            'footer_label' => 'Terms & Conditions',
            'content' => "Project timelines, deposits, deliverables, usage rights, and cancellation terms should be confirmed in writing before production begins.\n\nAll creative work remains subject to the agreed quotation or service agreement. Website content is provided for general information and can be updated without notice.\n\nFor formal project terms, request a written quote from Ikulungwane Holdings.",
            'pdf_url' => '',
            'meta_title' => 'Terms & Conditions | Ikulungwane Holdings',
            'meta_description' => 'Project terms, bookings, deliverables, and service information for Ikulungwane Holdings.',
            'show_in_footer' => 1,
            'sort_order' => 2,
        ],
        [
            'title' => 'Cookie Policy',
            'slug' => 'cookies',
            'footer_label' => 'Cookie Policy',
            'content' => "This standalone React version uses browser storage to keep local submissions, demo admin data, and local authentication state.\n\nIf analytics, marketing pixels, or embedded third-party tools are added later, this policy should be updated to describe those services.\n\nYou can clear local site data from your browser settings at any time.",
            'pdf_url' => '',
            'meta_title' => 'Cookie Policy | Ikulungwane Holdings',
            'meta_description' => 'Cookie and browser storage information for the Ikulungwane Holdings website.',
            'show_in_footer' => 1,
            'sort_order' => 3,
        ],
    ];
}

function seed_legal_documents(PDO $pdo) {
    $count = (int) $pdo->query('SELECT COUNT(*) FROM legal_documents')->fetchColumn();
    if ($count > 0) return;

    $stmt = $pdo->prepare('INSERT INTO legal_documents (title, slug, footer_label, content, pdf_url, meta_title, meta_description, show_in_footer, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    foreach (default_legal_documents() as $document) {
        $stmt->execute([
            $document['title'],
            $document['slug'],
            $document['footer_label'],
            $document['content'],
            $document['pdf_url'],
            $document['meta_title'],
            $document['meta_description'],
            $document['show_in_footer'],
            $document['sort_order'],
        ]);
    }
}

function current_user(PDO $pdo) {
    $session_user = $_SESSION['ikulungwane_user'] ?? null;
    if (!is_array($session_user) || empty($session_user['id'])) {
        return null;
    }

    $stmt = $pdo->prepare('SELECT id, email, full_name, role, verified FROM app_users WHERE id = ? LIMIT 1');
    $stmt->execute([(int) $session_user['id']]);
    return $stmt->fetch() ?: null;
}

function require_admin($user) {
    if (!is_array($user) || !in_array($user['role'] ?? '', ['super_admin', 'admin'], true)) {
        legal_json(401, ['error' => 'Admin access is required.']);
    }
}

function normalize_slug($value) {
    $slug = strtolower(trim((string) $value));
    $slug = trim($slug, '/');
    $slug = preg_replace('/[^a-z0-9-]+/', '-', $slug);
    $slug = trim($slug, '-');
    return $slug !== '' ? $slug : 'privacy';
}

function bool_value($value) {
    return $value === true || $value === 1 || $value === '1' || $value === 'true';
}

function document_payload($data) {
    $title = trim((string) ($data['title'] ?? ''));
    if ($title === '') {
        legal_json(422, ['error' => 'Title is required.']);
    }

    $slug = normalize_slug($data['slug'] ?? $title);
    return [
        'title' => $title,
        'slug' => $slug,
        'footer_label' => trim((string) ($data['footer_label'] ?? $title)) ?: $title,
        'content' => (string) ($data['content'] ?? ''),
        'pdf_url' => (string) ($data['pdf_url'] ?? ''),
        'meta_title' => (string) ($data['meta_title'] ?? ''),
        'meta_description' => (string) ($data['meta_description'] ?? ''),
        'show_in_footer' => bool_value($data['show_in_footer'] ?? true) ? 1 : 0,
        'sort_order' => (int) ($data['sort_order'] ?? 0),
    ];
}

function public_row($row) {
    return [
        'id' => (string) $row['id'],
        'title' => $row['title'] ?? '',
        'slug' => $row['slug'] ?? '',
        'footer_label' => $row['footer_label'] ?? '',
        'content' => $row['content'] ?? '',
        'pdf_url' => $row['pdf_url'] ?? '',
        'meta_title' => $row['meta_title'] ?? '',
        'meta_description' => $row['meta_description'] ?? '',
        'show_in_footer' => (bool) ($row['show_in_footer'] ?? false),
        'sort_order' => (int) ($row['sort_order'] ?? 0),
        'created_at' => $row['created_at'] ?? '',
        'updated_at' => $row['updated_at'] ?? '',
    ];
}

function fetch_document(PDO $pdo, $id) {
    $stmt = $pdo->prepare('SELECT * FROM legal_documents WHERE id = ? LIMIT 1');
    $stmt->execute([(int) $id]);
    $row = $stmt->fetch();
    if (!$row) {
        legal_json(404, ['error' => 'Legal document was not found.']);
    }
    return $row;
}

try {
    $pdo = legal_pdo();
    ensure_legal_table($pdo);
    seed_legal_documents($pdo);

    $method = $_SERVER['REQUEST_METHOD'];
    $user = current_user($pdo);

    if ($method === 'GET') {
        $slug = normalize_slug($_GET['slug'] ?? '');
        if (!empty($_GET['slug'])) {
            $stmt = $pdo->prepare('SELECT * FROM legal_documents WHERE slug = ? LIMIT 1');
            $stmt->execute([$slug]);
            $row = $stmt->fetch();
            if (!$row) {
                legal_json(404, ['error' => 'Legal document was not found.']);
            }
            legal_json(200, ['item' => public_row($row)]);
        }

        $footer_only = bool_value($_GET['footer'] ?? false);
        $sql = 'SELECT * FROM legal_documents';
        if ($footer_only) {
            $sql .= ' WHERE show_in_footer = 1';
        }
        $sql .= ' ORDER BY sort_order ASC, title ASC';
        $rows = $pdo->query($sql)->fetchAll();
        legal_json(200, ['items' => array_map('public_row', $rows)]);
    }

    if ($method === 'POST') {
        require_admin($user);
        $payload = document_payload(legal_body());
        $stmt = $pdo->prepare('INSERT INTO legal_documents (title, slug, footer_label, content, pdf_url, meta_title, meta_description, show_in_footer, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $payload['title'],
            $payload['slug'],
            $payload['footer_label'],
            $payload['content'],
            $payload['pdf_url'],
            $payload['meta_title'],
            $payload['meta_description'],
            $payload['show_in_footer'],
            $payload['sort_order'],
        ]);
        legal_json(200, ['item' => public_row(fetch_document($pdo, $pdo->lastInsertId()))]);
    }

    if ($method === 'PUT') {
        require_admin($user);
        $id = (int) ($_GET['id'] ?? 0);
        if ($id <= 0) {
            legal_json(422, ['error' => 'Document id is required.']);
        }

        $payload = document_payload(legal_body());
        $stmt = $pdo->prepare('UPDATE legal_documents SET title = ?, slug = ?, footer_label = ?, content = ?, pdf_url = ?, meta_title = ?, meta_description = ?, show_in_footer = ?, sort_order = ? WHERE id = ?');
        $stmt->execute([
            $payload['title'],
            $payload['slug'],
            $payload['footer_label'],
            $payload['content'],
            $payload['pdf_url'],
            $payload['meta_title'],
            $payload['meta_description'],
            $payload['show_in_footer'],
            $payload['sort_order'],
            $id,
        ]);
        legal_json(200, ['item' => public_row(fetch_document($pdo, $id))]);
    }

    if ($method === 'DELETE') {
        require_admin($user);
        $id = (int) ($_GET['id'] ?? 0);
        if ($id <= 0) {
            legal_json(422, ['error' => 'Document id is required.']);
        }

        $stmt = $pdo->prepare('DELETE FROM legal_documents WHERE id = ?');
        $stmt->execute([$id]);
        legal_json(200, ['success' => true]);
    }

    legal_json(405, ['error' => 'Unsupported legal document request.']);
} catch (Throwable $error) {
    legal_json(500, ['error' => $error->getMessage()]);
}
