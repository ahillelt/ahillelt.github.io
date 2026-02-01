# CLAUDE.md - AI Assistant Guide for ahillelt.github.io

## Project Overview

This is **Alon Hillel-Tuch's professional portfolio website** - a static GitHub Pages site showcasing academic credentials, cybersecurity/AI governance expertise, research publications, speaking engagements, and industry experience. target audience is universities & colleges, industry professionals, and expert witness opportunities. 

**Key Facts:**
- **Type:** Static single-page website (no build process, no frameworks)
- **Hosting:** GitHub Pages (`*.github.io` repository)
- **Stack:** Pure HTML5 + CSS3 + Vanilla JavaScript
- **Content Management:** CSV-driven architecture (34 data files)

## Repository Structure

```
/
├── index.html          # Main website (2,363 lines) - 8 major sections
├── styles.css          # Styling (1,347 lines) - responsive, modern design
├── script.js           # JavaScript (1,016 lines) - CSV loading, interactions
├── Images/             # Headshot photos (headshot.png, headshot2.png, headshot-thumb.jpg)
├── *.csv               # 34 CSV data files (all content lives here)
├── .gitignore          # Excludes node_modules/
└── CLAUDE.md           # This file
```

## CSV Data Architecture

All website content is externalized into CSV files for easy editing without touching code. This is a **critical design pattern** - content updates should modify CSV files, not HTML.

### CSV Categories

| Category | Files | Purpose |
|----------|-------|---------|
| **Hero/Stats** | `hero_content.csv`, `stats.csv` | Homepage hero section content |
| **About** | `about_content.csv`, `section_headers.csv` | Bio cards and section titles |
| **Contact** | `contact_info.csv`, `professional_profiles.csv` | Contact details and social links |
| **Teaching** | `courses_history.csv`, `courses_catalog.csv`, `course_development.csv`, `cae_designations.csv` | Course info and CAE certifications |
| **Speaking** | `keynotes_speaking.csv`, `congressional_testimony.csv`, `press_coverage.csv`, `speaking_topics.csv`, `podcasts_webinars.csv`, `academic_legal_forums.csv` | Speaking engagements and media |
| **Research** | `papers_published.csv`, `patents.csv`, `research_areas.csv` | Publications and patents |
| **Industry** | `career_experience.csv`, `industry_companies.csv`, `consulting_advisory.csv`, `partnership_projects.csv`, `partners_list.csv` | Business ventures and consulting |
| **Credentials** | `credentials.csv`, `education.csv`, `technical_skills.csv`, `languages.csv`, `forbes_council.csv` | Awards, degrees, skills |

### CSV Format Conventions

1. **Key-Value Format:**
   ```csv
   key,value
   title,"Cybersecurity Researcher..."
   ```

2. **Pipe-Delimited Lists** (for arrays within cells):
   ```csv
   items
   "Item 1|Item 2|Item 3"
   ```

3. **Links Format:**
   ```csv
   links
   "📄 Label|https://url.com::📺 Watch|https://other.com"
   ```

4. **HTML Content:** CSVs may contain HTML tags (`<strong>`, `<br>`, etc.)

5. **Quote Escaping:** Double quotes within values use `""` (standard CSV)

## Development Workflow

### Making Content Changes

1. **Edit the appropriate CSV file** - Never hardcode content in HTML
2. **Test locally** by opening `index.html` in a browser (or use a local server)
3. **Commit and push** - Site auto-deploys via GitHub Pages

### Making Code Changes

1. **Read existing code first** before modifications
2. **Maintain the CSV-driven architecture** - Don't embed new content in HTML
3. **Follow existing patterns** in script.js for data loading
4. **Test responsiveness** - Site uses mobile-first CSS
5. **Verify accessibility** - ARIA labels, semantic HTML, color contrast

### Local Testing

```bash
# Option 1: Simple Python server
python -m http.server 8000

# Option 2: Open directly (may have CORS issues with CSV loading)
open index.html
```

### Deployment

Push to `main` branch triggers automatic GitHub Pages deployment. No build step required.

## Code Conventions

### JavaScript Patterns

