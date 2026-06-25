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

function content_json($status, $body) {
    http_response_code($status);
    echo json_encode($body);
    exit;
}

function content_body() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);
    return is_array($data) ? $data : [];
}

function db_config() {
    if (!file_exists(IKU_DB_CONFIG)) {
        content_json(503, ['error' => 'The system is not installed yet.']);
    }

    $config = include IKU_DB_CONFIG;
    if (!is_array($config)) {
        content_json(500, ['error' => 'Database configuration is invalid.']);
    }

    return $config;
}

function content_pdo() {
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

function current_user(PDO $pdo) {
    $session_user = $_SESSION['ikulungwane_user'] ?? null;
    if (!is_array($session_user) || empty($session_user['id'])) {
        return null;
    }

    $stmt = $pdo->prepare('SELECT id, email, full_name, role, verified FROM app_users WHERE id = ? LIMIT 1');
    $stmt->execute([(int) $session_user['id']]);
    return $stmt->fetch() ?: null;
}

function is_admin($user) {
    return is_array($user) && in_array($user['role'] ?? '', ['super_admin', 'admin'], true);
}

function require_admin($user) {
    if (!is_admin($user)) {
        content_json(401, ['error' => 'Admin access is required.']);
    }
}

function entity_config($entity) {
    $configs = [
        'PortfolioProject' => [
            'table' => 'portfolio_projects',
            'public' => true,
            'published' => true,
            'sort' => ['id', 'title', 'slug', 'category', 'created_date', 'updated_date', 'order', 'date', 'featured', 'published'],
            'fields' => [
                'title' => 'title',
                'slug' => 'slug',
                'category' => 'category',
                'cover_image' => 'cover_image',
                'description' => 'description',
                'video_url' => 'video_url',
                'client_name' => 'client_name',
                'client_testimonial' => 'client_testimonial',
                'location' => 'location',
                'date' => 'project_date',
                'featured' => 'featured',
                'published' => 'published',
                'order' => 'display_order',
                'metadata' => 'metadata',
            ],
            'booleans' => ['featured', 'published'],
            'json' => [],
        ],
        'Service' => [
            'table' => 'services',
            'public' => true,
            'published' => true,
            'sort' => ['id', 'title', 'slug', 'created_date', 'updated_date', 'order', 'published'],
            'fields' => [
                'title' => 'title',
                'slug' => 'slug',
                'icon' => 'icon',
                'description' => 'description',
                'long_description' => 'long_description',
                'cover_image' => 'cover_image',
                'published' => 'published',
                'order' => 'display_order',
                'metadata' => 'metadata',
            ],
            'booleans' => ['published'],
            'json' => [],
        ],
        'Testimonial' => [
            'table' => 'testimonials',
            'public' => true,
            'published' => true,
            'sort' => ['id', 'created_date', 'updated_date', 'rating', 'featured', 'published'],
            'fields' => [
                'client_name' => 'client_name',
                'review' => 'review',
                'rating' => 'rating',
                'service_type' => 'service_type',
                'featured' => 'featured',
                'published' => 'published',
                'metadata' => 'metadata',
            ],
            'booleans' => ['featured', 'published'],
            'json' => [],
        ],
        'TeamMember' => [
            'table' => 'team_members',
            'public' => true,
            'published' => true,
            'sort' => ['id', 'name', 'created_date', 'updated_date', 'order', 'published'],
            'fields' => [
                'name' => 'name',
                'role' => 'role',
                'bio' => 'bio',
                'photo' => 'photo',
                'specialties' => 'specialties',
                'social_instagram' => 'social_instagram',
                'social_linkedin' => 'social_linkedin',
                'published' => 'published',
                'order' => 'display_order',
                'metadata' => 'metadata',
            ],
            'booleans' => ['published'],
            'json' => ['specialties'],
        ],
        'BlogPost' => [
            'table' => 'blog_posts',
            'public' => true,
            'published' => true,
            'sort' => ['id', 'title', 'slug', 'category', 'created_date', 'updated_date', 'published'],
            'fields' => [
                'title' => 'title',
                'slug' => 'slug',
                'excerpt' => 'excerpt',
                'content' => 'content',
                'featured_image' => 'featured_image',
                'category' => 'category',
                'tags' => 'tags',
                'author' => 'author',
                'published' => 'published',
                'meta_title' => 'meta_title',
                'meta_description' => 'meta_description',
                'metadata' => 'metadata',
            ],
            'booleans' => ['published'],
            'json' => ['tags'],
        ],
        'Booking' => [
            'table' => 'bookings',
            'public' => false,
            'publicCreate' => true,
            'published' => false,
            'sort' => ['id', 'reference', 'full_name', 'created_date', 'updated_date', 'status', 'event_date'],
            'fields' => [
                'reference' => 'reference',
                'full_name' => 'full_name',
                'email' => 'email',
                'phone' => 'phone',
                'event_type' => 'event_type',
                'event_date' => 'event_date',
                'event_location' => 'event_location',
                'budget_range' => 'budget_range',
                'notes' => 'notes',
                'status' => 'status',
                'deposit_amount' => 'deposit_amount',
                'confirmation_email' => 'confirmation_email',
                'metadata' => 'metadata',
            ],
            'booleans' => [],
            'json' => [],
        ],
        'ContactMessage' => [
            'table' => 'contact_messages',
            'public' => false,
            'publicCreate' => true,
            'published' => false,
            'sort' => ['id', 'name', 'created_date', 'updated_date', 'status'],
            'fields' => [
                'name' => 'name',
                'email' => 'email',
                'phone' => 'phone',
                'service_interested' => 'service_interested',
                'message' => 'message',
                'status' => 'status',
                'metadata' => 'metadata',
            ],
            'booleans' => [],
            'json' => [],
        ],
    ];

    return $configs[$entity] ?? null;
}

function db_column($config, $field) {
    if ($field === 'id') return 'id';
    if ($field === 'created_date') return 'created_at';
    if ($field === 'updated_date') return 'updated_at';
    return $config['fields'][$field] ?? null;
}

function normalize_value($config, $field, $value) {
    if (in_array($field, $config['booleans'] ?? [], true)) {
        return $value ? 1 : 0;
    }

    if (in_array($field, $config['json'] ?? [], true)) {
        return json_encode(is_array($value) ? $value : []);
    }

    if ($field === 'date' || $field === 'event_date') {
        $clean = trim((string) $value);
        return $clean === '' ? null : $clean;
    }

    if ($field === 'rating' || $field === 'order') {
        return (int) $value;
    }

    return is_array($value) ? json_encode($value) : $value;
}

function decode_json_field($value, $fallback = []) {
    if ($value === null || $value === '') return $fallback;
    $decoded = json_decode($value, true);
    return is_array($decoded) ? $decoded : $fallback;
}

function public_row($entity, $row) {
    $base = [
        'id' => (string) $row['id'],
        'created_date' => $row['created_at'] ?? '',
        'updated_date' => $row['updated_at'] ?? '',
    ];

    if ($entity === 'PortfolioProject') {
        return $base + [
            'title' => $row['title'] ?? '',
            'slug' => $row['slug'] ?? '',
            'category' => $row['category'] ?? '',
            'cover_image' => $row['cover_image'] ?? '',
            'description' => $row['description'] ?? '',
            'video_url' => $row['video_url'] ?? '',
            'client_name' => $row['client_name'] ?? '',
            'client_testimonial' => $row['client_testimonial'] ?? '',
            'location' => $row['location'] ?? '',
            'date' => $row['project_date'] ?? '',
            'featured' => (bool) ($row['featured'] ?? false),
            'published' => (bool) ($row['published'] ?? false),
            'order' => (int) ($row['display_order'] ?? 0),
            'metadata' => $row['metadata'] ?? '',
            'images' => $row['images'] ?? [],
        ];
    }

    if ($entity === 'Service') {
        return $base + [
            'title' => $row['title'] ?? '',
            'slug' => $row['slug'] ?? '',
            'icon' => $row['icon'] ?? '',
            'description' => $row['description'] ?? '',
            'long_description' => $row['long_description'] ?? '',
            'cover_image' => $row['cover_image'] ?? '',
            'published' => (bool) ($row['published'] ?? false),
            'order' => (int) ($row['display_order'] ?? 0),
            'metadata' => $row['metadata'] ?? '',
            'packages' => $row['packages'] ?? [],
            'faqs' => $row['faqs'] ?? [],
        ];
    }

    if ($entity === 'Testimonial') {
        return $base + [
            'client_name' => $row['client_name'] ?? '',
            'review' => $row['review'] ?? '',
            'rating' => (int) ($row['rating'] ?? 5),
            'service_type' => $row['service_type'] ?? '',
            'featured' => (bool) ($row['featured'] ?? false),
            'published' => (bool) ($row['published'] ?? false),
            'metadata' => $row['metadata'] ?? '',
        ];
    }

    if ($entity === 'TeamMember') {
        return $base + [
            'name' => $row['name'] ?? '',
            'role' => $row['role'] ?? '',
            'bio' => $row['bio'] ?? '',
            'photo' => $row['photo'] ?? '',
            'specialties' => decode_json_field($row['specialties'] ?? null),
            'social_instagram' => $row['social_instagram'] ?? '',
            'social_linkedin' => $row['social_linkedin'] ?? '',
            'published' => (bool) ($row['published'] ?? false),
            'order' => (int) ($row['display_order'] ?? 0),
            'metadata' => $row['metadata'] ?? '',
        ];
    }

    if ($entity === 'BlogPost') {
        return $base + [
            'title' => $row['title'] ?? '',
            'slug' => $row['slug'] ?? '',
            'excerpt' => $row['excerpt'] ?? '',
            'content' => $row['content'] ?? '',
            'featured_image' => $row['featured_image'] ?? '',
            'category' => $row['category'] ?? '',
            'tags' => decode_json_field($row['tags'] ?? null),
            'author' => $row['author'] ?? '',
            'published' => (bool) ($row['published'] ?? false),
            'meta_title' => $row['meta_title'] ?? '',
            'meta_description' => $row['meta_description'] ?? '',
            'metadata' => $row['metadata'] ?? '',
        ];
    }

    if ($entity === 'Booking') {
        return $base + [
            'reference' => $row['reference'] ?? '',
            'full_name' => $row['full_name'] ?? '',
            'email' => $row['email'] ?? '',
            'phone' => $row['phone'] ?? '',
            'event_type' => $row['event_type'] ?? '',
            'event_date' => $row['event_date'] ?? '',
            'event_location' => $row['event_location'] ?? '',
            'budget_range' => $row['budget_range'] ?? '',
            'notes' => $row['notes'] ?? '',
            'status' => $row['status'] ?? 'new',
            'deposit_amount' => $row['deposit_amount'] ?? '',
            'confirmation_email' => $row['confirmation_email'] ?? '',
            'metadata' => $row['metadata'] ?? '',
        ];
    }

    return $base + [
        'name' => $row['name'] ?? '',
        'email' => $row['email'] ?? '',
        'phone' => $row['phone'] ?? '',
        'service_interested' => $row['service_interested'] ?? '',
        'message' => $row['message'] ?? '',
        'status' => $row['status'] ?? 'new',
        'metadata' => $row['metadata'] ?? '',
    ];
}

function hydrate_rows(PDO $pdo, $entity, $rows) {
    if (!$rows) return [];

    if ($entity === 'PortfolioProject') {
        $ids = array_column($rows, 'id');
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $pdo->prepare("SELECT project_id, image_url, alt_text, display_order FROM portfolio_project_images WHERE project_id IN ($placeholders) ORDER BY display_order ASC, id ASC");
        $stmt->execute($ids);
        $images = [];
        foreach ($stmt->fetchAll() as $image) {
            $images[(int) $image['project_id']][] = $image['image_url'];
        }
        foreach ($rows as &$row) {
            $row['images'] = $images[(int) $row['id']] ?? array_values(array_filter([$row['cover_image'] ?? '']));
        }
    }

    if ($entity === 'Service') {
        $ids = array_column($rows, 'id');
        $placeholders = implode(',', array_fill(0, count($ids), '?'));

        $stmt = $pdo->prepare("SELECT service_id, name, price, features, display_order FROM service_packages WHERE service_id IN ($placeholders) ORDER BY display_order ASC, id ASC");
        $stmt->execute($ids);
        $packages = [];
        foreach ($stmt->fetchAll() as $package) {
            $packages[(int) $package['service_id']][] = [
                'name' => $package['name'],
                'price' => $package['price'],
                'features' => decode_json_field($package['features']),
            ];
        }

        $stmt = $pdo->prepare("SELECT service_id, question, answer, display_order FROM service_faqs WHERE service_id IN ($placeholders) ORDER BY display_order ASC, id ASC");
        $stmt->execute($ids);
        $faqs = [];
        foreach ($stmt->fetchAll() as $faq) {
            $faqs[(int) $faq['service_id']][] = [
                'question' => $faq['question'],
                'answer' => $faq['answer'],
            ];
        }

        foreach ($rows as &$row) {
            $row['packages'] = $packages[(int) $row['id']] ?? [];
            $row['faqs'] = $faqs[(int) $row['id']] ?? [];
        }
    }

    return $rows;
}

function sorted_query($config, $sort_by) {
    $descending = is_string($sort_by) && strlen($sort_by) > 0 && $sort_by[0] === '-';
    $field = $descending ? substr($sort_by, 1) : $sort_by;
    if (!$field || !in_array($field, $config['sort'], true)) {
        $field = 'created_date';
        $descending = true;
    }

    $column = db_column($config, $field);
    return $column ? " ORDER BY {$column} " . ($descending ? 'DESC' : 'ASC') : '';
}

function list_entity(PDO $pdo, $entity, $config, $body, $admin) {
    if (!$admin && empty($config['public'])) {
        content_json(401, ['error' => 'Admin access is required.']);
    }

    $where = [];
    $params = [];
    $criteria = is_array($body['criteria'] ?? null) ? $body['criteria'] : [];

    if (!$admin && !empty($config['published'])) {
        $criteria['published'] = true;
    }

    foreach ($criteria as $field => $value) {
        $column = db_column($config, $field);
        if (!$column) continue;
        $where[] = "{$column} = ?";
        $params[] = normalize_value($config, $field, $value);
    }

    $sql = "SELECT * FROM {$config['table']}";
    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }
    $sql .= sorted_query($config, $body['sortBy'] ?? '');

    $limit = (int) ($body['limit'] ?? 0);
    if ($limit > 0 && $limit <= 500) {
        $sql .= " LIMIT {$limit}";
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = hydrate_rows($pdo, $entity, $stmt->fetchAll());
    content_json(200, ['items' => array_map(fn($row) => public_row($entity, $row), $rows)]);
}

function save_related(PDO $pdo, $entity, $id, $data) {
    if ($entity === 'PortfolioProject' && array_key_exists('images', $data)) {
        $pdo->prepare('DELETE FROM portfolio_project_images WHERE project_id = ?')->execute([$id]);
        $images = is_array($data['images']) ? $data['images'] : [];
        $stmt = $pdo->prepare('INSERT INTO portfolio_project_images (project_id, image_url, display_order) VALUES (?, ?, ?)');
        foreach (array_values(array_filter($images)) as $index => $image) {
            $stmt->execute([$id, $image, $index + 1]);
        }
    }

    if ($entity === 'Service') {
        if (array_key_exists('packages', $data)) {
            $pdo->prepare('DELETE FROM service_packages WHERE service_id = ?')->execute([$id]);
            $stmt = $pdo->prepare('INSERT INTO service_packages (service_id, name, price, features, display_order) VALUES (?, ?, ?, ?, ?)');
            foreach ((is_array($data['packages']) ? $data['packages'] : []) as $index => $package) {
                $stmt->execute([
                    $id,
                    (string) ($package['name'] ?? ''),
                    (string) ($package['price'] ?? ''),
                    json_encode(is_array($package['features'] ?? null) ? $package['features'] : []),
                    $index + 1,
                ]);
            }
        }

        if (array_key_exists('faqs', $data)) {
            $pdo->prepare('DELETE FROM service_faqs WHERE service_id = ?')->execute([$id]);
            $stmt = $pdo->prepare('INSERT INTO service_faqs (service_id, question, answer, display_order) VALUES (?, ?, ?, ?)');
            foreach ((is_array($data['faqs']) ? $data['faqs'] : []) as $index => $faq) {
                $stmt->execute([
                    $id,
                    (string) ($faq['question'] ?? ''),
                    (string) ($faq['answer'] ?? ''),
                    $index + 1,
                ]);
            }
        }
    }
}

function create_entity(PDO $pdo, $entity, $config, $body, $admin) {
    if (!$admin && empty($config['publicCreate'])) {
        content_json(401, ['error' => 'Admin access is required.']);
    }

    $data = is_array($body['data'] ?? null) ? $body['data'] : [];
    $columns = [];
    $params = [];

    foreach ($config['fields'] as $field => $column) {
        if (!array_key_exists($field, $data)) continue;
        $columns[] = $column;
        $params[] = normalize_value($config, $field, $data[$field]);
    }

    if (!$columns) {
        content_json(422, ['error' => 'No data was provided.']);
    }

    $placeholders = implode(', ', array_fill(0, count($columns), '?'));
    $sql = "INSERT INTO {$config['table']} (" . implode(', ', $columns) . ") VALUES ($placeholders)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $id = (int) $pdo->lastInsertId();
    save_related($pdo, $entity, $id, $data);

    $stmt = $pdo->prepare("SELECT * FROM {$config['table']} WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    $rows = hydrate_rows($pdo, $entity, $stmt->fetchAll());
    content_json(200, ['item' => public_row($entity, $rows[0])]);
}

function update_entity(PDO $pdo, $entity, $config, $body, $admin) {
    require_admin($admin ? ['role' => 'admin'] : null);
    $id = (int) ($body['id'] ?? 0);
    if ($id <= 0) {
        content_json(422, ['error' => 'Item id is required.']);
    }

    $data = is_array($body['data'] ?? null) ? $body['data'] : [];
    $sets = [];
    $params = [];

    foreach ($config['fields'] as $field => $column) {
        if (!array_key_exists($field, $data)) continue;
        $sets[] = "{$column} = ?";
        $params[] = normalize_value($config, $field, $data[$field]);
    }

    if ($sets) {
        $params[] = $id;
        $stmt = $pdo->prepare("UPDATE {$config['table']} SET " . implode(', ', $sets) . " WHERE id = ?");
        $stmt->execute($params);
    }

    save_related($pdo, $entity, $id, $data);
    $stmt = $pdo->prepare("SELECT * FROM {$config['table']} WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    $rows = hydrate_rows($pdo, $entity, $stmt->fetchAll());
    if (!$rows) {
        content_json(404, ['error' => 'Item was not found.']);
    }
    content_json(200, ['item' => public_row($entity, $rows[0])]);
}

function delete_entity(PDO $pdo, $entity, $config, $body, $admin) {
    require_admin($admin ? ['role' => 'admin'] : null);
    $id = (int) ($body['id'] ?? 0);
    if ($id <= 0) {
        content_json(422, ['error' => 'Item id is required.']);
    }

    if ($entity === 'PortfolioProject') {
        $pdo->prepare('DELETE FROM portfolio_project_images WHERE project_id = ?')->execute([$id]);
    }
    if ($entity === 'Service') {
        $pdo->prepare('DELETE FROM service_packages WHERE service_id = ?')->execute([$id]);
        $pdo->prepare('DELETE FROM service_faqs WHERE service_id = ?')->execute([$id]);
    }

    $pdo->prepare("DELETE FROM {$config['table']} WHERE id = ?")->execute([$id]);
    content_json(200, ['success' => true]);
}

$action = $_GET['action'] ?? 'list';

try {
    $body = $_SERVER['REQUEST_METHOD'] === 'POST' ? content_body() : $_GET;
    $entity = (string) ($body['entity'] ?? '');
    $config = entity_config($entity);
    if (!$config) {
        content_json(404, ['error' => 'Unknown content entity.']);
    }

    $pdo = content_pdo();
    $user = current_user($pdo);
    $admin = is_admin($user);

    if ($action === 'list' || $action === 'filter') {
        list_entity($pdo, $entity, $config, $body, $admin);
    }
    if ($action === 'create') {
        create_entity($pdo, $entity, $config, $body, $admin);
    }
    if ($action === 'update') {
        update_entity($pdo, $entity, $config, $body, $admin);
    }
    if ($action === 'delete') {
        delete_entity($pdo, $entity, $config, $body, $admin);
    }

    content_json(404, ['error' => 'Unknown content action.']);
} catch (Throwable $error) {
    content_json(500, ['error' => $error->getMessage()]);
}
