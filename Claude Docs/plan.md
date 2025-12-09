# ANDEXA Landing Page - Implementation Plan

## Project Overview
A sovereign AI analytics landing page for Saudi healthcare, featuring:
- **13+ content sections** from hero to footer
- **Bilingual support** (Arabic RTL + English LTR)
- **Video hero** with optimized playback
- **Distinctive design** avoiding generic "AI slop" aesthetics

---

## 1. TECH STACK

| Category | Choice | Rationale |
|----------|--------|-----------|
| **Framework** | Astro 4.x | Static-first, zero JS by default, islands for interactivity |
| **UI Components** | React 18 (islands only) | Mature ecosystem, RTL support |
| **Styling** | Tailwind CSS 3.4 | Utility-first, built-in RTL via `rtl:` variant |
| **Animations** | CSS + GSAP 3 | CSS for simple, GSAP for scroll animations |
| **Fonts** | Clash Display + Plus Jakarta Sans + IBM Plex Sans Arabic | Distinctive, non-generic typography |
| **Form Handling** | Formspree or PHP mail() | Contact form → andexa.tech email |
| **Hosting** | Hostinger | Static site deployment |
| **Domain** | andexa.tech | With email support |

### Interactive Islands (React)
- Navigation mobile menu
- Video player controls
- FAQ accordion
- Contact form
- Language switcher
- Animated counters

---

## 2. DESIGN SYSTEM

### Philosophy: "Crystalline Intelligence"
Geometric crystalline structure from logo - data chaos transformed into clear intelligence.

### Color Palette (from logo analysis)

| Token | Hex | Usage |
|-------|-----|-------|
| `--teal-900` | #0D4A5E | Deep anchors, dark sections |
| `--teal-700` | #1B6B8A | Primary brand, headings, CTAs |
| `--cyan-400` | #3BB3B1 | Accents, highlights |
| `--slate-950` | #0A1118 | Primary text |
| `--cream-white` | #FDFEFE | Page background |
| `--sand-gold` | #C9A962 | Vision 2030 section accent |

### Typography

| Role | Font | Weight |
|------|------|--------|
| Display/Headlines | Clash Display | 600 (Semi-Bold) |
| Body/UI | Plus Jakarta Sans | 400-600 |
| Arabic | IBM Plex Sans Arabic | 400-600 |
| Code/Technical | JetBrains Mono | 400 |

### Design Rules
1. **NO gradients** - Use layered solids with shadows
2. **Asymmetric layouts** - Break cookie-cutter patterns
3. **60-30-10 rule** - 60% neutrals, 30% teal, 10% cyan/gold accents
4. **8-12px border radius** - Modern, approachable feel

---

## 3. SECTION BREAKDOWN

### 3.1 Navigation (Fixed)
- Sticky header with backdrop blur
- Logo left, nav links center, CTA + language toggle right
- Shrink on scroll behavior

### 3.2 Hero Section - "The Query Moment"
- **Layout**: 55/45 asymmetric split
- **Left**: Headline with word-staggered animation + CTAs
- **Right**: Video-Demo.mp4 in floating device frame (tilted 3-5 degrees)
- **Background**: Cream white + blurred teal shape + floating geometric nodes
- **Animation sequence**: Background fade (500ms) -> Nav slide (400ms) -> Headline stagger (100ms each) -> CTAs slide (200ms) -> Video slide (400ms)

### 3.3 Problem Section - "The Friction Visualization"
- Horizontal scrolling cards (desktop) / vertical stack (mobile)
- Cards with left border accent
- Large animated statistic "62%" counting up

### 3.4 Solution Section - "The Three Pillars"
- Dark teal background (`--teal-900`)
- Staggered vertical card layout (architectural depth)
- Custom geometric icons matching logo style

### 3.5 How It Works - "The Transformation Flow"
- 3-step horizontal journey: Connect -> Ask -> Act
- Animated dashed lines with traveling dots (SVG path animation)
- Large step numbers as background elements

### 3.6 Key Benefits - "The Impact Grid"
- Asymmetric bento grid layout
- Mix of large/medium/stat cards
- One featured card with `--teal-700` background

### 3.7 Use Cases - "The Role Carousel"
- Interactive role selector (pill tabs)
- Content switches with crossfade animation
- Before/After comparison table below

