# Environment Variables Setup

This directory uses environment variables to securely store API credentials.

## Setup Instructions

1. **Create a `.env` file** in the `dsjs` directory with the following content:

```
TMDB_API_KEY=your_api_key_here
TMDB_BASE_URL=https://api.themoviedb.org/3
```

2. **Get your TMDB API key**:
   - Visit https://www.themoviedb.org/settings/api
   - Create an account or log in
   - Request an API key
   - Copy the API key and paste it in the `.env` file

3. **Example `.env` file**:
```
TMDB_API_KEY=84259f99204eeb7d45c7e3d8e36c6123
TMDB_BASE_URL=https://api.themoviedb.org/3
```

## Security Notes

- The `.env` file is already in `.gitignore` and will NOT be committed to version control
- Never share your `.env` file or commit it to Git
- If you need to share the project, create a `.env.example` file with placeholder values

## Installation

Make sure you have installed the `dotenv` package:

```bash
cd dsjs
npm install
```

This will install the `dotenv` package which is required to load environment variables.

