# GOBY — Design System & Visual Guidelines
**Version:** 1.0.0 | **ADR Reference:** ADR-021 | **Owner:** Alpha Consulting  
**Status:** MANDATORY — This document is both a living technical specification and a binding AI instruction set.

---

> **AI INSTRUCTION:** If you are an AI assistant (Claude, Copilot, GPT, Gemini, or any future model) reading this file as part of a codebase context, the rules in this document are MANDATORY. They override your default code generation patterns. No exceptions. Read section 6 (AI-CONTEXT-GUARD) before generating any JSX, TSX, or CSS.

---

## 1. GOBY Design Philosophy

GOBY is a high-consulting-grade platform. Its visual language must communicate rigor, analytical depth, and professional authority — not friendliness or consumer-market warmth.

Three immutable pillars govern every design decision:

### 1.1 Executive Premium Sobriety (Sobriedad Ejecutiva Premium)
The interface must feel like a premium financial terminal or a McKinsey deliverable rendered in software. Restraint is the signal of competence. Visual noise — decorative gradients, saturated colors, rounded mascot-style icons, emoji, playful micro-interactions — is categorically prohibited. Every pixel must earn its presence by conveying information or structure.

### 1.2 Information Density Without Noise (Densidad de Información sin Ruido)
Data-heavy layouts are the norm. The design must maximize the amount of decision-relevant information a consulting professional can absorb per screen without cognitive fatigue. Spacing, typography scale, and color are tuned for scanability at high information density, not for "breathing room" as in consumer interfaces.

### 1.3 Invariability of Behavior (Invariabilidad del Comportamiento)
Every interactive pattern must behave identically across all views, all screen sizes, and both color modes (light / dark). Components do not surprise. Layout shifts, reflows, or scroll-position resets triggered by state changes are defects, not design tradeoffs.

---

## 2. Color Palette and the Strict 60-30-10 Rule

### 2.1 Token Registry

All colors are expressed as CSS custom properties injected at `:root` in `src/index.css`. These are the canonical values — no hardcoded hex strings are permitted outside of this file and `src/shared/design-system/charts/chartTokens.ts`.

#### Primitive RGB Tokens (for Recharts and CSS `rgb()` / opacity syntax)

```css
/* src/index.css — :root */
--color-gold-rgb:  200 134 10;   /* Obsidian Amber — accent / brand */
--color-navy-rgb:   42  40 34;   /* Warm Navy — structural dark */
```

Usage in CSS: `rgb(var(--color-gold-rgb) / 0.15)` — transparent amber surface tint.  
Usage in Recharts (via chartTokens): `getGoldRgb(0.8)` — never pass CSS vars directly to Recharts.

#### Semantic Hex Tokens

| Token | Hex (Light) | Hex (Dark) | Role |
|---|---|---|---|
| `--color-gold` | `#C8860A` | `#C8860A` | Brand accent, CTA, focus rings |
| `--color-navy` | `#2A2822` | `#2A2822` | Structural dark, sidebar |
| `--color-surface` | `#F7F4EE` | `#22201C` | Page / card base backgrounds |
| `--color-border` | `#D4D0C8` | `#3E3B35` | Dividers, card outlines |
| `--color-warm-950` | `#16140F` | `#16140F` | Deepest dark background |
| `--color-warm-900` | `#22201C` | `#22201C` | Dark app shell |
| `--color-warm-100` | `#C4C0B8` | `#C4C0B8` | Muted text, disabled states |
| `--color-success` | `#86C7A8` | — | Success accent (passive) |
| `--color-danger` | `#D89090` | — | Danger accent (passive) |
| `--color-warning` | `#E8C281` | — | Warning accent (passive) |
| `--color-info` | `#9BB5D9` | — | Info accent (passive) |

#### Chart Semantic Palette (from `chartTokens.ts`)

