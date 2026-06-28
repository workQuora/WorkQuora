---
name: Fluid Marketplace System
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
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006e2d'
  on-secondary: '#ffffff'
  secondary-container: '#7cf994'
  on-secondary-container: '#007230'
  tertiary: '#003fac'
  on-tertiary: '#ffffff'
  tertiary-container: '#0555dd'
  on-tertiary-container: '#d1daff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#7ffc97'
  secondary-fixed-dim: '#62df7d'
  on-secondary-fixed: '#002109'
  on-secondary-fixed-variant: '#005320'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b4c5ff'
  on-tertiary-fixed: '#00174b'
  on-tertiary-fixed-variant: '#003ea8'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
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
  headline-md-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-margin: 1rem
  gutter: 0.75rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 1.5rem
  card-padding: 1.25rem
---

## Brand & Style

The design system is engineered for a high-trust, mobile-first service marketplace. It centers on a **Modern Corporate** aesthetic blended with **Soft Minimalism**, prioritizing clarity, ease of navigation, and a sense of reliability.

The visual DNA is defined by "The Soft Container" philosophy: every piece of information resides within a clearly defined, highly rounded surface that feels tactile and safe. The UI evokes a professional yet approachable emotional response, balancing the needs of both service seekers (Clients) and service providers (Workers) through distinct but harmonious visual cues. High whitespace ratios and consistent radius logic prevent the density of a marketplace from feeling overwhelming.

## Colors

The palette utilizes functional color-coding to differentiate user roles and system statuses within the marketplace:

- **Client Primary (Indigo):** Used for seeker-side actions, primary navigation, and "Hire" flows.
- **Worker Primary (Green):** Used for provider-side actions, availability toggles, and "Earnings" flows.
- **Verification Blue:** A specific tertiary blue (#2563EB) reserved exclusively for KYC badges and trust markers.
- **Neutral Surface:** A light grey (#F9FAFB) is used to create subtle contrast against the white base background, helping define card boundaries without heavy borders.

**Dark Mode Strategy:**
In dark mode, the background shifts to `#121212` with elevated surfaces using `#1E1E1E`. Accent colors (Indigo/Green) maintain their hex values but are applied to smaller surface areas to ensure WCAG accessibility against dark backgrounds.

## Typography

This design system utilizes **Inter** for all roles to ensure maximum legibility and a systematic, utilitarian feel. 

- **Weight Hierarchy:** Headlines use SemiBold (600) and Bold (700) to create a clear scan pattern. Body text remains at Regular (400) for long-form descriptions. 
- **Scale:** On mobile, large display titles are slightly reduced to prevent awkward line breaks in narrow containers.
- **Utility:** Labels (captions and overlines) use a slightly tighter tracking and a medium-to-semibold weight to remain legible at very small sizes (11px-12px) for metadata like timestamps or distance.

## Layout & Spacing

This is a **fluid grid** system optimized for mobile-first delivery. 

- **Mobile (Base):** 4-column grid with 16px (1rem) side margins and 12px (0.75rem) gutters.
- **Desktop:** The content scales to a max-width of 1200px, transitioning to a 12-column layout.
- **Vertical Rhythm:** A strict 4px/8px baseline grid is used. Elements are stacked using "stack-md" (16px) for standard separation and "stack-lg" (24px) for distinct section breaks.
- **Horizontal Swiping:** Horizontal lists (banners, category chips) ignore the standard container margins, allowing content to bleed to the edge of the viewport to signal scrollability.

## Elevation & Depth

Depth in this design system is created through **Ambient Shadows** and **Tonal Layers** rather than borders.

1.  **Level 0 (Background):** `#FFFFFF` (Light) or `#121212` (Dark).
2.  **Level 1 (Cards/Surfaces):** Soft shadows with a large blur radius (Y: 4px, Blur: 20px) and very low opacity (4-6% Black). This makes cards feel like they are floating just above the surface.
3.  **Active/Pressed State:** When a card is tapped, it performs a subtle scale-down (98%) and the shadow depth decreases to simulate physical contact.
4.  **Overlays:** Modals and bottom sheets use a high-opacity backdrop blur (20px) to maintain context while focusing user attention.

## Shapes

The shape language is defined by significant roundedness to evoke a friendly, modern app experience.

- **Standard Cards:** 16px - 20px corner radius.
- **Input Fields:** 12px radius for a balanced, modern look.
- **Pills/Chips:** Fully rounded (999px) for category selection and status badges.
- **Icons:** Enclosed in rounded-square or circular containers to maintain the "Soft Container" theme.

## Components

### Buttons & Interaction
- **Primary Buttons:** High-contrast Indigo or Green, 12px radius, centered bold labels.
- **Location & Wallet Pills:** Small, capsule-shaped buttons with light tinted backgrounds (e.g., 10% Indigo tint) and darker text/icons.

### Cards & Banners
- **Marketplace Cards:** White backgrounds, 16px radius, subtle shadow. Elements within (text, price, rating) follow a clear vertical hierarchy.
- **Stat Cards:** 3-column layout within a single container, separated by subtle vertical dividers or whitespace.
- **Swipeable Banners:** 20px radius, full-bleed horizontal containers using high-quality imagery or vibrant gradients behind text.

### Form Elements
- **Search Bar:** Large, 12px or 24px radius (pill-style preferred), containing a leading search icon and a trailing filter icon.
- **Selection:** Checkboxes and radios follow the primary brand color of the respective user role (Indigo for Clients, Green for Workers).

### Trust Markers
- **KYC Badge:** A small blue checkmark inside a circular or pill-shaped container, always paired with "Verified" text in `label-sm`.