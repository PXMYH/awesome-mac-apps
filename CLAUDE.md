# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A lightweight static website for searching and filtering Mac applications from the [awesome-mac](https://github.com/jaywcjlove/awesome-mac) repository. Features fuzzy search and free/paid filtering with no ads.

**Live site:** https://pxmyh.github.io/awesome-mac-apps/

## Commands

```bash
# Install dependencies
bun install

# Full build (fetch data + typecheck + bundle)
bun run build

# Fetch latest app data from awesome-mac
bun run fetch-data

# Type check only
bun run typecheck

# Bundle TypeScript only
bun run bundle

# Start local dev server
bun run dev
```

## Architecture

### Data Pipeline
`scripts/parse-readme.js` fetches the awesome-mac README.md from GitHub and parses it into structured JSON (`data/apps.json`). It extracts:
- App name, URL, description
- Category/subcategory hierarchy
- Pricing (free if has Freeware or OSS badge, otherwise paid)
- Open source repo URL, App Store URL

### Frontend
Single-page static site using:
- **TypeScript** (`src/app.ts`) - `MacAppsSearch` class handles all UI logic
- **Fuse.js** (CDN) - Client-side fuzzy search
- **Tailwind CSS** (CDN) - Styling

The app loads `data/apps.json` on page load, initializes Fuse.js for search, and renders results with debounced input handling.

### Build Output
Bun bundles `src/app.ts` → `dist/app.js` (minified). The site is deployed via GitHub Pages from the main branch.

## Key Files

- `src/types.ts` - TypeScript interfaces for `App`, `AppData`, `PricingFilter`
- `src/app.ts` - Main application class
- `scripts/parse-readme.js` - Data extraction script
- `data/apps.json` - Generated app data (~1000 apps)
- `index.html` - Main page
