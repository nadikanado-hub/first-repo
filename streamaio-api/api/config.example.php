<?php
/**
 * Copy to config.local.php on streamaio.com (do not commit secrets).
 */
return [
    'postback_secret' => 'change-me-to-a-long-random-string',
    'allowed_origins' => [
        'https://1fmovie.com',
        'https://www.1fmovie.com',
        // Add project 2, 3, etc.
    ],
];
