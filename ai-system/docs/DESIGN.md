# DESIGN.md ÔÇö Homewolves Design System & Page Directives
> **AI Instruction:** This file is the single source of truth for all visual and interaction design decisions on the Homewolves platform. Read this file in full before generating any UI component, screen, layout, or design asset. Do not deviate from the tokens, patterns, or directives defined here. Where a design decision is not explicitly stated, infer the closest match from the established system rather than introducing new patterns.

---

## 0. Design Philosophy

Homewolves is the African real estate operating system. Its design must communicate **trust, luxury, and clarity** while being deeply functional for agents, developers, and buyers operating in a mobile-first, high-growth market.

### Core Principles
1. **Glassmorphism + Bento** ÔÇö Frosted glass surfaces organise information into clean, scannable bento-grid cells. Never flat cards, never harsh borders.
2. **Metadata-driven rendering** ÔÇö Every UI component receives its content from config/API. No hardcoded labels, copy, or layout beyond structural fallbacks.
3. **Mobile-first, then expand** ÔÇö Design for 375px wide first. Desktop layouts emerge from the same component tree via responsive tokens.
4. **Luxury restraint** ÔÇö Inspired by JamesEdition: large hero imagery, generous whitespace, minimal chrome, confident typography. The property is always the hero.
5. **Performance as UX** ÔÇö No layout shift. Skeleton loaders on every async surface. Images lazy-loaded with dominant colour placeholders.
6. **Accessible by default** ÔÇö WCAG AA contrast on all text. Focus rings. ARIA roles on interactive elements.

---

## 1. Design Inspiration Reference

### JamesEdition Pattern Language (extracted from study)
- **Full-bleed hero images** with a thin frosted metadata strip pinned to the bottom
- **Minimal top navigation**: logo left, compact search centre, auth/account right
- **Card layouts**: large aspect-ratio imagery (16:9 or 4:3) with price, location, and type as the only visible metadata ÔÇö detail on hover/tap
- **Map-integrated browsing**: map fills 50% of the viewport on listing pages with cards in a scrollable side panel
- **Clean filter bar**: horizontally scrollable pill filters, no dropdowns on mobile
- **Monochrome base palette** with a single warm accent for CTAs
- **Editorial spacing**: 24ÔÇô40px gutters, generous line-height, section breathing room
- **Micro-animations**: subtle fade-in on scroll, smooth card lift on hover (transform + shadow), slide-in overlays

### Homewolves Differentiators
- **Bento grid dashboard** for agents/admins ÔÇö inspired by modern SaaS dashboards (Linear, Vercel) layered onto the JamesEdition aesthetic
- **Glassmorphism surfaces** for modals, sidebars, and floating controls rather than solid panels
- **African colour warmth** ÔÇö the accent system introduces warm amber/terracotta alongside the cool neutral base
- **WhatsApp-native integration cues** ÔÇö familiar chat-bubble shapes in the messaging module to reduce cognitive load

---

## 2. Design Tokens

> All tokens are exported as CSS custom properties. Tailwind config, React Native StyleSheet, and any other styling layer must consume these tokens ÔÇö never raw hex values.

### 2.1 Colour System

#### Base Palette (Light Theme)
```css
:root {
  /* Surfaces */
  --color-bg-base:          #F7F6F3;   /* Warm off-white ÔÇö primary background */
  --color-bg-elevated:      #FFFFFF;   /* Pure white ÔÇö cards, modals */
  --color-bg-glass:         rgba(255, 255, 255, 0.55); /* Glassmorphism surface */
  --color-bg-glass-dark:    rgba(15, 15, 20, 0.60);    /* Dark glass overlay */
  --color-bg-overlay:       rgba(0, 0, 0, 0.40);       /* Image overlays */

  /* Brand */
  --color-brand-primary:    #1A3A5C;   /* Deep navy ÔÇö headers, primary actions */
  --color-brand-secondary:  #2D6A9F;   /* Mid blue ÔÇö secondary buttons, links */
  --color-brand-accent:     #C8813A;   /* Warm amber ÔÇö CTAs, highlights, badges */
  --color-brand-accent-alt: #E8956A;   /* Terracotta ÔÇö hover states, tags */

  /* Text */
  --color-text-primary:     #0F1117;   /* Near-black */
  --color-text-secondary:   #4A5568;   /* Dark grey */
  --color-text-muted:       #8A9BB0;   /* Muted blue-grey */
  --color-text-inverse:     #FFFFFF;   /* On dark surfaces */
  --color-text-accent:      #C8813A;   /* Amber ÔÇö prices, commissions */

  /* Borders */
  --color-border-subtle:    rgba(0, 0, 0, 0.06);
  --color-border-default:   rgba(0, 0, 0, 0.12);
  --color-border-strong:    rgba(0, 0, 0, 0.24);
  --color-border-brand:     #2D6A9F;
  --color-border-glass:     rgba(255, 255, 255, 0.30);

  /* Status */
  --color-success:          #1A7A4A;
  --color-success-bg:       #E8F7EE;
  --color-warning:          #B45309;
  --color-warning-bg:       #FEF3C7;
  --color-error:            #B91C1C;
  --color-error-bg:         #FEE2E2;
  --color-info:             #1D4ED8;
  --color-info-bg:          #DBEAFE;

  /* Transaction status colours */
  --color-status-pending:   #D97706;
  --color-status-active:    #059669;
  --color-status-complete:  #1A3A5C;
  --color-status-rejected:  #DC2626;
}
```

