# AdBlueMedia Content Locker

A professional, high-converting content locker for 1FMOVIE that integrates with AdBlueMedia's offer feed API.

## Features

✅ **Modern & Premium Design** - Matches your site's dark theme with cyan accent (#00acc1)  
✅ **High-Converting** - Trust-building elements, clear CTAs, and persuasive copy  
✅ **Automatic Lead Detection** - Checks for completed leads every 15 seconds  
✅ **Auto-Unlock** - Content unlocks automatically when a lead is completed  
✅ **Fully Responsive** - Works perfectly on desktop, tablet, and mobile  
✅ **Easy Integration** - Simple to embed into your website  
✅ **JSONP Support** - Cross-origin API requests work seamlessly  

## Files

- `adbluemedia-locker.html` - HTML structure (can be embedded or used standalone)
- `adbluemedia-locker.css` - Styles matching your site's design
- `adbluemedia-locker.js` - JavaScript for API integration and functionality
- `example.html` - Demo page showing how to use the locker
- `INTEGRATION.md` - Detailed integration guide
- `locker-design-by-me.md` - API documentation and credentials
- `prompt.md` - Design requirements

## Quick Start

### 1. Include CSS and JS

Add to your HTML file (preferably in `<head>`):

```html
<link rel="stylesheet" href="content-locker/adbluemedia-locker.css">
<script src="content-locker/adbluemedia-locker.js"></script>
```

### 2. Show the Locker

```javascript
// Show locker when needed
showAdBlueLocker();
```

Or auto-show on page load:

```html
<body data-auto-show-locker="true">
```

## Design

The locker is designed to perfectly match 1FMOVIE's branding:
- **Colors**: Dark background (#111, #1c242c) with cyan accent (#00acc1)
- **Typography**: Work Sans font family
- **Icons**: Bootstrap Icons
- **Style**: Modern, premium, trustworthy

## API Configuration

The locker uses these credentials (from `locker-design-by-me.md`):
- **User ID**: `464413`
- **API Key**: `dce55cd36b365facd86d1f15397ea8aa`
- **Offer Feed**: Returns up to 10 offers
- **Lead Check**: Every 15 seconds

## How It Works

1. **User sees locked content** - Locker modal appears
2. **Offers are loaded** - Fetched from AdBlueMedia API
3. **User completes offer** - Clicks on an offer and completes it
4. **Lead is detected** - System checks every 15 seconds
5. **Content unlocks** - Automatically when lead is completed

## Integration Example

```javascript
// Show locker when video is clicked
document.getElementById('my-video').addEventListener('play', function(e) {
    if (!window.contentUnlocked) {
        e.preventDefault();
        this.pause();
        
        const locker = showAdBlueLocker();
        locker.onUnlock(function() {
            window.contentUnlocked = true;
            document.getElementById('my-video').play();
        });
    }
});
```

## Testing

Set `testing: 1` in the configuration to simulate test leads:

```javascript
showAdBlueLocker({
    testing: 1
});
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Customization

All styles are in `adbluemedia-locker.css`. Modify colors, spacing, fonts, etc. to match your exact needs.

## Support

For API-related issues, refer to `locker-design-by-me.md` for AdBlueMedia API documentation.

For integration help, see `INTEGRATION.md` for detailed instructions.

## License

This content locker is designed specifically for 1FMOVIE website.