| Token name | Hex | Usage |
|---|---|---|
| `success-dark` | `#5FAF8A` | Chart lines, filled bars — success |
| `success-light` | `#D4EDE3` | Chart fill areas — success |
| `warning-dark` | `#C9973A` | Chart lines, filled bars — warning |
| `warning-light` | `#F8EDD3` | Chart fill areas — warning |
| `danger-dark` | `#B85C5C` | Chart lines, filled bars — danger |
| `danger-light` | `#F5DEDE` | Chart fill areas — danger |
| `info-dark` | `#5A87C5` | Chart lines, filled bars — info |
| `info-light` | `#D6E4F5` | Chart fill areas — info |
| `text-muted` | `#6B6864` | Chart axis labels, captions |
| `text-subtle` | `#9A9790` | Secondary chart metadata |

### 2.2 The 60-30-10 Rule

| Proportion | Role | Tokens |
|---|---|---|
| **60% — Dominant Neutral** | Page backgrounds, card surfaces, content areas | `bg-surface`, `dark-card`, `dark-page-bg`, `--color-surface` |
| **30% — Structural** | Navigation shell, headers, dividers, borders | `--color-navy`, `--color-border`, `card-border`, `header-border-bottom` |
| **10% — Accent** | CTAs, focus states, active nav items, KPI highlights, chart primaries | `--color-gold`, `--color-gold-rgb` |

Semantic state colors (`success`, `warning`, `danger`, `info`) are used **exclusively as passive accents** — thin borders, small dots, muted fills at `/10` or `/15` opacity — never as dominant fills. See section 2.3.

### 2.3 THE RAINBOW EFFECT — STRICTLY PROHIBITED

**TERMINANTEMENTE PROHIBIDO:** Flooding card backgrounds, KPI cards, banners, section headers, or any container with saturated flat colors (solid red, solid green, solid blue, solid yellow).

This prohibition covers:
- `bg-red-*`, `bg-green-*`, `bg-blue-*`, `bg-yellow-*` as dominant fills
- `bg-emerald-*`, `bg-rose-*`, `bg-sky-*`, `bg-amber-*` as dominant fills on cards or panels
- Any `background-color` that is a fully-saturated semantic color applied to a container larger than 24px × 24px

#### Correct Pattern for Communicating Status

Status (success / warning / danger / info) is communicated via **passive accent techniques on neutral backgrounds**:

```tsx
// CORRECT — left border accent on neutral card
<div className="bg-surface dark:bg-warm-900 rounded-xl border border-border/60
                border-l-4 border-l-[var(--color-success)] p-4">
  ...
</div>

// CORRECT — status dot on neutral row
<span className="inline-block w-2 h-2 rounded-full bg-[var(--color-success)]" />

// CORRECT — tinted surface at low opacity
<div className="bg-[rgb(var(--color-gold-rgb)/0.06)] rounded-lg border border-[rgb(var(--color-gold-rgb)/0.15)]">
  ...
</div>

// WRONG — flooded saturated background
<div className="bg-green-500 rounded-xl p-4"> ... </div>   // PROHIBITED
<div className="bg-red-100 rounded-xl p-4">  ... </div>   // PROHIBITED (too saturated)
```

Status accent specifications:
- **Left border stripe:** `border-l-[3px]` — communicates criticality at a glance.
- **Status dot:** `w-2 h-2 rounded-full` (8×8px) — inline status alongside text labels.
- **Background tint:** Semantic color token at `/5` to `/10` opacity only.

---

## 3. Typographic Hierarchy and Textual Abstraction

### 3.1 Typeface

**Inter** is the sole permitted typeface. It is loaded with `font-feature-settings: 'cv11', 'ss01'` and `-webkit-font-smoothing: antialiased` for maximum legibility at small sizes.

Numeric data must use `tabular-nums` / `font-variant-numeric: tabular-nums` to prevent layout reflow during data updates. Apply the `.tabular-nums` utility class or `font-feature-settings: 'tnum'` directly.

### 3.2 Color for Typographic Hierarchy

**PROHIBITED:** Using arbitrary text colors to separate sections or to establish visual hierarchy between headings.

Typographic differentiation is achieved exclusively through **structural Tailwind modifiers**, not color.

#### Permitted Hierarchy Techniques

