<?php
/**
 * Polled by each site's content locker after user clicks an offer.
 * GET ?session=UUID&project=1fmovie
 */

require __DIR__ . '/lib.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    hub_send_cors();
    http_response_code(204);
    exit;
}

hub_send_cors();

$session = hub_safe_id((string) ($_GET['session'] ?? ''), 64);
$project = hub_safe_id((string) ($_GET['project'] ?? ''), 64);

if ($session === '' || $project === '') {
    hub_json_response([
        'unlocked' => false,
        'completedOffers' => 0,
        'error' => 'missing_params',
    ], 400);
}

$record = hub_load_record($session, $project);
$ttl = (int) (hub_config()['unlock_ttl'] ?? 86400);
$completed = 0;
$unlocked = false;

if ($record !== null) {
    $updated = (int) ($record['updated_at'] ?? 0);
    if ($updated > 0 && (time() - $updated) <= $ttl) {
        $completed = (int) ($record['completed_offers'] ?? count($record['conversions'] ?? []));
        $unlocked = $completed > 0;
    }
}

hub_json_response([
    'unlocked' => $unlocked,
    'completedOffers' => $completed,
    'session' => $session,
    'project' => $project,
]);