#### Dark Theme
```css
[data-theme="dark"] {
  --color-bg-base:          #0D1117;
  --color-bg-elevated:      #161B22;
  --color-bg-glass:         rgba(22, 27, 34, 0.72);
  --color-bg-glass-dark:    rgba(0, 0, 0, 0.75);
  --color-bg-overlay:       rgba(0, 0, 0, 0.60);

  --color-brand-primary:    #3B82F6;   /* Lighter blue for dark bg */
  --color-brand-secondary:  #60A5FA;
  --color-brand-accent:     #F59E0B;   /* Amber stays warm */
  --color-brand-accent-alt: #FB923C;

  --color-text-primary:     #F0F4F8;
  --color-text-secondary:   #9BAEC8;
  --color-text-muted:       #5C6E82;
  --color-text-inverse:     #0D1117;
  --color-text-accent:      #F59E0B;

  --color-border-subtle:    rgba(255, 255, 255, 0.05);
  --color-border-default:   rgba(255, 255, 255, 0.10);
  --color-border-strong:    rgba(255, 255, 255, 0.20);
  --color-border-glass:     rgba(255, 255, 255, 0.12);
}
```

#### High Contrast Theme (Accessibility)
```css
[data-theme="high-contrast"] {
  --color-bg-base:          #000000;
  --color-bg-elevated:      #1A1A1A;
  --color-bg-glass:         rgba(26, 26, 26, 0.95);
  --color-text-primary:     #FFFFFF;
  --color-text-secondary:   #E0E0E0;
  --color-brand-accent:     #FFD700;
  --color-border-default:   #FFFFFF;
}
```

---

### 2.2 Typography

**Font Stack:**
- Display/Headings: `"DM Serif Display", Georgia, serif` ÔÇö editorial luxury feel
- Body/UI: `"Inter", -apple-system, BlinkMacSystemFont, sans-serif` ÔÇö clean, legible
- Monospace (data, prices): `"JetBrains Mono", "Fira Code", monospace`

```css
:root {
  /* Scale ÔÇö fluid between mobile and desktop */
  --text-xs:    clamp(0.70rem, 1.5vw, 0.75rem);
  --text-sm:    clamp(0.80rem, 1.8vw, 0.875rem);
  --text-base:  clamp(0.875rem, 2vw, 1rem);
  --text-md:    clamp(1rem, 2.2vw, 1.125rem);
  --text-lg:    clamp(1.125rem, 2.5vw, 1.25rem);
  --text-xl:    clamp(1.25rem, 3vw, 1.5rem);
  --text-2xl:   clamp(1.5rem, 4vw, 2rem);
  --text-3xl:   clamp(1.875rem, 5vw, 2.5rem);
  --text-4xl:   clamp(2.25rem, 6vw, 3.5rem);
  --text-hero:  clamp(2.5rem, 8vw, 5rem);

  /* Weight */
  --font-regular: 400;
  --font-medium:  500;
  --font-semibold: 600;
  --font-bold:    700;
  --font-black:   900;

  /* Line height */
  --leading-tight:  1.2;
  --leading-snug:   1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;

  /* Letter spacing */
  --tracking-tight:  -0.025em;
  --tracking-normal: 0;
  --tracking-wide:   0.05em;
  --tracking-wider:  0.1em;
  --tracking-widest: 0.2em;  /* Used for ALL-CAPS labels */
}
```

**Usage Rules:**
- Property prices: `DM Serif Display, --text-xl, --font-bold, --color-text-accent`
- Section headings: `DM Serif Display, --text-3xl+, --font-bold, --color-text-primary`
- UI labels (ALL-CAPS): `Inter, --text-xs, --font-semibold, --tracking-widest`
- Body copy: `Inter, --text-base, --font-regular, --leading-relaxed`
- Badge/pill text: `Inter, --text-xs, --font-semibold`

---

### 2.3 Spacing Scale

```css
:root {
  --space-1:   4px;
  --space-2:   8px;
  --space-3:   12px;
  --space-4:   16px;
  --space-5:   20px;
  --space-6:   24px;
  --space-8:   32px;
  --space-10:  40px;
  --space-12:  48px;
  --space-16:  64px;
  --space-20:  80px;
  --space-24:  96px;
  --space-32:  128px;
}
```

---

### 2.4 Elevation & Glass Effects

```css
:root {
  /* Glassmorphism recipe */
  --glass-blur:         blur(16px) saturate(180%);
  --glass-blur-heavy:   blur(24px) saturate(200%);
  --glass-blur-subtle:  blur(8px) saturate(150%);

  /* Shadows */
  --shadow-xs:   0 1px 2px rgba(0,0,0,0.05);
  --shadow-sm:   0 2px 8px rgba(0,0,0,0.08);
  --shadow-md:   0 4px 20px rgba(0,0,0,0.10);
  --shadow-lg:   0 8px 40px rgba(0,0,0,0.14);
  --shadow-xl:   0 16px 64px rgba(0,0,0,0.18);
  --shadow-card: 0 2px 12px rgba(26,58,92,0.08), 0 0 0 1px rgba(26,58,92,0.04);
  --shadow-hover: 0 8px 32px rgba(26,58,92,0.16), 0 0 0 1px rgba(26,58,92,0.08);
  --shadow-glass: 0 4px 24px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.3);
}
```