### 3.8 Security Section - "The Fortress"
- Dark section (`--slate-950`)
- Central animated shield with orbiting compliance badges
- Data flow sovereignty visualization

### 3.9 Comparison Table
- ANDEXA column highlighted (light cyan background)
- Clear iconography (X, Warning, Checkmark)
- Mobile: Convert to stacked comparison cards

### 3.10 Vision 2030 Section - "Proudly Saudi"
- Primary use of `--sand-gold` accents
- Subtle geometric pattern (Saudi architectural inspiration)
- Large animated investment statistics (SAR 214B)

### 3.11 Pricing Section
- Single prominent card centered
- Token pricing vs flat rate visualization
- CTA: Request Pricing

### 3.12 FAQ Section
- Two-column accordion (desktop)
- Smooth height animation with CSS grid
- Active item border accent

### 3.13 Final CTA + Contact Form
- Dark teal section
- Split layout: CTA content left, floating form card right
- Form fields: Name*, Organization*, Role, Email*, Phone, Message

### 3.14 Footer
- Dark section (`--slate-950`)
- Multi-column links
- "Proudly Sovereign" tagline with Saudi flag

---

## 4. CRITICAL ASSETS

### Video Optimization (PRIORITY)
Current: ~155MB (UNACCEPTABLE)
Target:
- MP4: < 8MB (1080p) or < 4MB (720p)
- WebM: < 5MB (better compression)
- Poster frame: < 100KB

```bash
# Compress video
ffmpeg -i Video-Demo.mp4 -c:v libx264 -crf 28 -preset slow -vf "scale=1920:-2" -movflags +faststart hero-video.mp4

# Create WebM
ffmpeg -i Video-Demo.mp4 -c:v libvpx-vp9 -crf 32 -b:v 0 -vf "scale=1280:-2" hero-video.webm

# Create poster
ffmpeg -i Video-Demo.mp4 -vf "select=eq(n\,0)" -q:v 2 hero-poster.webp
```

### Logo & Images
- Convert to WebP with PNG fallback
- Generate responsive srcset
- Lazy loading for below-fold

---

## 5. FILE STRUCTURE