- **DOM Caching:** All frequently accessed elements are cached in `DOM_CACHE` object
- **CSV Parsing:** Custom parser handles quoted fields, embedded commas, and escaping
- **XSS Prevention:** Use `escapeHtml()` function for user-facing content
- **Performance:** Intersection Observer for animations, throttled scroll events
- **Cookies:** Secure flags (`SameSite=Strict`, `Secure`) for layout preferences

### CSS Patterns

- **CSS Variables:** Theme colors defined as custom properties at `:root`
- **Responsive:** Mobile-first with breakpoints at standard widths
- **Glassmorphism:** Uses `backdrop-filter: blur()` for modern effects
- **GPU Acceleration:** `transform: translateZ(0)` and `will-change` for smooth animations

### HTML Patterns

- **Semantic Sections:** Each major section has an ID matching navigation
- **ARIA Labels:** Accessibility attributes on interactive elements
- **Security Headers:** CSP, X-Frame-Options, etc. in meta tags
- **SEO:** JSON-LD schema, Open Graph, Twitter Cards

## Key Files Reference

### index.html (2,363 lines)
- Lines 1-150: Head (meta, security headers, SEO, preloads)
- Lines 151-300: Navigation and hero section
- Lines 301-800: About, Press/Speaking sections
- Lines 801-1200: Teaching, Labs sections
- Lines 1201-1600: Research, Industry sections
- Lines 1601-2000: Credentials, Contact sections
- Lines 2001-2363: Footer and inline scripts for CSV loading

### script.js (1,016 lines)
- Lines 1-100: DOM caching and utility functions
- Lines 101-250: CSV parsing and data loading
- Lines 251-500: Section renderers (teaching, speaking, etc.)
- Lines 501-700: UI interactions (mobile menu, scroll, filters)
- Lines 701-900: Layout customization and preferences
- Lines 901-1016: Initialization and event listeners

### styles.css (1,347 lines)
- Lines 1-100: CSS variables and reset
- Lines 101-400: Navigation and hero styles
- Lines 401-800: Section-specific styles
- Lines 801-1100: Cards, grids, buttons
- Lines 1101-1347: Responsive breakpoints and utilities

## Important Considerations

### Do's
- Update CSV files for content changes
- Maintain existing security headers
- Preserve accessibility features (ARIA, semantic HTML)
- Test on mobile viewports
- Follow the established CSV format conventions
- Maintain strong cyber security practices

### Don'ts
- Don't hardcode content in HTML (use CSVs)
- Don't add build tools or dependencies (keep it simple)
- Don't remove security headers or CSP
- Don't break the CSV-driven architecture
- Don't add external dependencies without strong justification

## Git Workflow

- **Main branch:** Production (auto-deploys to GitHub Pages)
- **Feature branches:** Use `claude/` prefix for AI-assisted changes
- **Commit pattern:** Recent commits are mostly CSV data updates
- **No CI/CD:** Direct deployment via GitHub Pages

## Common Tasks

### Adding a New Speaking Engagement
Edit `keynotes_speaking.csv`:
```csv
title,event,date,location,description,video_url
"New Talk Title","Conference Name","2026","City, State","Description here","https://vimeo.com/..."
```

### Adding a New Publication
Edit `papers_published.csv`:
```csv
title,authors,venue,year,url,abstract
"Paper Title","Author 1, Author 2","Journal/Conference","2026","https://doi.org/...","Abstract text"
```

### Updating Course Information
Edit `courses_history.csv` for teaching history or `courses_catalog.csv` for course catalog.

### Adding Press Coverage
Edit `press_coverage.csv`:
```csv
outlet,title,date,url,description
"NPR","Article Title","2026-01-15","https://npr.org/...","Brief description"
```

## Performance Notes

- Hero image is preloaded for faster LCP
- Fonts use async loading with system fallbacks
- CSV files fetched with `cache: 'no-store'` for fresh content
- Intersection Observer enables lazy animation loading
- DOM queries are cached to prevent repeated selects

## Security Features

- Content Security Policy (CSP) configured
- X-Frame-Options: DENY
- X-XSS-Protection enabled
- Secure cookie flags for preferences
- Input escaping for XSS prevention
- HTTPS enforced via GitHub Pages
