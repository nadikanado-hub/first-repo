<?php

function hub_config(): array
{
    static $cfg;
    if ($cfg === null) {
        $cfg = require __DIR__ . '/config.php';
    }
    return $cfg;
}

function hub_ensure_data_dir(): void
{
    $dir = hub_config()['data_dir'];
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}

function hub_safe_id(string $value, int $maxLen = 128): string
{
    $value = trim($value);
    if ($value === '') {
        return '';
    }
    $value = preg_replace('/[^a-zA-Z0-9._-]/', '', $value) ?? '';
    return substr($value, 0, $maxLen);
}

function hub_record_path(string $session, string $project): string
{
    $session = hub_safe_id($session, 64);
    $project = hub_safe_id($project, 64);
    if ($session === '' || $project === '') {
        return '';
    }
    return hub_config()['data_dir'] . '/' . $project . '_' . $session . '.json';
}

function hub_load_record(string $session, string $project): ?array
{
    $path = hub_record_path($session, $project);
    if ($path === '' || !is_file($path)) {
        return null;
    }
    $raw = file_get_contents($path);
    if ($raw === false) {
        return null;
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : null;
}

function hub_save_record(string $session, string $project, array $record): bool
{
    hub_ensure_data_dir();
    $path = hub_record_path($session, $project);
    if ($path === '') {
        return false;
    }
    return file_put_contents($path, json_encode($record, JSON_UNESCAPED_SLASHES), LOCK_EX) !== false;
}

function hub_send_cors(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = hub_config()['allowed_origins'] ?? [];

    if ($origin !== '' && in_array($origin, $allowed, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    }

    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

function hub_json_response(array $payload, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function hub_verify_postback_secret(): bool
{
    $secret = hub_config()['postback_secret'] ?? '';
    if ($secret === '') {
        return true;
    }
    $key = $_GET['key'] ?? '';
    return is_string($key) && hash_equals($secret, $key);
}