```
02-LandingPage-Andexa/
├── src/
│   ├── components/
│   │   ├── common/       # Button, Card, Badge, Container
│   │   ├── layout/       # Header, Footer, Navigation
│   │   ├── sections/     # Hero, Problem, Solution, etc.
│   │   └── ui/           # VideoHero, AnimatedCounter, etc.
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro   # English
│   │   └── ar/index.astro # Arabic
│   ├── styles/
│   │   ├── global.css
│   │   ├── fonts.css
│   │   ├── animations.css
│   │   └── rtl.css
│   ├── i18n/
│   │   ├── locales/      # en.json, ar.json
│   │   └── utils.ts
│   └── lib/
│       ├── constants.ts  # Design tokens
│       └── animations.ts # GSAP setup
├── public/
│   ├── fonts/
│   └── assets/
├── Claude Docs/
│   └── plan.md
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

---

## 6. ANIMATION STRATEGY

### Page Load Sequence
1. Background shape fades in (500ms)
2. Logo/Nav slides down (400ms)
3. Hero headline words stagger in (100ms each)
4. Subheadline fades in (300ms)
5. CTAs slide up (200ms)
6. Video container slides from right (400ms)
7. Floating nodes begin animation (2500ms)

### Scroll Triggers
- Sections: Fade up at 20% visibility
- Cards: Stagger reveal with 100-150ms delay
- Statistics: Counter animation (2s duration)
- How It Works: Sequential step reveals with path animation

### Micro-interactions
- Buttons: Scale + shadow on hover (150ms)
- Cards: Lift + shadow increase (200ms)
- Links: Underline animates from center
- Form inputs: Label shift on focus

### Reduced Motion Support
- Respect `prefers-reduced-motion` media query
- Instant state transitions instead of animations
- Static poster instead of video

---

## 7. RTL/ARABIC SUPPORT

### Translation Approach
- Arabic translations will be created during implementation
- All content from content.md will be translated to Arabic
- Translations stored in `src/i18n/locales/ar.json`

### Implementation
- CSS Logical Properties (`padding-inline-start`, `margin-inline-end`)
- Tailwind `rtl:` variant for direction-specific styles
- `dir="rtl"` and `lang="ar"` on HTML element
- IBM Plex Sans Arabic font (+2px size adjustment)

### Flipping Elements
- Horizontal layouts mirror
- Arrow icons rotate 180deg
- Progress indicators flip direction

### Non-Flipping
- Logo orientation
- Video content
- Numbers (keep LTR with `unicode-bidi: isolate`)

---

## 8. PERFORMANCE BUDGETS

| Metric | Target | Max |
|--------|--------|-----|
| First Contentful Paint | < 1.5s | 2.5s |
| Largest Contentful Paint | < 2.5s | 4.0s |
| Cumulative Layout Shift | < 0.1 | 0.25 |
| Total Page Weight | < 500KB | 1MB |
| JavaScript Bundle | < 50KB | 100KB |

---

## 9. ACCESSIBILITY (WCAG 2.1 AA)

- Skip link to main content
- Semantic HTML structure (header, main, footer, section, article)
- 4.5:1 contrast ratio for text
- Keyboard navigation for all interactive elements
- ARIA labels for icons and complex components
- Focus visible states (3px outline, 2px offset)
- Video captions (English + Arabic VTT files)

---

## 10. IMPLEMENTATION PHASES

### Phase 1: Foundation (Days 1-2)
- [ ] Project setup (Astro + Tailwind + TypeScript)
- [ ] Design tokens and typography system
- [ ] Base layout with RTL support
- [ ] Font loading strategy

### Phase 2: Core Components (Days 3-4)
- [ ] Navigation (desktop + mobile)
- [ ] Hero section with video
- [ ] Common components (Button, Card, Container)

### Phase 3: Content Sections (Days 5-7)
- [ ] Problem, Solution, How It Works
- [ ] Benefits grid
- [ ] Use Cases, Security sections

### Phase 4: Interactive Sections (Days 8-9)
- [ ] Comparison table
- [ ] Vision 2030, Pricing
- [ ] FAQ accordion

### Phase 5: Forms & Footer (Day 10)
- [ ] Contact form with validation
- [ ] CTA section
- [ ] Footer

### Phase 6: Animations (Days 11-12)
- [ ] GSAP scroll animations
- [ ] Page load sequence
- [ ] Micro-interactions
- [ ] Reduced motion support

### Phase 7: Testing & Optimization (Days 13-14)
- [ ] Video optimization
- [ ] Performance audit
- [ ] Accessibility audit
- [ ] Cross-browser + RTL testing

---

## 11. CRITICAL FILES TO CREATE

1. `astro.config.mjs` - Astro configuration with React integration
2. `tailwind.config.mjs` - Custom colors, typography, RTL support
3. `src/styles/global.css` - Tailwind imports + base styles
4. `src/styles/fonts.css` - Font-face declarations
5. `src/layouts/BaseLayout.astro` - HTML structure with i18n
6. `src/components/sections/Hero.astro` - Hero with video
7. `src/i18n/locales/en.json` + `ar.json` - Translations

---

## DESIGN ANTI-PATTERNS TO AVOID

1. Generic "AI glow" effects (neon lines, matrix patterns)
2. Purple gradients on white backgrounds
3. Inter, Roboto, or Space Grotesk fonts
4. Stock healthcare imagery (stethoscopes, generic doctors)
5. Cookie-cutter SaaS layouts
6. Cramped layouts with no breathing room

---

---

## 12. HOSTINGER DEPLOYMENT

### Build Output
Astro builds to static HTML/CSS/JS in `dist/` folder.

### Deployment Steps
1. Run `npm run build` to generate static files
2. Upload contents of `dist/` folder to Hostinger's `public_html`
3. Configure domain routing if needed

### Contact Form Options for Hostinger
1. **Formspree (Recommended)**: Free tier, no backend needed
   - Sign up at formspree.io
   - Get form endpoint, use in contact form action

2. **PHP mail()**: Since Hostinger supports PHP
   - Create `contact.php` endpoint
   - Form submits to PHP, which sends email to andexa.tech

3. **Hostinger's email forwarding**: Use built-in email with form handler

### SSL/HTTPS
- Enable SSL in Hostinger dashboard for andexa.tech
- Redirect HTTP to HTTPS

---

*Plan Version: 1.0*
*Created: December 9, 2025*
*Hosting: Hostinger | Domain: andexa.tech*
