# Add Content to config.json

This script allows you to add specific movies or TV shows to your `config.json` file by fetching data from TMDB API.

## How to Use

### Basic Usage

**Add a single movie:**
```bash
node add-content.js --movie 575265
```

**Add a single TV series:**
```bash
node add-content.js --tv 248852
```

**Add multiple items at once:**
```bash
# Multiple movies (comma-separated)
node add-content.js --movie 575265,617126,1087192

# Mix of movies and TV series
node add-content.js --movie 575265,617126 --tv 248852,93405
```

### Features

✅ **Only adds what you specify** - No automatic additions  
✅ **Prevents duplicates** - Skips if content already exists  
✅ **Creates backup** - Automatically backs up config.json before changes  
✅ **Fetches metadata** - Gets title, description, images, cast, director, etc. from TMDB  
✅ **Preserves existing data** - Everything else in config.json stays untouched  

### What Gets Added

For **Movies**, the script fetches:
- Title, description, rating
- Thumbnail and poster images
- Duration, genre, release date
- Director and cast
- Production company
- Default video link placeholder (`vids/Universal.mp4`)

For **TV Series**, the script fetches:
- Title, description, rating
- Thumbnail and poster images
- Genre, release date
- Creator (instead of director) and cast
- Production company
- Default season info and episode placeholders

### Finding TMDB IDs

1. Go to [TMDB.org](https://www.themoviedb.org/)
2. Search for the movie or TV show
3. Click on it to open the details page
4. The ID is in the URL: `https://www.themoviedb.org/movie/575265` (ID = 575265)

### Notes

- The script automatically checks if content already exists (by ID) and skips duplicates
- A backup of `config.json` is created before any changes (with timestamp)
- The script respects TMDB API rate limits with delays between requests
- After adding, you may want to manually:
  - Update `vidLink` with your actual video file path/URL
  - Add the new IDs to `HomeSliderIds`, `TrendingNowIds`, etc. arrays if needed
  - For TV series, update `seasonEpisodesVids` with actual episode video links

### Example Output

```
🚀 Starting content addition...

📂 Loaded config.json (17 movies, 11 series)

🎬 Adding Movies:
🎬 Fetching movie ID: 575265
   ✓ Mission: Impossible - The Final Reckoning (2025) - Rating: 7.2

==================================================
📊 SUMMARY:
==================================================
✅ Movies added: 1
✅ TV series added: 0
==================================================

💾 Saving config.json...
📦 Backup created: config.json.backup.1703123456789
✅ config.json updated successfully!

📊 Final count: 18 movies, 11 series
```
