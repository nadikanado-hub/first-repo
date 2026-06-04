<?php
/**
 * OGAds postback receiver — single URL for all projects.
 * Paste in OGAds dashboard (Tools → Postback URL):
 * https://streamaio.com/api/postback.php?offer_id={offer_id}&payout={payout}&ip={session_ip}&session={aff_sub}&project={aff_sub2}&title={aff_sub4}&type={aff_sub5}
 * If using postback_secret, append &key=YOUR_SECRET
 */

require __DIR__ . '/lib.php';

if (!hub_verify_postback_secret()) {
    http_response_code(403);
    echo 'Forbidden';
    exit;
}

$session = hub_safe_id((string) ($_GET['session'] ?? $_GET['aff_sub'] ?? ''), 64);
$project = hub_safe_id((string) ($_GET['project'] ?? $_GET['aff_sub2'] ?? ''), 64);
$offerId = hub_safe_id((string) ($_GET['offer_id'] ?? ''), 32);

if ($session === '' || $project === '') {
    http_response_code(400);
    echo 'Missing session or project';
    exit;
}

$now = time();
$record = hub_load_record($session, $project) ?? [
    'session' => $session,
    'project' => $project,
    'conversions' => [],
    'created_at' => $now,
    'updated_at' => $now,
];

$conversion = [
    'offer_id' => $offerId,
    'payout' => (string) ($_GET['payout'] ?? ''),
    'ip' => (string) ($_GET['ip'] ?? $_GET['session_ip'] ?? ''),
    'title' => substr((string) ($_GET['title'] ?? $_GET['aff_sub4'] ?? ''), 0, 200),
    'type' => substr((string) ($_GET['type'] ?? $_GET['aff_sub5'] ?? ''), 0, 32),
    'at' => $now,
];

$record['conversions'][] = $conversion;
$record['updated_at'] = $now;
$record['completed_offers'] = count($record['conversions']);

hub_save_record($session, $project, $record);

http_response_code(200);
header('Content-Type: text/plain; charset=utf-8');
echo 'OK';
