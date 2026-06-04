<?php
/**
 * OGAds central postback hub — deploy this folder to https://streamaio.com/api/
 * Copy config.example.php to config.local.php and set your secret + allowed origins.
 */

$config = [
    // Optional shared secret: append &key=YOUR_SECRET to OGAds postback URL
    'postback_secret' => '',

    // Directory for conversion JSON files (must be writable)
    'data_dir' => __DIR__ . '/../data/conversions',

    // How long unlock records stay valid (seconds)
    'unlock_ttl' => 86400,

    // Sites allowed to poll unlock-status (add every movie domain)
    'allowed_origins' => [
        'https://1fmovie.com',
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
    ],
];

$local = __DIR__ . '/config.local.php';
if (is_file($local)) {
    $overrides = require $local;
    if (is_array($overrides)) {
        $config = array_merge($config, $overrides);
    }
}

return $config;
