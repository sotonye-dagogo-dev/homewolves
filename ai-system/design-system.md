- last-updated-by: execute-feature-session-29
> - last-verified-against-code: 2026-10-24
> - staleness-policy: re-verify if UI components or styling dependencies change

> **Overview:** Homewolves uses a glassmorphism + bento grid aesthetic inspired by JamesEdition. The design communicates trust, luxury, and clarity for the African real estate market. All tokens are defined as CSS custom properties in `apps/web/app/globals.css` (and DESIGN.md in `ai-system/docs/`). This file is a quick-reference summary — agents building UI must read DESIGN.md in full before writing frontend code. The colour, typography, and spacing tables below are the **single source of truth** for design tokens (per `standards/engineering-principles.md` §5) — components must consume these tokens rather than redeclaring values.

---

## Visual Language

### Colour Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg-base` | `#F7F6F3` | Warm off-white — primary background |
| `--color-bg-elevated` | `#FFFFFF` | Cards, modals |
| `--color-bg-glass` | `rgba(255,255,255,0.55)` | Glassmorphism surfaces |
| `--color-brand-primary` | `#1A3A5C` | Deep navy — headers, primary actions |
| `--color-brand-accent` | `#C8813A` | Warm amber — CTAs, prices, highlights |
| `--color-brand-accent-alt` | `#E8956A` | Terracotta — hover states, tags |
| `--color-text-primary` | `#0F1117` | Near-black body text |
| `--color-text-muted` | `#8A9BB0` | Labels, captions |
| `--color-error` | `#B91C1C` | Destructive actions |
| `--color-success` | `#1A7A4A` | Confirmations, verified badges |

**Dark theme:** All surface tokens inverted. Ambers stay warm.
**High-contrast theme:** Black/white with `#FFD700` accent.

### Typography

| Style | Font | Size | Weight |
|-------|------|------|--------|
| Hero headline | DM Serif Display | `clamp(2.5rem, 8vw, 5rem)` | 700 |
| Section heading | DM Serif Display | `clamp(1.875rem, 5vw, 2.5rem)` | 700 |
| Property price | DM Serif Display | `clamp(1.25rem, 3vw, 1.5rem)` | 700 (amber) |
| Body copy | Inter | `clamp(0.875rem, 2vw, 1rem)` | 400 |
| UI label (ALL-CAPS) | Inter | `clamp(0.70rem, 1.5vw, 0.75rem)` | 600, tracking-widest |
| Badge/pill text | Inter | `clamp(0.70rem, 1.5vw, 0.75rem)` | 600 |
| Price/monospace | JetBrains Mono | `--text-sm` | 400 |

### Spacing Scale

4px base: `--space-1` (4px), `--space-2` (8px), `--space-3` (12px), `--space-4` (16px), `--space-5` (20px), `--space-6` (24px), `--space-8` (32px), `--space-10` (40px), `--space-12` (48px), `--space-16` (64px), `--space-20` (80px), `--space-24` (96px), `--space-32` (128px)

---

## Component Patterns

### shadcn/ui Wrapper Convention (Mandatory)
```
// ✅ CORRECT — import the Homewolves wrapper
import { HwButton } from '@/components/ui/HwButton';

// ❌ WRONG — never import shadcn primitives directly in feature code
import { Button } from '@/components/ui/button';
```
Each wrapper: imports shadcn primitive → applies design tokens via `cn()` → accepts `config?: ComponentConfig` → falls back to `FALLBACK_*` constants → exported from `components/ui/index.ts`.

### Buttons
- **Primary:** Amber bg (`#C8813A`), white text, `--radius-full` pill shape, `--shadow-sm` → `--shadow-md` on hover
- **Secondary:** White/glass bg, navy border, navy text
- **Ghost:** Transparent, navy text, underline on hover
- **Danger:** Red bg (`--color-error`), white text
- **Icon-only:** Circular, 40px min, glass surface
- **FAB:** Amber circle, 56px, `--shadow-xl`, fixed bottom-right mobile

