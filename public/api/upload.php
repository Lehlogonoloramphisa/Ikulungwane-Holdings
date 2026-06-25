<?php
header('Content-Type: application/json; charset=utf-8');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

session_start();

define('IKU_DB_CONFIG', __DIR__ . '/config/database.php');
define('IKU_UPLOAD_DIR', __DIR__ . '/uploads');
define('IKU_UPLOAD_URL', '/api/uploads');

function upload_json($status, $body) {
    http_response_code($status);
    echo json_encode($body);
    exit;
}

function db_config() {
    if (!file_exists(IKU_DB_CONFIG)) {
        upload_json(503, ['error' => 'The system is not installed yet.']);
    }

    $config = include IKU_DB_CONFIG;
    if (!is_array($config)) {
        upload_json(500, ['error' => 'Database configuration is invalid.']);
    }

    return $config;
}

function upload_pdo() {
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

function require_admin(PDO $pdo) {
    $session_user = $_SESSION['ikulungwane_user'] ?? null;
    if (!is_array($session_user) || empty($session_user['id'])) {
        upload_json(401, ['error' => 'Admin access is required.']);
    }

    $stmt = $pdo->prepare('SELECT role FROM app_users WHERE id = ? LIMIT 1');
    $stmt->execute([(int) $session_user['id']]);
    $role = (string) $stmt->fetchColumn();
    if (!in_array($role, ['super_admin', 'admin'], true)) {
        upload_json(401, ['error' => 'Admin access is required.']);
    }
}

function ensure_upload_dir() {
    if (!is_dir(IKU_UPLOAD_DIR) && !mkdir(IKU_UPLOAD_DIR, 0755, true)) {
        upload_json(500, ['error' => 'Could not create uploads folder.']);
    }

    if (!is_writable(IKU_UPLOAD_DIR)) {
        upload_json(500, ['error' => 'The uploads folder is not writable.']);
    }

    $htaccess = IKU_UPLOAD_DIR . '/.htaccess';
    if (!file_exists($htaccess)) {
        @file_put_contents($htaccess, "Options -Indexes\n<FilesMatch \"\\.(php|php[0-9]?|phtml|phar)$\">\n  Require all denied\n</FilesMatch>\n");
    }
}

function extension_from_name($name) {
    return strtolower(pathinfo((string) $name, PATHINFO_EXTENSION));
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        upload_json(405, ['error' => 'Upload must use POST.']);
    }

    $pdo = upload_pdo();
    require_admin($pdo);

    if (empty($_FILES['file']) || !is_array($_FILES['file'])) {
        upload_json(422, ['error' => 'Choose a file to upload.']);
    }

    $file = $_FILES['file'];
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        upload_json(422, ['error' => 'The file could not be uploaded.']);
    }

    if (($file['size'] ?? 0) > 30 * 1024 * 1024) {
        upload_json(422, ['error' => 'Files must be 30MB or smaller.']);
    }

    $extension = extension_from_name($file['name'] ?? '');
    $allowed_extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'ico', 'mp4', 'mov', 'webm', 'pdf'];
    if (!in_array($extension, $allowed_extensions, true)) {
        upload_json(422, ['error' => 'Only supported image, video, and PDF files are allowed.']);
    }

    $finfo = function_exists('finfo_open') ? finfo_open(FILEINFO_MIME_TYPE) : null;
    $mime = $finfo ? finfo_file($finfo, $file['tmp_name']) : (string) ($file['type'] ?? '');
    if ($finfo) {
        finfo_close($finfo);
    }

    $allowed_mimes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/svg+xml',
        'image/x-icon',
        'image/vnd.microsoft.icon',
        'video/mp4',
        'video/quicktime',
        'video/webm',
        'application/pdf',
        'text/plain',
    ];

    if (!in_array($mime, $allowed_mimes, true) || ($mime === 'text/plain' && $extension !== 'svg')) {
        upload_json(422, ['error' => 'The selected file is not a supported image.']);
    }

    ensure_upload_dir();

    $token = bin2hex(random_bytes(10));
    $filename = date('Ymd-His') . '-' . $token . '.' . $extension;
    $target = IKU_UPLOAD_DIR . '/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $target)) {
        upload_json(500, ['error' => 'Could not save the uploaded image.']);
    }

    @chmod($target, 0644);

    upload_json(200, [
        'file_url' => IKU_UPLOAD_URL . '/' . $filename,
        'original_filename' => $file['name'] ?? $filename,
        'mime_type' => $mime,
        'size_bytes' => (int) ($file['size'] ?? 0),
    ]);
} catch (Throwable $error) {
    upload_json(500, ['error' => $error->getMessage()]);
}
