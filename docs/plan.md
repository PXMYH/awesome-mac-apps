# Mac Apps Search Website - Implementation Plan

## Overview

Build a lightweight static website for searching and filtering ~850 Mac apps from the [awesome-mac](https://github.com/jaywcjlove/awesome-mac) repository.

**Goals:**
- No ads or sponsor content
- Real-time search by app name (fuzzy search)
- Filter by Free/Paid
- Fast, lightweight, static site

---

## Data Source Analysis

**Source:** `https://github.com/jaywcjlove/awesome-mac/blob/master/README.md`

### Structure
- ~850 apps in 28 categories, 80+ subcategories
- Format: `* [App Name](URL) - Description. [Badge Icons]`

### Pricing Detection via Badges
| Badge | Meaning | Pricing |
|-------|---------|---------|
| `![Freeware][Freeware Icon]` | Free to use | FREE |
| `[![Open-Source Software][OSS Icon]]` | Open Source | FREE |
| No badge | Commercial | PAID |
| `[![App Store][app-store Icon]]` | App Store link | (varies) |

---

## Tech Stack

| Component | Choice | Why |
|-----------|--------|-----|
| Framework | Vanilla JS | Zero dependencies, fastest load |
| Search | Fuse.js (~25KB) | Best fuzzy search, client-side |
| Styling | Tailwind CSS (CDN) | Utility-first, responsive |
| Build | Node.js script | One-time data extraction |
| Hosting | GitHub Pages | Free, auto-deploy |

---

## Project Structure

```
awesome-mac-apps/
├── index.html              # Main page
├── css/
│   └── styles.css          # Custom styles (minimal)
├── js/
│   ├── app.js              # Main app logic
│   └── search.js           # Search/filter logic
├── scripts/
│   └── parse-readme.js     # Data extraction script
├── data/
│   └── apps.json           # Generated app data
├── docs/
│   └── plan.md             # This file
└── package.json            # Build scripts
```

---

## Data Schema

```json
{
  "id": 1,
  "name": "Visual Studio Code",
  "url": "https://code.visualstudio.com/",
  "description": "Microsoft's free & open-source editor",
  "category": "Developer Tools",
  "subcategory": "IDEs",
  "pricing": "free",
  "isOpenSource": true,
  "isAppStore": false,
  "repoUrl": "https://github.com/Microsoft/vscode"
}
```

---

## Implementation Steps

### Phase 1: Data Pipeline
1. [ ] Create `scripts/parse-readme.js`
   - Fetch README.md from GitHub raw URL
   - Parse markdown with regex to extract apps
   - Detect pricing from badge patterns
   - Track category/subcategory hierarchy
   - Output to `data/apps.json`

### Phase 2: Core UI
2. [ ] Create `index.html`
   - Search input field
   - Filter buttons: All / Free / Paid
   - Results count display
   - App card grid/list

3. [ ] Style with Tailwind CSS
   - Responsive layout (mobile-first)
   - Clean, minimal design
   - Badge styling (Free=green, Paid=gray, OSS=blue)

### Phase 3: Search & Filter Logic
4. [ ] Implement `js/app.js`
   - Load `apps.json` on page load
   - Initialize Fuse.js with fuzzy search config
   - Debounced search input (150ms)
   - Real-time filter by pricing

5. [ ] Fuse.js configuration:
   ```javascript
   {
     keys: [
       { name: 'name', weight: 0.7 },
       { name: 'description', weight: 0.3 }
     ],
     threshold: 0.4,
     ignoreLocation: true
   }
   ```

### Phase 4: Polish
6. [ ] Add empty state ("No apps found")
7. [ ] Add loading state
8. [ ] Keyboard navigation support
9. [ ] Cross-browser testing

### Phase 5: Deployment
10. [ ] Configure GitHub Pages
11. [ ] Create project README
12. [ ] (Optional) GitHub Action for auto-updates

---

## UI Layout

```
┌─────────────────────────────────────────────────────┐
│  Mac Apps Search                           [GitHub] │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐    │
│  │ Search apps...                              │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  [All] [Free] [Paid]              Showing 847 apps  │
├─────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────┐  │
│  │ Visual Studio Code                 FREE  OSS  │  │
│  │ Developer Tools > IDEs                        │  │
│  │ Microsoft's free & open-source editor...      │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │ Sublime Text                            PAID  │  │
│  │ Text Editors                                  │  │
│  │ A sophisticated text editor for code...       │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1s |
| Time to Interactive | < 2s |
| Total Bundle Size | < 50KB |
| Search Latency | < 50ms |
| Lighthouse Score | > 95 |

---

## Verification Plan

1. **Data Extraction**: Run parser, verify ~850 apps extracted with correct pricing
2. **Search**: Test fuzzy search ("vscode" finds "Visual Studio Code")
3. **Filter**: Toggle Free/Paid, verify counts match
4. **Responsive**: Test on mobile viewport (375px)
5. **Performance**: Run Lighthouse audit, target >95 score

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `scripts/parse-readme.js` | Create | Parse README to JSON |
| `data/apps.json` | Generate | Structured app data |
| `index.html` | Create | Main page UI |
| `js/app.js` | Create | App logic & rendering |
| `js/search.js` | Create | Fuse.js search wrapper |
| `css/styles.css` | Create | Custom styles |
| `package.json` | Create | Build scripts |

---

## Future Enhancements (Out of Scope)

- Category dropdown filter
- Dark mode
- URL state for shareable searches
- PWA offline support
- Favorites with localStorage