### Forms
- Input fields: White bg, `--radius-md` (12px), `--shadow-xs`, focus ring
- Select: Custom dropdown, no native arrow
- File upload: Dashed border drop zone, glass inner surface
- OTP input: 6 digit boxes, auto-focus progression
- Floating labels: Label animates up on focus/fill
- Error messages: Red text below field, icon
- **Field contrast baseline (2026-10-14 audit):** all `input`/`select`/`textarea` render `color: var(--color-text-primary)` on `background: var(--color-bg-input)` with `placeholder: var(--color-text-muted)`; native `select option`/`optgroup` are forced opaque (`--color-bg-input` + `--color-text-primary`) in both themes so dropdown options are never white-on-white; `:-webkit-autofill` is pinned to the primary text color; new tokens `--color-bg-input`, `--color-bg-input-disabled`, `--color-text-tertiary`, `--color-danger` (= `--color-error` alias), `--color-bg-canvas` defined for light/dark/high-contrast in `apps/web/app/globals.css`. Reusable wrappers `HwInput`/`HwSelect`/`HwTextarea` (in `apps/web/components/ui/`) consume shared `form-field-config.ts` (`FormFieldConfig`, `FALLBACK_FORM_FIELD`, `formFieldClassName()`) — feature code passes `config` rather than hardcoding colors.

### Navigation
- **Web desktop:** Top bar (glass, blur, 64px) — logo left, search centre, auth right
- **Mobile:** Bottom tab bar (glass, 80px + safe area) — 5 tabs, amber active indicator
- **Dashboard (tablet/desktop):** Side nav (64px collapsed / 240px expanded), glass surface, role-aware nav items
- **Admin:** 240px glass side nav with SVG icons, badges, footer avatar

### Theming, Status & Empty States
- **Global theme control:** `components/shared/theme-toggle.tsx` is mounted once in `app/layout.tsx`. It cycles light → dark → high-contrast with lucide `Sun`/`Moon`/`Contrast`, respects safe-area insets, and is the only theme toggle in the app (do not add per-page toggles).
- **Status badges:** use `lib/status.ts` (`statusTone`, `statusToneStyle`) with the `--color-status-*` / `--color-*-bg` tokens; never hardcode green/amber/red Tailwind classes for status.
- **Empty/error states:** use `components/shared/empty-state.tsx` (`EmptyState`, centered by default) with a lucide icon, title, description, and an action/CTA. Loading skeletons are acceptable only where content shape is known.
- **Token rule (2026-10-20 audit):** feature surfaces use `--color-text-*`/`--color-bg-*`/`--color-border-*`; no `text-white`/`bg-white` except over-image overlays (`ad-banner`, transparent-hero nav), email-preview iframes, and the configured brand-logo disc. Icons are lucide-react, not emoji.
- **Config-driven credit colours (2026-10-24):** admin config references design tokens by key, resolved by `lib/design-tokens.ts` (`designTokenVar`, allow-listed `TOKEN_VARS` → theme-aware `var(--…)`, unknown values fall back). Map info-tag text uses `map_config.credit.colorToken` (default `success` = green in every theme); footer dev credit uses `brand.developerCreditColorToken` (default `accent`). Both credit links carry the same lucide `ExternalLink` glyph. Never accept raw hex/colour strings from config.

### Cards / Containers
- **Property Card:** 16:9 image, glass strip pinned to bottom with price + meta, hover lift `translateY(-4px)`
- **Bento Cell:** Glass surface card, variable grid sizes (1×1 to 3×1), configurable order
- **Glass Modal:** `scale(0.96→1.0)` entry, backdrop overlay, mobile = bottom drawer
- **Message Bubble:** Glass with tails, date dividers, unread badges

### Modals / Dialogs
- Entry: Scale from 0.96 + fade, spring easing
- Backdrop: `rgba(0,0,0,0.40)` with `backdrop-filter: blur(4px)`
- Close: `×` top-right + Escape key + backdrop tap
- Mobile: Full-screen drawer from bottom, drag to dismiss

### Status Badges / Pills
- `--radius-full`, `--text-xs`, `--font-semibold`
- Sale: blue, Rent: green, Shortlet: amber, Land: purple
- Verified: green, Pending: amber, Complete: blue, Rejected: red

### Map Surfaces (HwMap) — keyless stack (2026-10-21)
- **Contract:** `components/map/hw-map.tsx` is the only map entry point (`maplibre-gl` + `react-map-gl/maplibre` underneath; never import either directly in feature code). Rendering config comes from PlatformConfig `map_config` (`useMapConfig()`), toggled by the `map_view` feature flag.
- **Tokens (added 2026-10-21):** `--color-accent-overlay` (white/black translucent overlay over accent surfaces — properties "All" pill, unread pills, transaction steppers), `--color-tag`/`--color-tag-bg` (blog/category chips), `--color-focus-ring` (shared translucent focus ring — replaces hardcoded `rgba(45,106,159,0.35)`); dark + high-contrast now override ALL status pairs (`--color-success/warning/error/info` + `-bg` + `--color-status-*`) and `--color-border-glass`/`--color-border-brand`.
- **Pins:** price-tag chips on `--color-bg-elevated` with `--color-brand-primary` border (exact), config `markerColor`/`markerBorder` (Lagos default `#C8813A`/`#1A3A5C`) for icon pins; approximate (geocoded) pins surface "Approximate location" in popups via `--color-warning`.
- **Popups/controls:** MapLibre chrome is tokenized in `globals.css` (`.maplibregl-popup-content` → `--color-bg-elevated` + `--color-text-primary`; attribution → `--color-bg-glass` + `--color-text-secondary`), so popups stay readable in dark/high-contrast.
- **Fall back, never break:** style step-down vector → raster chain → token-styled `MapLocationFallback` card (glass surface, OpenStreetMap outbound link). Skeleton (`--color-bg-canvas` + `--color-text-muted`) while dynamic-loading. `darkTheme` style choice observed via `data-theme` MutationObserver.
- **Accessibility:** map containers always carry `aria-label`; pins are real `<button>`s with listing-name labels; surroundings retain normal text on tokens.

