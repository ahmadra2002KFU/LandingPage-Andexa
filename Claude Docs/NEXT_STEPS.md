# ANDEXA Landing Page - Next Steps

## Project Status: Build Successful

The core landing page structure is complete with:
- 7 major sections implemented
- Full Arabic + English bilingual support
- RTL layout support
- GSAP scroll animations integrated
- Responsive design with mobile navigation

---

## Immediate Next Steps

### 1. Download & Add Fonts

The distinctive fonts need to be added to `/public/fonts/`:

**Download from Google Fonts / Font sources:**

```bash
# Plus Jakarta Sans (Variable)
# https://fonts.google.com/specimen/Plus+Jakarta+Sans

# IBM Plex Sans Arabic
# https://fonts.google.com/specimen/IBM+Plex+Sans+Arabic

# Clash Display (from Fontshare)
# https://www.fontshare.com/fonts/clash-display

# JetBrains Mono (Optional, for code)
# https://fonts.google.com/specimen/JetBrains+Mono
```

Required files in `/public/fonts/`:
- `ClashDisplay-Variable.woff2`
- `PlusJakartaSans-Variable.woff2`
- `IBMPlexSansArabic-Regular.woff2`
- `IBMPlexSansArabic-Medium.woff2`
- `IBMPlexSansArabic-SemiBold.woff2`
- `JetBrainsMono-Variable.woff2`

---

### 2. Optimize Video Asset

Your current video is ~155MB. Compress it:

```bash
# Compress to MP4 (target: <8MB)
ffmpeg -i "assets/Video-Demo.mp4" \
  -c:v libx264 \
  -crf 28 \
  -preset slow \
  -vf "scale=1920:-2" \
  -c:a aac \
  -b:a 128k \
  -movflags +faststart \
  "public/assets/videos/hero-video.mp4"

# Create WebM version (better compression)
ffmpeg -i "assets/Video-Demo.mp4" \
  -c:v libvpx-vp9 \
  -crf 32 \
  -b:v 0 \
  -vf "scale=1280:-2" \
  -c:a libopus \
  -b:a 96k \
  "public/assets/videos/hero-video.webm"

# Create poster frame
ffmpeg -i "assets/Video-Demo.mp4" \
  -vf "select=eq(n\,0)" \
  -q:v 2 \
  "public/assets/images/demo-poster.webp"
```

---

### 3. Configure Contact Form

1. Go to https://formspree.io
2. Create a free account
3. Create a new form
4. Get your form ID (e.g., `xpzgabcd`)
5. Update `src/components/sections/Contact.astro`:

```html
<!-- Change this line: -->
action="https://formspree.io/f/YOUR_FORM_ID"
<!-- To: -->
action="https://formspree.io/f/xpzgabcd"  <!-- your actual ID -->
```

---

### 4. Add Missing Sections (Optional)

These sections are in the content but not yet implemented:
- `HowItWorks.astro` - 3-step flow visualization
- `UseCases.astro` - Role-based examples carousel
- `Comparison.astro` - vs ChatGPT/Power BI table
- `Vision2030.astro` - Saudi alignment section
- `FAQ.astro` - Accordion component

---

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Deployment to Hostinger

1. Run `npm run build`
2. Upload contents of `dist/` folder to Hostinger's `public_html`
3. Enable SSL in Hostinger dashboard
4. Configure domain routing if needed

---

## File Structure Overview

```
02-LandingPage-Andexa/
├── src/
│   ├── components/
│   │   ├── common/          # Button, Card, Container
│   │   ├── layout/          # Header, Footer
│   │   └── sections/        # Hero, Problem, Solution, etc.
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro      # English
│   │   └── ar/index.astro   # Arabic
│   ├── styles/
│   │   ├── global.css
│   │   └── fonts.css
│   ├── i18n/
│   │   └── locales/         # en.json, ar.json
│   └── lib/
│       └── constants.ts
├── public/
│   ├── fonts/               # Add font files here
│   └── assets/
│       ├── images/
│       └── videos/
├── dist/                    # Build output
└── Claude Docs/
    ├── plan.md
    └── NEXT_STEPS.md
```

---

*Last Updated: December 9, 2025*