| Level | Classes | Use |
|---|---|---|
| Section label / micro-copy | `text-xs uppercase tracking-wider font-medium text-muted-foreground` | Column headers, stat labels, category tags |
| Subsection label | `text-xs uppercase tracking-wide font-semibold` | Tab sub-labels, filter chips |
| Body | `text-sm text-foreground` | Standard prose, descriptions |
| Data value | `text-sm font-semibold tabular-nums` | KPI values, table cells |
| Large KPI | `text-2xl font-bold tabular-nums` | Hero metrics |
| Caption / metadata | `text-[11px] text-muted-foreground` | Footnotes, timestamps |

#### Breadcrumb / Context Pattern (from `AppLayout.tsx`)
```tsx
// Brand mark — gold, mono, uppercase, wide tracking
<span className="text-[11px] font-bold font-mono uppercase tracking-widest"
      style={{ color: '#C8860A' }}>
  GOBY
</span>

// Project name — medium weight, muted, truncated
<span className="text-[11px] font-medium truncate max-w-[160px]"
      style={{ color: 'rgba(28,26,22,0.55)' }} />

// Company name — mono, uppercase, dimmed
<span className="text-[10px] font-mono uppercase tracking-wide truncate max-w-[140px]" />
```

### 3.3 Prohibited Typographic Patterns

- `text-blue-*` / `text-green-*` / `text-red-*` as section separators or hierarchy signals
- Arbitrarily bolding entire paragraphs for emphasis
- Using font-size alone (without weight or tracking) to establish hierarchy
- Mixing more than two font sizes within a single card component

---

## 4. Icon System and De-Emojification

### 4.1 Emoji — ABSOLUTE PROHIBITION

**TERMINANTEMENTE PROHIBIDO** — No Unicode emoji character (🚀 ⚠️ 📈 ✅ ❌ 🔴 🟢 📊 💡 🎯 or any other) may appear in any JSX, TSX, HTML template, or rendered string within this repository.

This prohibition covers:
- Emoji in JSX literal strings: `<span>✅ Done</span>` — **PROHIBITED**
- Emoji in template literals: `` `${status === 'ok' ? '✅' : '❌'}` `` — **PROHIBITED**
- Emoji in data constants rendered to the UI — **PROHIBITED**
- Emoji in button labels, toast messages, modal titles — **PROHIBITED**

**Exception scope:** Emoji may appear in developer-only files that are never rendered: `README.md`, `CLAUDE.md`, `DESIGN-SYSTEM.md` (this file), commit messages, and code comments. Never in JSX output.

### 4.2 Lucide React — The Only Permitted Icon Library

All iconography in GOBY is sourced exclusively from `lucide-react`. No other icon library (Heroicons, Phosphor, FontAwesome, Radix Icons, custom SVG sprites) may be introduced without an ADR.

The dark mode toggle and logout button in `AppLayout.tsx` use inline SVGs as a deliberate exception for the app shell — these are grandfathered. All feature-layer components must use lucide-react.

```tsx
import { AlertCircle, TrendingUp, CheckCircle2 } from 'lucide-react'
```

### 4.3 Size Standards

| Context | `size` prop | Usage |
|---|---|---|
| Inline / button label | `size={16}` | Inside `<Button>`, table action cells, inline status indicators |
| Card / section header | `size={20}` | Left of card title, tab label prefix |
| Primary chassis | `size={24}` | Sidebar nav items, empty state illustrations, modal headers |

No size outside this scale is permitted without justification in a code comment.

### 4.4 Stroke Width — Non-Negotiable

The stroke weight defines the premium, fine aesthetic of the GOBY suite. This value is **immutable**.

```tsx
// REQUIRED — thin premium stroke
<Icon size={20} strokeWidth={1.5} />   // default for most contexts
<Icon size={20} strokeWidth={1.75} />  // slightly heavier, for high-contrast needs

// PROHIBITED — these weights destroy the visual language
<Icon size={20} strokeWidth={2} />     // too heavy — default Lucide — PROHIBITED
<Icon size={20} strokeWidth={2.5} />   // far too heavy — PROHIBITED
<Icon size={20} />                     // inherits Lucide default of 2 — PROHIBITED
```

Always specify `strokeWidth` explicitly. Never rely on the Lucide default.

### 4.5 Icon Color