**Glass Surface Recipe:**
```css
.glass-surface {
  background: var(--color-bg-glass);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--color-border-glass);
  box-shadow: var(--shadow-glass);
}
```

---

### 2.5 Border Radius

```css
:root {
  --radius-xs:   4px;
  --radius-sm:   8px;
  --radius-md:   12px;
  --radius-lg:   16px;
  --radius-xl:   24px;
  --radius-2xl:  32px;
  --radius-full: 9999px;   /* Pills, avatars */
}
```

---

### 2.6 Motion & Animation

```css
:root {
  /* Duration */
  --duration-instant: 60ms;
  --duration-fast:    150ms;
  --duration-normal:  250ms;
  --duration-slow:    400ms;
  --duration-lazy:    600ms;

  /* Easing */
  --ease-default:     cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in:          cubic-bezier(0.4, 0, 1, 1);
  --ease-out:         cubic-bezier(0, 0, 0.2, 1);
  --ease-spring:      cubic-bezier(0.34, 1.56, 0.64, 1);  /* Slight overshoot */
  --ease-smooth:      cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

**Animation Directives:**
- Card hover: `transform: translateY(-4px) scale(1.01)` + `box-shadow` transition, `--duration-normal --ease-out`
- Page transitions: fade + slight translate (8px Y) `--duration-slow --ease-smooth`
- Modal entry: scale from 0.96 + fade, `--duration-normal --ease-spring`
- Skeleton shimmer: linear gradient sweep, 1.5s infinite
- Filter pill selection: background fill + scale 1.02, `--duration-fast`
- Respect `prefers-reduced-motion`: all animations collapse to instant opacity only

---

### 2.7 Breakpoints

```css
/* Mobile-first breakpoints */
:root {
  --bp-xs:   375px;   /* Small phone */
  --bp-sm:   480px;   /* Large phone */
  --bp-md:   768px;   /* Tablet portrait */
  --bp-lg:   1024px;  /* Tablet landscape / small laptop */
  --bp-xl:   1280px;  /* Desktop */
  --bp-2xl:  1536px;  /* Large desktop */
  --bp-3xl:  1920px;  /* Wide / ultrawide */
}
```

**Orientation directives:**
- `portrait`: single-column layouts, bottom tab navigation, large touch targets (min 44px)
- `landscape` (mobile): bottom nav collapses to side rail, map expands
- `landscape` (tablet/desktop): side navigation, multi-column bento grids

---

## 3. Component Library

### 3.0 Component Library Foundation ÔÇö shadcn/ui

**Primary component library: shadcn/ui** (Radix UI primitives + Tailwind). All base interactive primitives (Button, Dialog, Dropdown, Select, Tabs, Tooltip, Sheet, Popover, Form, Input, etc.) come from shadcn/ui. They are **never imported directly in page or feature files**. Instead, every shadcn primitive is wrapped once in a Homewolves-branded component inside `components/ui/` and **only that wrapper is ever used elsewhere in the codebase**.

#### Wrapper Pattern (mandatory)
```typescript
// Ô£à CORRECT ÔÇö import the Homewolves wrapper
import { HwButton } from '@/components/ui/HwButton';
import { HwDialog } from '@/components/ui/HwDialog';
import { HwInput } from '@/components/ui/HwInput';

