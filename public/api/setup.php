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

define('IKU_CONFIG_DIR', __DIR__ . '/config');
define('IKU_DB_CONFIG', IKU_CONFIG_DIR . '/database.php');

function setup_json($status, $body) {
    http_response_code($status);
    echo json_encode($body);
    exit;
}

function setup_body() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);
    return is_array($data) ? $data : [];
}

function clean_text($value) {
    return trim((string) $value);
}

function required_value($data, $key, $label) {
    $value = clean_text($data[$key] ?? '');
    if ($value === '') {
        setup_json(422, ['error' => $label . ' is required.']);
    }
    return $value;
}

function load_db_config() {
    if (!file_exists(IKU_DB_CONFIG)) {
        return null;
    }
    $config = include IKU_DB_CONFIG;
    return is_array($config) ? $config : null;
}

function pdo_from_config($config) {
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

function current_super_admin() {
    $user = $_SESSION['ikulungwane_user'] ?? null;
    return is_array($user) && ($user['role'] ?? '') === 'super_admin';
}

function installed_status() {
    $config = load_db_config();
    if (!$config) {
        return [
            'available' => true,
            'installed' => false,
            'configExists' => false,
            'canReopenSetup' => false,
        ];
    }

    try {
        $pdo = pdo_from_config($config);
        $stmt = $pdo->prepare("SELECT setting_value FROM system_settings WHERE setting_key = 'installed' LIMIT 1");
        $stmt->execute();
        $installed = strtolower((string) $stmt->fetchColumn()) === 'true';

        return [
            'available' => true,
            'installed' => $installed,
            'configExists' => true,
            'canReopenSetup' => current_super_admin(),
        ];
    } catch (Throwable $error) {
        return [
            'available' => true,
            'installed' => false,
            'configExists' => true,
            'canReopenSetup' => false,
            'message' => 'Database config exists, but the installer could not read the installed flag.',
        ];
    }
}

function requirements() {
    if (!is_dir(IKU_CONFIG_DIR)) {
        @mkdir(IKU_CONFIG_DIR, 0755, true);
    }

    $items = [
        ['key' => 'php', 'label' => 'PHP 8.0 or newer', 'ok' => version_compare(PHP_VERSION, '8.0.0', '>='), 'value' => PHP_VERSION, 'required' => true],
        ['key' => 'pdo', 'label' => 'PDO extension', 'ok' => extension_loaded('pdo'), 'value' => extension_loaded('pdo') ? 'Enabled' : 'Missing', 'required' => true],
        ['key' => 'pdo_mysql', 'label' => 'PDO MySQL driver', 'ok' => extension_loaded('pdo_mysql'), 'value' => extension_loaded('pdo_mysql') ? 'Enabled' : 'Missing', 'required' => true],
        ['key' => 'json', 'label' => 'JSON extension', 'ok' => extension_loaded('json'), 'value' => extension_loaded('json') ? 'Enabled' : 'Missing', 'required' => true],
        ['key' => 'sessions', 'label' => 'PHP sessions', 'ok' => session_status() === PHP_SESSION_ACTIVE, 'value' => session_status() === PHP_SESSION_ACTIVE ? 'Enabled' : 'Missing', 'required' => true],
        ['key' => 'config_writable', 'label' => 'Writable API config folder', 'ok' => is_writable(IKU_CONFIG_DIR), 'value' => is_writable(IKU_CONFIG_DIR) ? 'Writable' : 'Not writable', 'required' => true],
    ];

    setup_json(200, ['available' => true, 'items' => $items]);
}

function database_config_from_payload($database) {
    return [
        'host' => required_value($database, 'host', 'Database host'),
        'port' => (int) (clean_text($database['port'] ?? '3306') ?: 3306),
        'name' => required_value($database, 'name', 'Database name'),
        'username' => required_value($database, 'username', 'Database username'),
        'password' => (string) ($database['password'] ?? ''),
        'charset' => 'utf8mb4',
    ];
}

function test_database($database) {
    $config = database_config_from_payload($database);
    if ($config['password'] === '') {
        setup_json(422, ['error' => 'Database password is required.']);
    }

    $pdo = pdo_from_config($config);
    $pdo->query('SELECT 1');
    return $pdo;
}

function create_tables(PDO $pdo) {
    $statements = [
        "CREATE TABLE IF NOT EXISTS system_settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          setting_key VARCHAR(100) UNIQUE NOT NULL,
          setting_value TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS app_users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(191) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          full_name VARCHAR(191) NOT NULL,
          role VARCHAR(40) NOT NULL DEFAULT 'admin',
          verified TINYINT(1) NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS media_assets (
          id INT AUTO_INCREMENT PRIMARY KEY,
          file_url LONGTEXT NOT NULL,
          storage_key VARCHAR(255),
          original_filename VARCHAR(255),
          category VARCHAR(100),
          alt_text VARCHAR(255),
          mime_type VARCHAR(100),
          size_bytes BIGINT,
          width INT,
          height INT,
          metadata LONGTEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS portfolio_projects (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(191) NOT NULL,
          slug VARCHAR(191) UNIQUE NOT NULL,
          category VARCHAR(120) NOT NULL DEFAULT 'events',
          cover_image LONGTEXT,
          description TEXT,
          video_url TEXT,
          client_name VARCHAR(191),
          client_testimonial TEXT,
          location VARCHAR(191),
          project_date DATE,
          featured TINYINT(1) NOT NULL DEFAULT 0,
          published TINYINT(1) NOT NULL DEFAULT 1,
          display_order INT NOT NULL DEFAULT 0,
          metadata LONGTEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS portfolio_project_images (
          id INT AUTO_INCREMENT PRIMARY KEY,
          project_id INT NOT NULL,
          image_url LONGTEXT NOT NULL,
          alt_text VARCHAR(255),
          display_order INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX project_order_idx (project_id, display_order)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS services (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(191) NOT NULL,
          slug VARCHAR(191) UNIQUE NOT NULL,
          icon VARCHAR(80),
          description TEXT,
          long_description LONGTEXT,
          cover_image LONGTEXT,
          published TINYINT(1) NOT NULL DEFAULT 1,
          display_order INT NOT NULL DEFAULT 0,
          metadata LONGTEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS service_packages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          service_id INT NOT NULL,
          name VARCHAR(191) NOT NULL,
          price VARCHAR(120),
          features LONGTEXT,
          display_order INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX service_order_idx (service_id, display_order)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS service_faqs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          service_id INT NOT NULL,
          question TEXT NOT NULL,
          answer LONGTEXT NOT NULL,
          display_order INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX service_order_idx (service_id, display_order)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS testimonials (
          id INT AUTO_INCREMENT PRIMARY KEY,
          client_name VARCHAR(191) NOT NULL,
          review LONGTEXT NOT NULL,
          rating TINYINT NOT NULL DEFAULT 5,
          service_type VARCHAR(120),
          featured TINYINT(1) NOT NULL DEFAULT 0,
          published TINYINT(1) NOT NULL DEFAULT 1,
          metadata LONGTEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS team_members (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(191) NOT NULL,
          role VARCHAR(191),
          bio TEXT,
          photo LONGTEXT,
          specialties LONGTEXT,
          social_instagram TEXT,
          social_linkedin TEXT,
          published TINYINT(1) NOT NULL DEFAULT 1,
          display_order INT NOT NULL DEFAULT 0,
          metadata LONGTEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS blog_posts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(191) NOT NULL,
          slug VARCHAR(191) UNIQUE NOT NULL,
          excerpt TEXT,
          content LONGTEXT,
          featured_image LONGTEXT,
          category VARCHAR(120) NOT NULL DEFAULT 'news',
          tags LONGTEXT,
          author VARCHAR(191),
          published TINYINT(1) NOT NULL DEFAULT 0,
          published_at TIMESTAMP NULL,
          meta_title VARCHAR(191),
          meta_description TEXT,
          metadata LONGTEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS bookings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          reference VARCHAR(80) UNIQUE NOT NULL,
          full_name VARCHAR(191) NOT NULL,
          email VARCHAR(191) NOT NULL,
          phone VARCHAR(80),
          event_type VARCHAR(120) NOT NULL,
          event_date DATE,
          event_location VARCHAR(255),
          budget_range VARCHAR(120),
          notes LONGTEXT,
          status VARCHAR(60) NOT NULL DEFAULT 'new',
          deposit_amount VARCHAR(120),
          confirmation_email VARCHAR(191),
          metadata LONGTEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX status_created_idx (status, created_at),
          INDEX email_idx (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS contact_messages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(191) NOT NULL,
          email VARCHAR(191) NOT NULL,
          phone VARCHAR(80),
          service_interested VARCHAR(191),
          message LONGTEXT NOT NULL,
          status VARCHAR(60) NOT NULL DEFAULT 'new',
          metadata LONGTEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX status_created_idx (status, created_at),
          INDEX email_idx (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS site_settings (
          setting_key VARCHAR(100) PRIMARY KEY,
          setting_value LONGTEXT,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS page_content (
          page_key VARCHAR(100) PRIMARY KEY,
          content LONGTEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        "CREATE TABLE IF NOT EXISTS email_delivery_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          source_type VARCHAR(80) NOT NULL,
          source_id INT,
          recipient_email VARCHAR(191),
          subject VARCHAR(255),
          status VARCHAR(60) NOT NULL DEFAULT 'queued',
          provider_message_id VARCHAR(255),
          error_message TEXT,
          metadata LONGTEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX source_idx (source_type, source_id, created_at),
          INDEX status_idx (status, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
    ];

    foreach ($statements as $statement) {
        $pdo->exec($statement);
    }
}

function upsert_system_setting(PDO $pdo, $key, $value) {
    $stmt = $pdo->prepare("INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
    $stmt->execute([$key, $value]);
}

function save_config_file($config) {
    if (!is_dir(IKU_CONFIG_DIR)) {
        mkdir(IKU_CONFIG_DIR, 0755, true);
    }

    if (!is_writable(IKU_CONFIG_DIR)) {
        setup_json(500, ['error' => 'The API config folder is not writable. Set public_html/api/config permissions to writable, then retry.']);
    }

    $contents = "<?php\nreturn " . var_export($config, true) . ";\n";
    if (file_put_contents(IKU_DB_CONFIG, $contents, LOCK_EX) === false) {
        setup_json(500, ['error' => 'Could not write database config file.']);
    }
    @chmod(IKU_DB_CONFIG, 0640);
}

function install_system($payload) {
    $status = installed_status();
    if (($status['installed'] ?? false) && !current_super_admin()) {
        setup_json(403, ['error' => 'The system is already installed. Setup is locked.']);
    }

    $database = is_array($payload['database'] ?? null) ? $payload['database'] : [];
    $admin = is_array($payload['admin'] ?? null) ? $payload['admin'] : [];
    $site = is_array($payload['site'] ?? null) ? $payload['site'] : [];

    $config = database_config_from_payload($database);
    if ($config['password'] === '') {
        setup_json(422, ['error' => 'Database password is required.']);
    }

    $admin_name = required_value($admin, 'full_name', 'Admin full name');
    $admin_email = strtolower(required_value($admin, 'email', 'Admin email'));
    $admin_password = (string) ($admin['password'] ?? '');
    if (!filter_var($admin_email, FILTER_VALIDATE_EMAIL)) {
        setup_json(422, ['error' => 'Enter a valid admin email address.']);
    }
    if (strlen($admin_password) < 8) {
        setup_json(422, ['error' => 'Admin password must be at least 8 characters.']);
    }

    $site_name = required_value($site, 'siteName', 'Site name');
    $site_email = required_value($site, 'email', 'Site email');
    if (!filter_var($site_email, FILTER_VALIDATE_EMAIL)) {
        setup_json(422, ['error' => 'Enter a valid site email address.']);
    }

    $pdo = test_database($database);
    try {
        create_tables($pdo);
        save_config_file($config);

        $stmt = $pdo->prepare("INSERT INTO app_users (email, password_hash, full_name, role, verified) VALUES (?, ?, ?, 'super_admin', 1) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), full_name = VALUES(full_name), role = 'super_admin', verified = 1");
        $stmt->execute([$admin_email, password_hash($admin_password, PASSWORD_DEFAULT), $admin_name]);

        $global_settings = [
            'site' => [
                'companyName' => $site_name,
                'shortName' => $site_name,
                'tagline' => 'Premium Photography & Videography',
                'logoText' => $site_name,
                'logoImage' => (string) ($site['logo'] ?? ''),
                'logoAlt' => $site_name . ' logo',
                'favicon' => '',
            ],
            'contact' => [
                'email' => $site_email,
                'phone' => (string) ($site['phone'] ?? ''),
                'whatsapp' => (string) ($site['whatsapp'] ?? ''),
                'whatsappUrl' => '',
                'address' => (string) ($site['address'] ?? ''),
                'workingHours' => 'Monday-Friday, 09:00-17:00',
                'googleMapsUrl' => '',
            ],
        ];

        $stmt = $pdo->prepare("INSERT INTO site_settings (setting_key, setting_value, description) VALUES ('global', ?, 'Global website settings from installer') ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), description = VALUES(description)");
        $stmt->execute([json_encode($global_settings)]);

        foreach (['home', 'portfolio', 'services', 'about', 'journal', 'contact', 'booking'] as $page) {
            $stmt = $pdo->prepare("INSERT IGNORE INTO page_content (page_key, content) VALUES (?, '{}')");
            $stmt->execute([$page]);
        }

        upsert_system_setting($pdo, 'site_name', $site_name);
        upsert_system_setting($pdo, 'site_email', $site_email);
        upsert_system_setting($pdo, 'site_phone', (string) ($site['phone'] ?? ''));
        upsert_system_setting($pdo, 'site_address', (string) ($site['address'] ?? ''));
        upsert_system_setting($pdo, 'site_whatsapp', (string) ($site['whatsapp'] ?? ''));
        upsert_system_setting($pdo, 'installed', 'true');
    } catch (Throwable $error) {
        setup_json(500, ['error' => 'Installation failed while creating tables: ' . $error->getMessage()]);
    }

    setup_json(200, ['ok' => true, 'installed' => true, 'redirect' => '/admin/login']);
}

$action = $_GET['action'] ?? 'status';

try {
    if ($action === 'status') {
        setup_json(200, installed_status());
    }

    if ($action === 'requirements') {
        requirements();
    }

    if ($action === 'test-database') {
        $body = setup_body();
        test_database(is_array($body['database'] ?? null) ? $body['database'] : []);
        setup_json(200, ['ok' => true, 'message' => 'Database connection successful.']);
    }

    if ($action === 'install') {
        install_system(setup_body());
    }

    setup_json(404, ['error' => 'Unknown setup action.']);
} catch (Throwable $error) {
    setup_json(500, ['error' => $error->getMessage()]);
}