Icons inherit `currentColor` unless a specific semantic meaning demands an override. Status-signaling icons (error, success, warning) may use semantic token colors:

```tsx
<AlertCircle size={16} strokeWidth={1.5} className="text-[var(--color-danger)]" />
<CheckCircle2 size={16} strokeWidth={1.5} className="text-[var(--color-success)]" />
```

---

## 5. Containers and Passive Interaction

### 5.1 Card Anatomy

All card-type containers follow this specification:

```tsx
// Standard card
<div className="rounded-xl border border-border/60 bg-surface dark:bg-warm-900 p-6">
  ...
</div>

// With dark-mode metallic sheen (from index.css .dark-card)
<div className="rounded-xl card-border dark-card p-6">
  ...
</div>
```

| Property | Value | Prohibited alternatives |
|---|---|---|
| Border radius (large card) | `rounded-xl` (12px) | `rounded-3xl`, `rounded-full` |
| Border radius (input, small) | `rounded-lg` (8px) | `rounded-sm`, `rounded-none` |
| Border color | `border-border/60` | Any saturated color border |
| Shadow | `shadow-sm` max | `shadow-lg`, `shadow-xl`, `shadow-2xl` — **PROHIBITED** |
| Background (light) | `bg-surface` = `#F7F4EE` | Any tinted background except at `/5`–`/10` opacity |
| Background (dark) | `dark-card` class or `bg-warm-900` | Any fully saturated dark color |

#### Dark Card Metallic Gradient (from `index.css`)
```css
/* Defined in .dark-card — applied via the class, not inline styles */
background-image: linear-gradient(
  145deg,
  rgba(240, 237, 232, 0.04) 0%,
  rgba(200, 134, 10,  0.02) 40%,
  transparent 70%
);
```

This subtle gradient is the only permitted decorative treatment for card surfaces. It communicates material depth without color noise.

### 5.2 Input Focus States

All interactive inputs (text, select, textarea, combobox) must resolve to the unified gold focus palette:

```tsx
// Tailwind classes — required on all form inputs
className="... focus:border-gold focus:ring-2 focus:ring-gold/20 focus:outline-none"
```

```css
/* Equivalent CSS */
:focus {
  border-color: #C8860A;
  box-shadow: 0 0 0 3px rgb(200 134 10 / 0.20);
  outline: none;
}
```

Blue browser default focus rings are **prohibited**. Focus must always use the gold palette.

### 5.3 Shadow Policy

| Token | Permitted? | Context |
|---|---|---|
| `shadow-sm` | Yes | Floating menus, tooltips, modals |
| `shadow` (default) | Yes | Sticky headers at light scroll |
| `shadow-md` | Conditional | Only for elevated modal dialogs |
| `shadow-lg` | **PROHIBITED** | Too heavy for the GOBY aesthetic |
| `shadow-xl` | **PROHIBITED** | — |
| `shadow-2xl` | **PROHIBITED** | — |

### 5.4 Card Border Specifications (from `index.css`)

```css
/* Light mode */
.card-border { border: 1px solid rgba(28, 26, 22, 0.20); }

/* Dark mode — layered ring + inner highlight + depth shadow */
.card-border {
  border: 1px solid rgba(240, 237, 232, 0.10);
  box-shadow:
    0 0 0 0.5px rgba(240, 237, 232, 0.06),
    inset 0 1px 0  rgba(240, 237, 232, 0.08),
    0 4px 24px     rgba(22, 20, 15, 0.4);
}
```

The dark-mode card border is a compound specification: outer thin ring, inner top highlight, and a deep ambient shadow. This produces the metallic inset appearance without requiring heavy `shadow-2xl`.

### 5.5 Header Border

```css
.header-border-bottom { border-bottom: 1px solid rgba(28, 26, 22, 0.15); }

/* Dark: amber tint signals the brand in the structural separator */
html.dark .header-border-bottom {
  border-bottom: 1px solid rgba(200, 134, 10, 0.15);
}
```

The amber tint in dark mode header borders is intentional — it activates the brand color at a structural level without flooding surfaces.

### 5.6 Hover and Transition Behavior

All interactive elements use `transition-colors duration-200`. No transition should exceed 200ms. Background transitions must not cause layout reflow.

