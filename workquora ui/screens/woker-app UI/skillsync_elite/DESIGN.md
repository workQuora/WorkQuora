---
name: SkillSync Elite
colors:
  surface: '#fafaf5'
  surface-dim: '#dadad6'
  surface-bright: '#fafaf5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4ef'
  surface-container: '#eeeee9'
  surface-container-high: '#e8e8e4'
  surface-container-highest: '#e2e3de'
  on-surface: '#1a1c19'
  on-surface-variant: '#424841'
  inverse-surface: '#2f312e'
  inverse-on-surface: '#f1f1ec'
  outline: '#727970'
  outline-variant: '#c2c8bf'
  surface-tint: '#446648'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#002109'
  on-primary-container: '#698d6b'
  inverse-primary: '#aad0ab'
  secondary: '#5c5f60'
  on-secondary: '#ffffff'
  secondary-container: '#e1e3e3'
  on-secondary-container: '#626566'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#310f21'
  on-tertiary-container: '#a7768b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c5edc6'
  primary-fixed-dim: '#aad0ab'
  on-primary-fixed: '#002109'
  on-primary-fixed-variant: '#2d4e31'
  secondary-fixed: '#e1e3e3'
  secondary-fixed-dim: '#c5c7c8'
  on-secondary-fixed: '#191c1d'
  on-secondary-fixed-variant: '#454748'
  tertiary-fixed: '#ffd8e7'
  tertiary-fixed-dim: '#efb7ce'
  on-tertiary-fixed: '#310f21'
  on-tertiary-fixed-variant: '#633a4d'
  background: '#fafaf5'
  on-background: '#1a1c19'
  surface-variant: '#e2e3de'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style
The design system is engineered for a high-end professional marketplace where trust, efficiency, and premium craftsmanship intersect. The brand personality is authoritative yet accessible, evoking the feeling of a bespoke concierge service for skilled labor and professional consultation.

The aesthetic follows a **Corporate / Modern** movement with a heavy emphasis on **Minimalism**. By utilizing high-contrast typography against expansive white space, the UI directs focus toward human talent and data-driven insights. Visual clarity is prioritized to reduce cognitive load for users navigating complex service agreements and skill matching.

## Colors
The palette is anchored by **Deep Forest Green**, a color that communicates stability, growth, and traditional professionalism. This is contrasted with **Metallic Grey** to introduce a modern, industrial precision to the interface.

- **Primary:** Used for high-emphasis actions, navigation headers, and brand-critical iconography.
- **Secondary:** Applied to auxiliary information, borders, and inactive states to maintain a sophisticated, low-noise environment.
- **Surface:** A pure white base ensures maximum legibility and a "gallery" feel for user profiles and service listings.
- **Functional:** Success and error states use desaturated versions of their respective hues to align with the professional tone of the design system.

## Typography
This design system utilizes **Inter** exclusively to leverage its systematic, utilitarian nature. The typeface is treated with tight tracking for headlines to create a dense, premium "editorial" feel. 

For body text, line heights are generous (1.5x+) to ensure readability in data-heavy contexts. Labels use a slightly heavier weight and increased tracking to distinguish interactive elements from static content. In mobile views, large headlines scale down aggressively to maintain layout integrity without sacrificing the bold brand presence.

## Layout & Spacing
The layout relies on a **Fixed Grid** on desktop (12 columns) and a **Fluid Grid** on mobile (4 columns). A 4px baseline grid ensures vertical rhythm across all components.

- **Desktop:** 1280px max-width container centered with 24px gutters.
- **Tablet:** 8-column grid with 24px margins.
- **Mobile:** 4-column grid with 16px margins. 

Padding within cards and containers should be generous (typically `xl` or `lg` tokens) to support the high-end minimalist aesthetic. Sections are separated by significant vertical whitespace to define clear content boundaries.

## Elevation & Depth
Depth is communicated through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows. This maintains the clean, "flat-plus" professional look.

- **Level 0 (Base):** #FFFFFF surface.
- **Level 1 (Cards):** A subtle 1px border (#E5E7EB) with no shadow, or an extremely diffused ambient shadow (4% opacity) when the card is interactive.
- **Level 2 (Dropdowns/Modals):** A crisp 1px border combined with a medium-soft shadow to indicate clear separation from the background.

Background blurs (12px-20px) are used sparingly for sticky navigation headers to maintain context while scrolling.

## Shapes
A consistent **12px (0.75rem)** corner radius is applied to all primary UI containers and input fields. This specific value is chosen to bridge the gap between "technical" and "approachable," providing a premium, modern feel that avoids the harshness of sharp corners or the playfulness of full rounds.

- **Buttons & Inputs:** 12px (Token: `rounded-md`)
- **Cards & Large Containers:** 16px (Token: `rounded-lg`)
- **Status Chips:** 100px (Pill-shaped) to distinguish them from interactive buttons.

## Components
- **Buttons:** Primary buttons use the Deep Forest Green (#002109) with white text. Secondary buttons use a Metallic Grey (#8F9192) outline with a 1px weight.
- **Input Fields:** 12px rounded corners with a subtle 1px border. Focus states transition the border to Deep Forest Green with a soft 2px outer glow.
- **Cards:** White backgrounds, 16px rounded corners, and a 1px light grey border. Padding is set to 24px internally.
- **Chips:** Used for skills and categories. These use a light tint of the primary color (background) with dark green text to ensure high legibility without the visual weight of a button.
- **Lists:** Data rows are separated by thin 1px dividers. Hover states for list items use a subtle off-white (#F8F9FA) background shift.
- **Badges:** Small, high-contrast indicators for "Verified" or "Elite" status, often utilizing a small metallic icon or a subtle gold accent where appropriate for "SkillSync" tiering.