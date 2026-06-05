/**
 * OGAds API Configuration
 * This file contains API credentials and is loaded before the locker script.
 */

window.OGADS_CONFIG = {
    apiToken: '44512|H5Fdpokq0RngYCWNjzAefFoiL9wXDJypCIlZPPuAba8d6a9e',
    offerFeedUrl: 'https://appsave.online/api/v2',
    ipLookupUrls: [
        'https://api.ipify.org?format=json',
        'https://api64.ipify.org?format=json'
    ],
    maxOffers: 3,
    minOffers: '',
    ctype: '3', // 1 (CPI) + 2 (CPA) only
    requiredOffers: 1,
    // postback = unlock only after OGAds conversion hits streamaio.com hub
    unlockMode: 'postback',
    projectSlug: '1fmovie',
    postbackStatusUrl: 'https://streamaio.com/api/unlock-status.php',
    pollIntervalMs: 3000,
    pollTimeoutMs: 600000,
    // Legacy click-unlock (not used when unlockMode is postback)
    clickUnlockDelay: 1200
};
