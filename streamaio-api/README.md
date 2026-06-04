# OGAds postback hub for streamaio.com

Deploy the `api/` folder and `data/` folder to your server so URLs resolve as:

- `https://streamaio.com/api/postback.php`
- `https://streamaio.com/api/unlock-status.php`

## Setup

1. Upload `api/` and `data/` to streamaio.com.
2. Ensure `data/conversions/` is writable by PHP.
3. Copy `api/config.example.php` to `api/config.local.php` on the server.
4. Add every movie-site origin to `allowed_origins` (required for unlock polling).
5. Optionally set `postback_secret` and append `&key=YOUR_SECRET` to the OGAds postback URL.

## OGAds dashboard — Postback URL (one URL for all projects)

```
https://streamaio.com/api/postback.php?offer_id={offer_id}&payout={payout}&ip={session_ip}&session={aff_sub}&project={aff_sub2}&title={aff_sub4}&type={aff_sub5}
```

Test with OGAds Postback Simulator before going live.

## Per-site locker config

Each project uses a unique `projectSlug` in `content-locker/adblue-config.js` (e.g. `1fmovie` for this site). Offer links send `aff_sub` (session) and `aff_sub2` (project) so postbacks route correctly.