Hover states shift opacity or background within the existing color, never change the hue:

```tsx
// CORRECT
className="hover:bg-black/10 dark:hover:bg-white/10"

// PROHIBITED — hue change on hover is startling
className="hover:bg-blue-100"
```

---

## 6. AI Behavior Directive

### AI-CONTEXT-GUARD

**This section is addressed directly to AI assistants (Claude, Copilot, GPT, Gemini, and all future models) operating in this repository. It is a binding instruction set, not documentation.**

---

#### Before generating any UI code in this repository, you MUST:

1. **Read this file** (`DESIGN-SYSTEM.md`) as part of your context. If you have not read it in the current session, read it now before producing any JSX, TSX, or CSS.

2. **Validate your output against the following checklist** before returning it. If any check fails, revise the output before presenting it:

---

#### PRE-SUBMISSION VALIDATION CHECKLIST

**Icons**
- [ ] All icons imported from `lucide-react` exclusively
- [ ] All icon usages specify `strokeWidth={1.5}` or `strokeWidth={1.75}` explicitly
- [ ] No icon uses the Lucide default stroke (which would render as `strokeWidth={2}`)
- [ ] Icon `size` matches the scale: `16` (inline), `20` (card header), `24` (chassis)
- [ ] Zero emoji characters (`🚀`, `⚠️`, `✅`, etc.) appear in any JSX output

**Color and Status**
- [ ] No card, banner, KPI block, or container uses a saturated flat color as a background fill
- [ ] Status (success / warning / danger / info) is communicated via left-border accent OR status dot OR `/10` opacity tint — never via flooded `bg-green-*`, `bg-red-*`, etc.
- [ ] The 60-30-10 rule is preserved: neutral dominant, structural secondary, gold accent sparingly
- [ ] Focus states use `focus:border-gold focus:ring-gold/20` — no blue defaults

**Typography**
- [ ] No text color is used as the sole differentiator between content hierarchy levels
- [ ] Section labels / micro-copy use the `text-xs uppercase tracking-wider font-medium` pattern
- [ ] Numeric values use `tabular-nums` where they may update dynamically

**Containers**
- [ ] Cards use `rounded-xl` (large) or `rounded-lg` (inputs) — no larger or smaller radii
- [ ] No shadow heavier than `shadow-md` is applied
- [ ] Card borders use `border-border/60` or the `card-border` CSS class — no arbitrary colors

**Layout Stability**
- [ ] The proposed change does not introduce layout shifts caused by conditional rendering of elements that affect document flow
- [ ] No fixed-height containers that could clip dynamic content

---

#### AUTO-ABORT CONDITIONS

**Auto-abort and revise** (do not submit the output) if any of the following is true:

| Condition | Action |
|---|---|
| Output contains any emoji character in JSX | Remove and replace with Lucide icon |
| Any icon lacks explicit `strokeWidth` | Add `strokeWidth={1.5}` |
| Any card/panel uses `bg-green-*`, `bg-red-*`, `bg-blue-*`, `bg-yellow-*` as the dominant fill | Replace with neutral bg + left border or dot accent |
| Any shadow class is `shadow-lg`, `shadow-xl`, or `shadow-2xl` | Replace with `shadow-sm` or `shadow-md` |
| Any text uses `text-blue-*`, `text-green-*`, `text-red-*` for structural hierarchy (not for inline code or external links) | Replace with weight/tracking/case differentiation |
| Focus state uses default browser outline or `focus:ring-blue-*` | Replace with `focus:border-gold focus:ring-gold/20` |
| A new icon library other than `lucide-react` is imported | Remove; use lucide-react equivalent |

---

#### PRINCIPLE OF MINIMUM VISUAL INTERVENTION

When in doubt, do **less**. Add no color, no animation, no decorative element unless it directly communicates information a consulting professional needs to act on. The absence of decoration is itself a design statement in GOBY.

A feature that works but looks wrong relative to this spec is a defect. Aesthetic regressions are treated with the same severity as functional regressions.

---

*Document generated: 2026-06-17 | Next review: on ADR-021 revision | Maintained by: Alpha Consulting Design Engineering*