// ÔØî WRONG ÔÇö never import shadcn primitives directly in feature code
import { Button } from '@/components/ui/button';       // forbidden outside ui/
import { Dialog } from '@/components/ui/dialog';       // forbidden outside ui/
```

#### Why
- Design token changes (colours, radius, spacing) propagate from one wrapper file, not across 50 import sites.
- Metadata-driven props (config-sourced labels, variants, icons) are injected at the wrapper level.
- shadcn primitives are an implementation detail, not a public API of the codebase.

#### Wrapper Naming Convention
All Homewolves wrappers are prefixed `Hw`: `HwButton`, `HwInput`, `HwDialog`, `HwSelect`, `HwTabs`, `HwSheet`, `HwBadge`, `HwCard`, `HwDropdown`, `HwTooltip`, `HwPopover`, `HwForm`, `HwTable`, `HwAvatar`, `HwSkeleton`, etc.

Each wrapper:
1. Imports the shadcn primitive
2. Applies Homewolves design tokens via `className` composition using the `cn()` utility
3. Accepts a `config?: ComponentConfig` prop for admin-injected overrides
4. Falls back to `FALLBACK_*` constants when config is absent
5. Is fully typed with its own `Hw*Props` interface ÔÇö globally available via TypeScript path alias (see ROADMAP.md ┬º16)
6. Is exported from `components/ui/index.ts` barrel ÔÇö the only import path used in feature code

#### shadcn/ui Theming Integration
Configure `components.json` to use CSS variables (not hardcoded Tailwind colours). Map shadcn CSS variable names to Homewolves design tokens in `globals.css`:

```css
:root {
  --background:          var(--color-bg-base);
  --foreground:          var(--color-text-primary);
  --primary:             var(--color-brand-primary);
  --primary-foreground:  var(--color-text-inverse);
  --secondary:           var(--color-brand-secondary);
  --accent:              var(--color-brand-accent);
  --accent-foreground:   var(--color-text-inverse);
  --muted:               var(--color-bg-elevated);
  --muted-foreground:    var(--color-text-muted);
  --border:              var(--color-border-default);
  --ring:                var(--color-brand-secondary);
  --radius:              var(--radius-md);
  --card:                var(--color-bg-elevated);
  --card-foreground:     var(--color-text-primary);
  --destructive:         var(--color-error);
}
/* [data-theme="dark"] token overrides cascade automatically ÔÇö no per-component dark mode needed */
```

---

### 3.1 Property Card

**Variants:** `default` | `compact` | `featured` | `map-popup` | `horizontal`

```
ÔöîÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÉ
Ôöé  [IMAGE 16:9]               Ôöé
Ôöé                    [ÔØñ] [Ôƒ¿]  Ôöé  ÔåÉ glass icon row, bottom-right
Ôöé                             Ôöé
Ôö£ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöñ  ÔåÉ glass strip pinned to image bottom
Ôöé  Ôéª45,000,000                Ôöé  ÔåÉ price: DM Serif, amber
Ôöé  3 Bed ┬À 2 Bath ┬À Lekki    Ôöé  ÔåÉ meta: Inter xs, muted
Ôöé  [SALE]  [VERIFIED Ô£ô]       Ôöé  ÔåÉ pills
Ôöé  [Agent Name]  [Chat ÔåÆ]     Ôöé  ÔåÉ agent micro-row
ÔööÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÿ
```

**Rules:**
- Image aspect ratio locked at 16:9 (default), 4:3 (featured), 1:1 (compact/grid)
- Price always `--color-text-accent` and `DM Serif Display`
- Verification badge: green check pill, only if `listing.verified === true`
- Commission badge: amber pill, visible only to authenticated agents
- Hover state: `--shadow-hover`, `translateY(-4px)`, image zoom `scale(1.03)` with `overflow: hidden`
- Skeleton: dominant colour placeholder for image, grey bars for text rows
- Max 3 pills visible ÔÇö overflow into `+N` pill

---

### 3.2 Navigation

**Top Navigation (Web Desktop)**
```
[HOMEWOLVES logo] [Search bar ÔÇö centre] [Post Property] [Notifications] [Avatar]
```
- Background: `--color-bg-glass` with `--glass-blur` ÔÇö transparent over hero, opaque on scroll
- Height: 64px desktop, 56px mobile
- Logo: wordmark + wolf silhouette icon, always white on dark hero, brand-primary elsewhere

**Bottom Tab Bar (Mobile)**
```
[­ƒÅá Explore] [­ƒöì Search] [´╝ï Post] [­ƒÆ¼ Chat] [­ƒæñ Profile]
```
- Glass surface, 80px height with safe area inset
- Active tab: amber underline + icon fill
- Post button: amber circle elevated above bar

**Side Navigation (Dashboard ÔÇö Tablet/Desktop)**
```
[Logo]
ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
[Dashboard]
[Listings]
[Clients]
[Transactions]
[Analytics]
[Messages]
ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
[Settings]
[Help]
[Avatar + name]
```
- Width: 64px collapsed (icons only), 240px expanded
- Glass surface with subtle left border
- Expand/collapse animated, state persisted in localStorage

---

### 3.3 Search & Filter Bar

**Layout (Mobile):** stacked ÔÇö search input + horizontally scrollable pill row below
**Layout (Desktop):** inline ÔÇö search left, pill filters centre, view-toggle right

**Filter Pills (admin-configurable set):**
`All` | `For Sale` | `Rent` | `Shortlet` | `Land` | `New Development` | `Furnished` | `Verified`

**Advanced Filter Panel:** glass slide-in from right (mobile) or dropdown popover (desktop)
- Price range: dual-thumb slider
- Location: type-ahead with geo clustering
- Bedrooms: tap-select buttons (1, 2, 3, 4, 5+)
- Property type: icon-button grid
- Sort: dropdown (Newest, Price Ôåæ, Price Ôåô, Most Viewed)

---

### 3.4 Bento Grid (Dashboard)

Bento grid cells are glass-surface cards arranged in a CSS Grid. Cell sizes are metadata-driven from config.

**Cell Size Classes:**
- `bento-1x1`: 1 column ├ù 1 row ÔÇö stat/KPI
- `bento-2x1`: 2 columns ├ù 1 row ÔÇö chart or list
- `bento-1x2`: 1 column ├ù 2 rows ÔÇö metric + sparkline
- `bento-2x2`: 2 columns ├ù 2 rows ÔÇö featured chart or map
- `bento-3x1`: 3 columns ├ù 1 row ÔÇö wide list or activity feed
- `bento-full`: full width ÔÇö header or alert banner

**Grid Config:** 4-column desktop, 2-column tablet, 1-column mobile. Cells reorder via `order` metadata prop.

---

### 3.5 Glass Modal / Drawer

- Entry: scale(0.96) + fade ÔåÆ scale(1) + opaque, `--duration-normal --ease-spring`
- Backdrop: `--color-bg-overlay` with blur
- Mobile: full-screen drawer from bottom (drag to dismiss)
- Desktop: centred modal, max-width 560px (small), 720px (medium), 960px (large)
- Close: `├ù` top-right + Escape key + backdrop tap

---

### 3.6 Form Elements

- Input: white bg, `--radius-md`, `--shadow-xs`, focus ring `--color-brand-secondary`
- Select: custom dropdown, no native arrow
- File upload: dashed border drop zone, glass inner surface
- OTP input: 6 large digit boxes, auto-focus progression
- All inputs: floating label pattern (label animates up on focus/fill)

---

### 3.7 Buttons

```
Primary:   amber bg (#C8813A), white text, --radius-full, --shadow-sm ÔåÆ --shadow-md on hover
Secondary: white/glass bg, navy border, navy text
Ghost:     transparent, navy text, underline on hover
Danger:    red bg, white text
Icon-only: circular, 40px min, glass surface
FAB:       amber circle, 56px, --shadow-xl, fixed bottom-right on mobile
```

---

### 3.8 Status Badges / Pills

```css
.badge { border-radius: var(--radius-full); padding: 2px 10px; font-size: var(--text-xs); font-weight: var(--font-semibold); }
.badge-sale       { background: #DBEAFE; color: #1D4ED8; }
.badge-rent       { background: #D1FAE5; color: #065F46; }
.badge-shortlet   { background: #FEF3C7; color: #92400E; }
.badge-land       { background: #F3E8FF; color: #6B21A8; }
.badge-verified   { background: #D1FAE5; color: #065F46; }
.badge-pending    { background: #FEF3C7; color: #92400E; }
.badge-complete   { background: #DBEAFE; color: #1D4ED8; }
.badge-rejected   { background: #FEE2E2; color: #991B1B; }
```

> **Runtime note (2026-10-21):** categories/status on real surfaces resolve through
> `lib/status.ts` (`chipToneStyle`, `tierBadgeStyle`) against themed tokens
> (`--color-*-bg` + `--color-*`) overridden per theme (light/dark/high-contrast);
> the hex values above are the light-theme floor, not hardcoded component classes.

---

### 3.9 Map Surfaces (HwMap — keyless, 2026-10-21)

```css
/* Pin: price-tag chip on elevated surface; fallback card: tokenized glass */
.hw-map-pin       { background: var(--color-bg-elevated); color: var(--color-text-primary);
                    border: 1.5px solid var(--color-brand-primary); border-radius: var(--radius-full); }
.hw-map-popup     { background: var(--color-bg-elevated); color: var(--color-text-primary);
                    border-radius: var(--radius-sm); box-shadow: var(--shadow-lg); }
.hw-map-fallback  { background: var(--color-bg-glass); border: 1px solid var(--color-border-default); }
```

- Contract: `components/map/hw-map.tsx` is the only map entry point; config via
  `map_config` PlatformConfig (`useMapConfig()`), gated by the `map_view` feature flag.
- Style step-down: vector (OpenFreeMap liberty) → keyless raster chain (CARTO light/dark,
  OSM) → token-styled `MapLocationFallback` card with an outbound OpenStreetMap link.
- Dark theme: the basemap uses the same light tiles in every theme
  (`darkCanvasFilter: 'none'` — light tiles verified clearer than tint/invert); popups and
  attribution chrome are tokenized in `globals.css`.
- New overlay tokens: `--color-accent-overlay` (translucent over accent surfaces),
  `--color-tag`/`--color-tag-bg`, `--color-focus-ring`.

---

## 4. Page-by-Page Design Directives

> Each section specifies layout, key components, data sources, skeleton states, and responsive behaviour. AI models implementing these pages MUST read the relevant component specs (Section 3) before rendering.

---

### 4.1 Landing / Home Page (`/`)

**Purpose:** Convert guest visitors. Hero ÔåÆ social proof ÔåÆ featured listings ÔåÆ how it works ÔåÆ CTA.

**Layout Zones:**
1. **Hero** ÔÇö Full-bleed image (admin-configurable background, fallback: gradient `#1A3A5C ÔåÆ #2D6A9F`). Search bar centred with animated placeholder cycling through location suggestions. Overlay text: headline + subheadline from CMS config.
2. **Stats Strip** ÔÇö Glass strip: `X Listings`, `Y Agents`, `Z Deals Closed` ÔÇö animated count-up on viewport entry.
3. **Category Bento** ÔÇö 6 property type tiles in a 3├ù2 grid: Sale, Rent, Shortlet, Land, New Development, Direct Brief. Icon + label. Admin-configurable icons and labels.
4. **Featured Listings** ÔÇö Horizontal scroll on mobile, 3-column grid on desktop. Sourced from `featured_listings` config/API endpoint.
5. **How It Works** ÔÇö 3-step illustrated flow (icon + heading + description). Steps are CMS-driven.
6. **Agent CTA** ÔÇö Split section: left = agent value prop, right = "List Your Property" button.
7. **Blog Highlights** ÔÇö Latest 3 posts from Blog module. Card with cover image + title + excerpt.
8. **Footer** ÔÇö Logo, nav links, social icons, subscription plan teaser, legal links.

**Responsive:**
- Mobile: single column, hero search full-width, category tiles 2├ù3, listings horizontal scroll
- Tablet: 2-column category tiles, 2-column listings grid
- Desktop: 3-column category bento, 3-column listings grid, stats strip horizontal

---

### 4.2 Property Listing Feed (`/properties`)

**Purpose:** Browse and filter all listings.

**Layout:** Left sidebar (filters, 280px, collapsible) + main content area OR map-split view toggle.

**Map Split View (JamesEdition-inspired):**
- Map: 50% viewport width, sticky, Mapbox GL or Leaflet, clusters for dense areas
- Card panel: 50% width, scrollable, card-as-row format
- Map pin: amber dot, selected pin expands to mini card popup (glass)

**List View:**
- Masonry or uniform grid toggle (icon button in filter bar)
- Default: 3-column desktop, 2-column tablet, 1-column mobile
- Card variant: `default` (grid), `horizontal` (list)

**Infinite scroll** with intersection observer. Skeleton cards on load.

**Filter persistence:** URL query params for all active filters (shareable links).

---

### 4.3 Property Detail Page (`/properties/:id`)

**Purpose:** Full property showcase ÔåÆ drive enquiry/inspection.

**Layout Zones:**
1. **Gallery** ÔÇö Full-bleed image carousel (swipe on mobile). Thumbnail strip. Fullscreen gallery mode.
2. **Sticky Action Bar** (mobile bottom, desktop right column)
   - Price (large, amber)
   - [Chat Agent] [Schedule Inspection] [Share] [Save]
3. **Property Meta** ÔÇö Bedrooms, bathrooms, size (sqm), type, status, listing date ÔÇö icon-row layout.
4. **Description** ÔÇö Collapsible long-form text from listing data. "Read more" after 4 lines.
5. **Features & Amenities** ÔÇö Icon grid: admin-configurable amenity icons from metadata.
6. **Location** ÔÇö Embedded map (reduced zoom, neighbourhood shown, not pin-precise until inspection confirmed).
7. **Agent Card** ÔÇö Glass card: avatar, name, rating stars, response time badge, [Chat] [Call] buttons.
8. **Similar Properties** ÔÇö Horizontal scroll of `PropertyCard compact` components.
9. **Recently Viewed** ÔÇö Horizontal scroll, same card variant.
10. **Transaction Status Bar** ÔÇö Visible only to authenticated buyer involved in transaction. Glass progress stepper.

**Verification Banner:** if `listing.verified`, amber banner at top: "Ô£ô Verified by Homewolves Team"

---

### 4.4 Agent Dashboard (`/dashboard/agent`)

**Purpose:** Central command for an agent's business.

**Bento Grid Layout (desktop 4-col):**
```
[Active Clients: 2├ù1] [Today's Inspections: 1├ù1] [Messages: 1├ù1]
[Listings Performance: 2├ù2 chart] [Recent Activity: 2├ù2 feed]
[Commission Tracker: 2├ù1] [Lead Funnel: 2├ù1]
[Quick Actions: 4├ù1 full-width row]
```

**Mobile:** single column, priority order matches above.

**Quick Actions Row:** [+ New Listing] [+ Schedule Inspection] [Share Referral Link] [View Analytics]

**CRM Tab:** data table ÔÇö client name, status, last activity, next action, assigned property. Sortable, filterable.

---

### 4.5 Client / Buyer Dashboard (`/dashboard/client`)

**Layout:** Tab-based navigation (Transactions | Wishlist | Recently Viewed | Documents | Notifications)

**Transactions Tab:** progress stepper per transaction, each step clickable for detail. Glass timeline.
**Wishlist Tab:** grid of saved `PropertyCard compact` components, removable.
**Recently Viewed:** horizontal scroll + full grid on expand, timestamped.
**Documents Tab:** file vault ÔÇö list of uploaded/received docs, type icon, date, download button.
**Notifications Tab:** grouped by date, unread dot on nav.

---

### 4.6 Transaction Workflow Page (`/transactions/:id`)

**Purpose:** Step-by-step transaction management for agents, buyers, and admins.

**Layout:** Left = progress stepper (vertical on desktop, horizontal scrollable on mobile). Right = step content area.

**Progress Stepper Steps:**
1. Inspection Scheduled
2. Inspection Completed
3. Documents Received
4. Due Diligence
5. Contract Signed
6. Payment Submitted
7. Admin Approval
8. Completed

Each step: icon + label + timestamp (if completed) + actor name.

**Content Area per step:** glass card with step-specific form/display. File upload zone where applicable.

**Audit Trail Panel:** collapsible glass panel showing full event log for this transaction. Time, actor, action, device.

---

### 4.7 Admin Panel (`/admin`)

**Purpose:** Moderation, approvals, analytics, configuration.

**Layout:** Side navigation (admin-specific links) + main area.

**Key Views:**
- **Overview:** Bento dashboard ÔÇö pending approvals count, flagged listings, active transactions, MAU, revenue.
- **Listings Queue:** data table with thumbnail, status badge, [Approve] [Reject] [Flag] actions.
- **Transactions Queue:** table with status, agent, client, property, last event.
- **Audit Log:** filterable, searchable table. Date range picker. Export button (CSV/PDF).
- **User Management:** table with role badge, verification status, [Verify] [Suspend] actions.
- **Config Panel:** metadata-driven form ÔÇö site settings, feature flags, subscription plan config, amenity icon mapping, notification templates.

---

### 4.8 Authentication Flow (`/auth`)

**Design:**
- Full-screen split: left = property hero image (random from featured pool, admin-configurable), right = auth form
- Mobile: form only, logo top
- Form area: glass card, centred
- Steps: Email entry ÔåÆ OTP verification ÔåÆ Profile completion (agent-specific: ID upload step)
- Social auth buttons: Google, Apple (rounded, outlined)
- Referral code field: auto-populated from URL param, visually highlighted if active

---

### 4.9 Messaging / Chat (`/messages`)

**Layout:** Two-pane (desktop) ÔÇö conversation list left, chat view right. Full-screen on mobile.

**Conversation List:** agent/client avatar + name + last message snippet + unread count badge + property thumbnail thumbnail.

**Chat View:**
- Header: property card mini (glass) pinned at top ÔÇö shows which property the chat is about
- Messages: right-aligned (self), left-aligned (other), subtle tail on glass bubbles
- WhatsApp-inspired layout (familiar for African users) but with brand glass styling
- File/document sharing: icon in input row, preview inline

---

### 4.10 Blog (`/blog`)

**Layout:** Magazine grid ÔÇö 1 hero post (full-width), 2 featured (half-width), then 3-column grid.
**Article page:** max-width 720px centred prose, large drop cap, pull quotes in amber, estimated read time.

---

## 5. Themes & Modes

### 5.1 Available Themes
| Theme ID | Name | Trigger |
|---|---|---|
| `light` | Light (default) | System/manual |
| `dark` | Dark | System/manual |
| `high-contrast` | High Contrast | Accessibility settings |

Theme preference: stored in `user_preferences` table (authenticated) or `localStorage` (guest). `prefers-color-scheme` media query as initial default.

### 5.2 Theme Switching
- Toggle in top nav (sun/moon icon) and in account settings.
- Transition: `color-scheme` CSS property + CSS variable swap. Add `transition: background-color 200ms, color 200ms` on `body` only.
- Dark mode images: use `picture` element with `-dark` variants for illustrations/logos only. Photography unchanged.

---

## 6. Responsive & Orientation Directives

### Mobile Portrait (primary)
- Single column throughout
- Bottom tab navigation
- Filter bar: search full-width, filter pills below in horizontal scroll
- FAB for primary CTA (Post Property)
- Cards: full-width, 16:9 image
- Bento: 1 column, stack order from metadata `mobile_order` property

### Mobile Landscape
- Map view: map fills left 60%, card strip at right
- Bottom nav collapses to mini icon rail on left
- Gallery: side-by-side thumbnails become visible

### Tablet Portrait
- 2-column card grids
- Side navigation appears (collapsed by default)
- Filter sidebar overlay (not inline)

### Tablet Landscape / Desktop
- 3ÔÇô4 column grids
- Side navigation expanded (240px)
- Map/list split enabled by default on listings page
- Bento full multi-column

### Large Desktop (1536px+)
- Max content width: 1440px, centred
- Bento: 4-column with `bento-full` cells spanning full width

---

## 7. Metadata-Driven UI Rules

> This is the principle that most separates Homewolves from generic apps. AI models implementing features MUST follow these patterns.

### 7.1 Config Object Pattern
Every configurable UI element has a corresponding config entry. Examples:

```typescript
// Amenity icons ÔÇö never hardcoded
interface AmenityConfig {
  id: string;
  label: string;          // Admin-editable
  icon: string;           // Icon name from icon library
  active: boolean;        // Toggle in admin panel
  display_order: number;
}

// Filter pills ÔÇö admin-configurable set
interface FilterPillConfig {
  id: string;
  label: string;
  query_param: string;
  icon?: string;
  active: boolean;
  display_order: number;
}

// Navigation items ÔÇö fully configurable
interface NavItemConfig {
  id: string;
  label: string;
  path: string;
  icon: string;
  roles: UserRole[];       // Which roles see this item
  active: boolean;
  display_order: number;
  badge?: string;          // Dynamic badge from API
}
```

### 7.2 Fallback Pattern
```typescript
// Always: config from API ÔåÆ fallback to hardcoded defaults
const amenities = apiConfig?.amenities ?? FALLBACK_AMENITIES;
const filterPills = apiConfig?.filterPills ?? FALLBACK_FILTER_PILLS;

// FALLBACK_* constants live in /config/fallbacks.ts
// They are never used in production unless API config is unavailable
```

### 7.3 Feature Flags
```typescript
interface FeatureFlag {
  id: string;             // e.g. "ai_chatbot", "e_signature", "map_view"
  enabled: boolean;
  rollout_percentage: number;   // 0ÔÇô100 for gradual rollout
  roles: UserRole[];            // Role-specific flags
}
```
UI components check `useFeatureFlag('flag_id')` before rendering. No conditional rendering by hardcoded role strings.

---

## 8. Icon System

- Library: **Lucide** (primary) + **Phosphor** (supplemental for real estate specifics)
- Size scale: 16px (inline), 20px (default UI), 24px (nav), 32px (feature icons), 48px (empty states)
- All icons accept `color` and `size` props ÔÇö never hardcode icon colours inline
- Custom icons (wolf logo, African map pin, etc.) as SVG components in `/assets/icons/`

---

## 9. Image & Media Guidelines

- **Aspect ratios:** 16:9 (listing card), 4:3 (featured), 1:1 (avatar, compact), 3:1 (hero strip)
- **Loading:** `loading="lazy"` on all images below the fold. Dominant colour placeholder via `blurDataURL` (Next.js) or CSS background-color during load.
- **CDN:** All images served via CDN with responsive `srcset`. Max widths: 400w, 800w, 1200w, 1600w.
- **Alt text:** mandatory, generated from `listing.title + listing.location` if not manually set.
- **Video:** property walkthrough videos as `<video>` with poster frame, not embedded YouTube/Vimeo (no external dependency).

---

## 10. Accessibility Checklist

- [ ] All interactive elements: min 44├ù44px touch target
- [ ] Focus visible: `outline: 2px solid var(--color-brand-secondary)` + `outline-offset: 2px`
- [ ] Colour contrast: text on all surfaces ÔëÑ 4.5:1 (AA). Prices on white ÔëÑ 3:1 (AA large)
- [ ] Images: descriptive alt text always present
- [ ] Forms: label associated with input (not placeholder-only)
- [ ] Status messages: `aria-live="polite"` regions for toast/alert updates
- [ ] Modals: focus trap, Escape to close, `aria-modal="true"`
- [ ] Navigation: skip-to-content link at top of page
- [ ] Keyboard: all interactions reachable and operable via keyboard

---

## 11. Open Design ÔåÆ Open Code Handoff

### 11.1 Where Design Outputs Live
All HTML exports from Open Design are stored in:
```
ai-system/designs/
Ôö£ÔöÇÔöÇ README.md                    ÔåÉ Index of all screens and their route mapping
Ôö£ÔöÇÔöÇ 01-landing-light.html
Ôö£ÔöÇÔöÇ 02-landing-dark.html
Ôö£ÔöÇÔöÇ 03-properties-feed.html
Ôö£ÔöÇÔöÇ 04-property-detail-light.html
Ôö£ÔöÇÔöÇ 05-property-detail-dark.html
Ôö£ÔöÇÔöÇ 06-agent-dashboard-light.html
Ôö£ÔöÇÔöÇ 07-agent-dashboard-dark.html
Ôö£ÔöÇÔöÇ 08-client-dashboard.html
Ôö£ÔöÇÔöÇ 09-transaction-workflow.html
Ôö£ÔöÇÔöÇ 10-auth-flow.html
Ôö£ÔöÇÔöÇ 11-messaging.html
ÔööÔöÇÔöÇ 12-admin-panel.html
```

### 11.2 Design Output Requirements (instruct Open Design)
When exporting from Open Design, each HTML file must:
- Be **fully self-contained** (inline CSS, no external font CDN dependencies ÔÇö embed fonts as base64 or use system fallbacks)
- Include **annotated comments** mapping each major section to its DESIGN.md directive reference (e.g. `<!-- ┬º4.1 Hero Zone -->`)
- Include **all interactive states** as CSS classes toggled by `data-state` attributes (hover, active, loading, disabled, skeleton) so Open Code can read them without ambiguity
- Use **CSS variable names that exactly match** the tokens defined in DESIGN.md ┬º2 ÔÇö do not rename or alias them in the export
- Include a `<meta name="hw-route" content="/properties">` tag identifying the app route this design corresponds to
- Include a `<meta name="hw-component" content="PropertyCard,FilterBar">` tag listing the primary components featured

### 11.3 Open Code Design Replication Protocol
When Open Code is given design HTML files, it must:
1. Read `ai-system/designs/README.md` to understand which HTML file maps to which route
2. For each screen being implemented, open the corresponding HTML file and **treat it as the pixel-precise reference** ÔÇö not a suggestion
3. Extract spacing values, colours, border radii, and font sizes **from the HTML's inline styles and CSS variables** ÔÇö do not infer or approximate
4. Map each annotated section (`<!-- ┬º4.x -->`) to the corresponding DESIGN.md directive and implement the interaction behaviour described there
5. For components already built in `components/ui/`, compose them to match the design ÔÇö do not create new one-off styled elements
6. After implementing each screen, note any **design-to-code deltas** (things not achievable with current component set) in `ai-system/checkpoints/session-log.md`

### 11.4 designs/README.md Template
Open Code should expect this file to exist and be structured as:
```markdown
# Design Exports ÔÇö Homewolves

| File | Route | Theme | Viewport | Status |
|---|---|---|---|---|
| 01-landing-light.html | / | Light | 375px + 1280px | Ô£à Exported |
| 02-landing-dark.html  | / | Dark  | 375px | Ô£à Exported |
...

## Notes
- All files use CSS variables matching DESIGN.md ┬º2 token names exactly
- Annotated with <!-- ┬ºsection --> comments for Open Code reference
- Interactive states use data-state attributes
```

*End of DESIGN.md*

- [ ] All interactive elements: min 44├ù44px touch target
- [ ] Focus visible: `outline: 2px solid var(--color-brand-secondary)` + `outline-offset: 2px`
- [ ] Colour contrast: text on all surfaces ÔëÑ 4.5:1 (AA). Prices on white ÔëÑ 3:1 (AA large)
- [ ] Images: descriptive alt text always present
- [ ] Forms: label associated with input (not placeholder-only)
- [ ] Status messages: `aria-live="polite"` regions for toast/alert updates
- [ ] Modals: focus trap, Escape to close, `aria-modal="true"`
- [ ] Navigation: skip-to-content link at top of page
- [ ] Keyboard: all interactions reachable and operable via keyboard

---

*End of DESIGN.md ÔÇö Last updated: Homewolves v1.0 baseline. AI: do not modify this file during code generation. Propose changes via PR description only.*