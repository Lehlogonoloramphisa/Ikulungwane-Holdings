<?php
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}

function media_response($status, $message) {
    http_response_code($status);
    header('Content-Type: text/plain; charset=utf-8');
    echo $message;
    exit;
}

function media_filename() {
    $file = (string) ($_GET['file'] ?? '');
    $file = rawurldecode($file);
    $file = basename($file);

    if ($file === '' || $file === '.' || $file === '..') {
        media_response(400, 'Missing media file.');
    }

    if (!preg_match('/^[a-zA-Z0-9._-]+$/', $file)) {
        media_response(400, 'Invalid media file.');
    }

    return $file;
}

function media_paths($filename) {
    return [
        dirname(dirname(__DIR__)) . '/ikulungwane_uploads/' . $filename,
        dirname(__DIR__) . '/uploads/' . $filename,
        __DIR__ . '/uploads/' . $filename,
    ];
}

function media_type($path) {
    $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    $types = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'webp' => 'image/webp',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'ico' => 'image/x-icon',
        'pdf' => 'application/pdf',
        'mp4' => 'video/mp4',
        'mov' => 'video/quicktime',
        'webm' => 'video/webm',
        'doc' => 'application/msword',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    return $types[$extension] ?? 'application/octet-stream';
}

$filename = media_filename();
$path = null;

foreach (media_paths($filename) as $candidate) {
    if (is_file($candidate) && is_readable($candidate)) {
        $path = $candidate;
        break;
    }
}

if (!$path) {
    media_response(404, 'Media file not found. Re-upload this file from the admin area.');
}

$type = media_type($path);
header('Content-Type: ' . $type);
header('Content-Length: ' . filesize($path));
header('Cache-Control: public, max-age=31536000, immutable');
header('X-Content-Type-Options: nosniff');

readfile($path);