---

## UX Principles

1. **Performance as UX** — skeleton loaders on every async surface. No layout shift. Images lazy-loaded with dominant colour placeholders.
2. **Luxury restraint** — generous whitespace, minimal chrome, property is always the hero.
3. **Config-first rendering** — every UI element resolves content from config before falling back to hardcoded defaults.
4. **Accessible by default** — WCAG AA contrast (4.5:1 text), 44×44px touch targets, focus rings, ARIA roles.
5. **Reduced motion respected** — all animations collapse to instant opacity when `prefers-reduced-motion` is set.
6. **Error states are designed** — each async surface has loading → empty → error → success states, all explicitly handled.

---

## Responsive Breakpoints

| Breakpoint | Value | Target |
|------------|-------|--------|
| xs | 375px | Small phone |
| sm | 480px | Large phone |
| md | 768px | Tablet portrait |
| lg | 1024px | Tablet landscape / small laptop |
| xl | 1280px | Desktop |
| 2xl | 1536px | Large desktop |
| 3xl | 1920px | Ultrawide |

**Orientation:** Mobile portrait = single column, bottom nav. Mobile landscape = map/card split, mini nav rail. Desktop = side nav, multi-column bento grids.

---

## Accessibility Requirements

- All interactive elements: min 44×44px touch target
- Focus visible: `outline: 2px solid var(--color-brand-secondary)` + `outline-offset: 2px`
- Colour contrast: text on all surfaces ≥ 4.5:1 (AA). Prices on white ≥ 3:1 (AA large)
- Images: descriptive alt text always present (auto-generated from `title + location` if not set)
- Forms: label associated with input (not placeholder-only)
- Status messages: `aria-live="polite"` regions for toast/alert updates
- Modals: focus trap, Escape to close, `aria-modal="true"`
- Navigation: skip-to-content link at top of page
- Keyboard: all interactions reachable and operable via keyboard

---

## Reference Library

External design languages — competitor, inspiration, or reference sites — pulled into `design-references/<name>/DESIGN.md` (Tier 4, read when explicitly relevant). The `generate-design-md` command creates them.

These are **inputs to be reconciled**, never the project's source of truth. The token tables in this file remain the single source of truth per engineering principles §5. Promotion from a reference into the project's real tokens is a human decision, not an agent write.

See `design-references/README.md` for the folder contract.

---

## Design Asset Viewer (dev-only entry point)

A human-facing route to browse design assets — HTML mocks, images, PDFs — without those assets touching the app's real route table when deployed. This is a dev tool, not an agent workflow, and it is itself governed by the engineering principles like any other page.

**Hard rules (not conventions):**
- Mounted at a distinct, configurable base path (e.g. `/__design/*`) on its own router/middleware branch — never nested under app routes.
- **Gated:** only mountable when the env flag is set (`ENABLE_DESIGN_VIEWER=true`), defaulting off. **Never enabled in a production build regardless of the flag** — this is a hard rule, not a convention.
- Reads a config manifest (engineering principles §1) listing which local folders/paths it is allowed to serve — never an open filesystem browser.
- No hardcoded asset lists in code.

**Rendering by type:**
- HTML → sandboxed iframe
- Images → `<img>`
- PDF → render pages; where text/structure extraction is needed, use the classify-then-extract approach from the `pdf-html-asset-inspection` skill (detect text vs scanned, extract with position awareness, convert to Markdown) via a small internal utility or thin wrapper.

**Where it lives:** see also `system-architecture.md` (the `ENABLE_DESIGN_VIEWER` config row) and the viewer's security isolation note for the deployment platform. The extraction-backend choice (markitdown vs pdf-inspector) is deferred until the viewer is actually built — no decision logged in `memory/project-decisions.md` yet.
