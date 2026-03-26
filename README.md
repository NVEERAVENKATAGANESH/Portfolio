# Veera Venkata Ganesh Nurukurthi — Portfolio

Personal portfolio website for **Veera Venkata Ganesh Nurukurthi**, Full-Stack Developer & AI Enthusiast.

**Live:** [nveeravenkataganesh.github.io](https://nveeravenkataganesh.github.io/test/)

---

## Features

- **Dark / Light Theme** — auto-detects OS preference, persists via `localStorage`
- **Three.js Galaxy Background** — interactive particle system in dark mode
- **Skills Section** — animated horizontal progress bars with category labels, triggered on scroll
- **Timeline** — Education / Experience toggle with staggered entry animations
- **Projects** — searchable (title + description + tech tags), filterable by category, sortable A–Z
- **Case Studies** — in-depth write-ups for UIMS, Lane Line Detection, and BenefitsConnect
- **Achievements** — certificate modal viewer with PDF and image support
- **Testimonials** — auto-scrolling carousel with dot navigation, touch/swipe support
- **Interactive Resume** — inline HTML resume with print support; PDF download also available
- **Gallery** — dedicated page with split/grid view, lightbox, slideshow, keyboard shortcuts
- **Contact Form** — Formspree-backed with client-side validation
- **PWA** — Web Manifest + Service Worker for installability
- **SEO** — Structured data (Person, SoftwareApplication, EducationalOccupationalCredential), Open Graph, Twitter Card, sitemap

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| HTML | HTML5, Semantic markup, ARIA |
| CSS | CSS3, CSS Custom Properties (tokens), CSS Grid, Flexbox |
| JavaScript | Vanilla ES6+, no frontend framework |
| 3D | Three.js |
| Animation | GSAP + ScrollTrigger |
| UI Framework | Bootstrap 5.3 (grid + utilities) |
| Icons | Font Awesome 6.5 |
| Fonts | Google Fonts — Inter |
| Contact | Formspree |
| Hosting | GitHub Pages |

---

## Project Structure

```
ganesh-portfolio/
├── index.html              # Main SPA entry point
├── gallery.html            # Dedicated photo/video gallery
├── 404.html                # Custom error page
├── manifest.webmanifest    # PWA manifest
├── robots.txt
├── sitemap.xml
├── Ganesh_SDE.pdf          # Downloadable resume
├── css/
│   ├── tokens.css          # Design system variables
│   ├── base.css            # Global resets
│   ├── layout.css          # Section layouts
│   ├── components.css      # Component styles
│   ├── animations.css      # Keyframe animations
│   └── responsive.css      # Media queries
├── js/
│   ├── main.js             # Core features
│   ├── background.js       # Three.js galaxy
│   ├── gallery.js          # Gallery page logic
│   ├── animations.js       # Scroll animations
│   ├── nav.js              # Navigation builder
│   ├── theme.js            # Dark/light theme
│   └── sw.js               # Service worker
├── case-studies/
│   ├── uims.html           # UIMS case study
│   ├── lane-detection.html # Lane detection case study
│   └── benefitsconnect.html# BenefitsConnect case study
└── images/
    ├── certificates/       # Achievement certificates
    ├── projects/           # Project reports
    └── testimonials/       # Testimonial photos
```

---

## Accessibility

- WCAG 2.1 AA compliant
- Full keyboard navigation
- Screen reader support (ARIA labels, live regions, focus management)
- Reduced motion support (`prefers-reduced-motion`)
- High contrast dark/light themes

---

## License

© 2026 Veera Venkata Ganesh Nurukurthi. All rights reserved.
