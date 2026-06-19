# Portfolio SSG

A dark-themed developer portfolio built with [Eleventy](https://www.11ty.dev/) and deployed to GitHub Pages.

## Quick start

```bash
npm install
npm start      # dev server at http://localhost:8080
npm run build  # output to _site/
```

## Customize content

Edit `src/_data/site.json` to replace placeholders with your own info:

- **name**, **tagline**, **bio** — hero section
- **social** — GitHub, LinkedIn, email links
- **techStack** — skill tags
- **interests** — areas of interest
- **projects** — project cards with tags
- **writings** — blog/article list

Replace `src/assets/img/profile.svg` with your photo, or point `profileImage` to an external URL.

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push to `main` — the workflow in `.github/workflows/deploy.yml` builds and deploys automatically.

## Project structure

```
src/
├── _data/site.json       # All site content (placeholders)
├── _includes/
│   ├── icons.njk         # SVG icon macros
│   └── layouts/base.njk  # HTML shell
├── assets/
│   ├── css/main.css
│   └── img/              # Placeholder SVGs
└── index.njk             # Homepage template
```
