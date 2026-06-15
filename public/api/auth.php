<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

session_start();

define('IKU_DB_CONFIG', __DIR__ . '/config/database.php');

function auth_json($status, $body) {
    http_response_code($status);
    echo json_encode($body);
    exit;
}

function auth_body() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);
    return is_array($data) ? $data : [];
}

function db_config() {
    if (!file_exists(IKU_DB_CONFIG)) {
        auth_json(503, ['error' => 'The system is not installed yet.']);
    }
    $config = include IKU_DB_CONFIG;
    if (!is_array($config)) {
        auth_json(500, ['error' => 'Database configuration is invalid.']);
    }
    return $config;
}

function auth_pdo() {
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

function public_user($user) {
    return [
        'id' => (int) $user['id'],
        'email' => $user['email'],
        'full_name' => $user['full_name'],
        'role' => $user['role'],
        'verified' => (bool) $user['verified'],
    ];
}

function require_installed(PDO $pdo) {
    $stmt = $pdo->prepare("SELECT setting_value FROM system_settings WHERE setting_key = 'installed' LIMIT 1");
    $stmt->execute();
    if (strtolower((string) $stmt->fetchColumn()) !== 'true') {
        auth_json(403, ['error' => 'The system is not installed yet.']);
    }
}

function current_user(PDO $pdo) {
    $session_user = $_SESSION['ikulungwane_user'] ?? null;
    if (!is_array($session_user) || empty($session_user['id'])) {
        auth_json(401, ['error' => 'Not signed in.']);
    }

    $stmt = $pdo->prepare('SELECT id, email, full_name, role, verified FROM app_users WHERE id = ? LIMIT 1');
    $stmt->execute([(int) $session_user['id']]);
    $user = $stmt->fetch();
    if (!$user) {
        unset($_SESSION['ikulungwane_user']);
        auth_json(401, ['error' => 'Not signed in.']);
    }

    return $user;
}

$action = $_GET['action'] ?? 'me';

try {
    $pdo = auth_pdo();
    require_installed($pdo);

    if ($action === 'me') {
        auth_json(200, ['user' => public_user(current_user($pdo))]);
    }

    if ($action === 'login') {
        $body = auth_body();
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        $password = (string) ($body['password'] ?? '');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
            auth_json(422, ['error' => 'Enter your admin email and password.']);
        }

        $stmt = $pdo->prepare('SELECT id, email, password_hash, full_name, role, verified FROM app_users WHERE LOWER(email) = LOWER(?) LIMIT 1');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            auth_json(401, ['error' => 'Invalid email or password.']);
        }

        if (!in_array($user['role'], ['super_admin', 'admin'], true)) {
            auth_json(403, ['error' => 'This account is not an admin account.']);
        }

        session_regenerate_id(true);
        $_SESSION['ikulungwane_user'] = [
            'id' => (int) $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
        ];

        auth_json(200, ['user' => public_user($user)]);
    }

    if ($action === 'logout') {
        unset($_SESSION['ikulungwane_user']);
        auth_json(200, ['ok' => true]);
    }

    auth_json(404, ['error' => 'Unknown auth action.']);
} catch (Throwable $error) {
    auth_json(500, ['error' => $error->getMessage()]);
}
