---
name: SkillSync
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#464555'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#1e00a9'
  on-primary: '#ffffff'
  primary-container: '#3525cd'
  on-primary-container: '#b1afff'
  inverse-primary: '#c3c0ff'
  secondary: '#006e2d'
  on-secondary: '#ffffff'
  secondary-container: '#97f4a3'
  on-secondary-container: '#0a7231'
  tertiary: '#002b7b'
  on-tertiary: '#ffffff'
  tertiary-container: '#003fac'
  on-tertiary-container: '#9eb5ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#9af7a5'
  secondary-fixed-dim: '#7eda8c'
  on-secondary-fixed: '#002109'
  on-secondary-fixed-variant: '#005320'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b4c5ff'
  on-tertiary-fixed: '#00174b'
  on-tertiary-fixed-variant: '#003ea8'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
  promo-orange: '#ff9800'
  star-rating: '#FFC107'
  outline-subtle: '#c7c4d8'
  verified-blue: '#3525cd'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-margin: 1rem
  card-padding: 1.25rem
  gutter: 0.75rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 1.5rem
---

## Brand & Style
SkillSync is a high-trust, professional gig marketplace that balances efficiency with approachability. The brand personality is **Corporate Modern** with a focus on accessibility and clarity. It avoids the coldness of traditional enterprise software by using soft surface transitions, friendly iconography, and vibrant accent colors (Indigo and Emerald). The UI should evoke a sense of reliability and community, targeting both independent professionals and clients looking for quality talent.

The design movement is a hybrid of **Material 3 (M3)** and **Modern Saas**, characterized by tonal layering, subtle elevation, and highly legible typography. It uses a light, airy aesthetic that prioritizes content and worker profiles over heavy decorative elements.

## Colors
The color palette is built on a "Fidelity" logic where the primary indigo (`#3525cd`) drives the core interaction model. 
- **Primary:** Used for high-emphasis actions, active states, and brand identifiers like "verified" badges.
- **Secondary:** A rich emerald green used specifically for status indicators (Active Gigs) and growth-oriented metrics.
- **Promotional:** A vibrant orange (`#ff9800`) is reserved for high-conversion calls to action within banners to break the monochromatic indigo flow.
- **Surfaces:** Uses a multi-tiered neutral system. The base background is nearly white (`#f8f9fa`), while containers use a subtle grey-blue (`#edeeef`) to create structural distinction without relying on heavy borders.

## Typography
We use **Inter** exclusively for its utilitarian and neutral qualities, ensuring the focus remains on the marketplace data. 
- **Hierarchy:** Established through weight rather than dramatic size changes. 
- **Headlines:** Use `semi-bold` (600) or `bold` (700) with slight negative letter-spacing to appear tighter and more professional.
- **Labels:** Small labels use `medium` weight (500) or `semi-bold` (600) to ensure legibility at small scales (11px-12px), especially inside chips and buttons.
- **Context:** The "Title LG" (18px) is the standard for card titles and section headers on mobile to maximize screen real estate.

## Layout & Spacing
The system utilizes a **Fluid Grid** approach with safe horizontal margins of 16px (`container-margin`). 
- **Vertical Rhythm:** A modular scale based on 8px is used. `stack-sm` (8px) for related elements, `stack-md` (16px) for standard grouping, and `stack-lg` (24px) for major section spacing.
- **Horizontal Scrolling:** Sections like "Categories" and "Recommended Talent" utilize a "peek" behavior where content extends beyond the container margin to signal scrollability.
- **Cards:** Use a consistent `card-padding` of 20px (`1.25rem`) to maintain internal breathing room.

## Elevation & Depth
Depth is expressed through **Tonal Layering** and **Ambient Shadows**:
- **Level 0 (Base):** Background color `#f8f9fa`.
- **Level 1 (Subtle):** Surface-container colors for search bars and secondary buttons. These are flat with no shadows.
- **Level 2 (Standard Cards):** White surfaces with a very soft, diffused shadow (`shadow-sm`) and a 10% opacity outline (`#c7c4d8`).
- **Level 3 (Floating/Interactive):** Active cards and the Floating Action Button (FAB). These use a deep, tinted shadow (`shadow-xl`) with the primary color as the shadow cast (e.g., `shadow-primary/30`) to create a "glow" effect that lifts the element.
- **Navigation:** The bottom bar and sticky header use backdrop blurs (`backdrop-blur-md`) when scrolled to maintain context of the content passing underneath.

## Shapes
The shape language is **Rounded**, using varied radii to imply hierarchy and "containment":
- **Buttons & Chips:** Full pill-shaped (`rounded-full`) for high-action items like categories and primary CTAs.
- **Standard Cards:** 16px (`rounded-2xl`) for a soft but structured look.
- **Main Banners:** 20px for a more "organic" feel in promotional areas.
- **Small Assets:** 8px (`rounded-lg`) for profile images within cards to keep them distinct from the card container's curve.

## Components
- **Buttons:** Primary buttons are pill-shaped or heavily rounded (12px) with solid backgrounds. The "Post a Job" FAB is the signature element, combining a large shadow with a bold primary fill.
- **Chips:** Used for categories and tags. Active states use the solid primary color, while inactive states use `surface-container` with a subtle outline.
- **Input Fields:** Search bars are pill-shaped, using a `surface-container` background rather than a border, featuring a persistent leading icon.
- **Cards:** Talent cards are vertically oriented with a top-aligned profile image. They must include a rating badge (star icon in `#FFC107`) and a primary action button at the bottom.
- **Navigation:** The bottom navigation uses a "selected state" indicator consisting of a rounded-xl container around the active icon/label pair, using the `primary-container` color.
- **Badges:** Small "Verified" icons and "AD" tags use high-contrast fills to stand out against imagery.