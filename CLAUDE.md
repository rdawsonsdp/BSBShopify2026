# BSB Shopify Theme — Claude operating notes

Brown Sugar Bakery's customized Liquid theme (Gen 1 Shopify). Production site: `brownsugarbakery.com`. Physical store: 328 E 75th Street, Chicago. Owner: Stephanie Hart (James Beard nominated, 20+ years on the South Side).

GitHub: `https://github.com/rdawsonsdp/BSBShopify2026`. Default branch: `main`.

## Working directory

The actual theme lives at `/Users/robertdawson/projects/bsb-theme`. Don't be misled by the CWD — always operate against the projects path.

Local dev: `shopify theme dev` on port 9292. Reload after editing.

## Brand palette (locked)

Use these and only these. Do **not** introduce new colors.

| Token | Value | Use |
|---|---|---|
| Maroon | `#570522` | Headings, primary text, ship-day fill |
| Caramel | `#ba5b28` | Accents, arrival fill, closing CTA band |
| Light orange | `#e68c3b` | Hover states, "closing soon" pulse |
| Warm cream | `#f7ead6` | Alt section background |
| Light cream | `#fffaf2` | Default section background |
| Pink | `#facac1` | Birthday Club accent |

The Clover-spec "Heritage palette" (`#3D1E0F`/`#B8722D`/`#C23B22`/etc.) does **not** belong in this repo. Reject it.

## Architecture conventions

- **JSON templates, not `.liquid` templates**, for landing pages. Pattern: `templates/page.<handle>.json` composes sections by reference. Examples: `page.events.json`, `page.candy.json`, `page.birthdays.json`, `page.ship-nationwide.json`, `page.same-day-pickup.json`.
- **Scoped inline `<style>` per `section.id`** — every CSS rule starts with `.<section-class>--{{ section.id }}`. **No CSS variables, no `:root`.** Colors come from Liquid-interpolated schema settings (`{{ section.settings.background_color }}`).
- **Vanilla JS in IIFE pattern**, scoped to `[data-section-id="{{ section.id }}"]`. No frameworks. No external libraries except the existing Birthday Club's `@supabase/supabase-js@2` UMD.
- **Section file pattern**: LIFT comment at top → `<section class="foo foo--{{ section.id }}">` wrapper → inline `<style>` → optional inline `<script>` → `{% schema %}`. Mirror existing sections — don't invent new shapes.
- **Schema settings are camelCase or snake_case-mixed; field types: `text`, `textarea`, `richtext`, `image_picker`, `video`, `color`, `range`, `select`, `checkbox`, `url`, `header`. Avoid `url` type when the default contains `#anchor` or query params (Shopify rejects it — use `text` instead).
- **Reuse before fork.** New landing pages compose 80%+ from existing sections (`page-banner-strip`, `events-process`, `events-trust-band`, `events-closing-cta`, `events-featured-products`, `faq-accordion`, `inspiration-grid`, `media-hero`, `shipping-info-tiles`, `shipping-arrival-callouts`, `shipping-calendar`, `same-day-catalog`, `pickup-store-info`, `collection--featured-collection`).

## Landing page index

All landing pages follow the same JSON-template-composes-sections pattern.

| Page | Handle | Template | Status |
|---|---|---|---|
| Events | `events` | `page.events.json` | Live |
| Candy | `candy` | `page.candy.json` | Live |
| Birthdays | `birthdays` | `page.birthdays.json` | Live |
| Ship Nationwide | `ship-nationwide` | `page.ship-nationwide.json` | Live |
| Same-Day Pickup | `same-day-pickup` | `page.same-day-pickup.json` | Awaiting Clover API token for live catalog |

Dev preview without admin theme push: `?view=<handle>` query parameter forces the template alternate to render. E.g. `/pages/ship-nationwide?view=ship-nationwide`.

## Brand voice

Stephanie Hart — warm, plain-spoken, confident. First-person where natural. Not flowery. Anxiety-first copy ([LIFT](https://chrisgoward.com/lift/) framework: Value, Relevance, Clarity, Anxiety, Distraction, Urgency). Annotate sections with `{% comment %} LIFT: <factor> — <why> {% endcomment %}`.

## Visual vocabulary

- **Beveled enamelware**: cream fill, 1px maroon-tinted border (`rgba(91, 37, 18, 0.18)`), 4px square-ish radius, inset top highlight + bottom shadow + outer drop shadow. Used on `.bsb-info-box`, the writing pillbox, FAQ accordions, callouts.
- **Maroon enamelware button**: gradient `#6c0a2e → #570522 → #45041b`, inset highlights + bottom shadow, caramel hover (`#e68c3b`). Used on PDP Add to Cart, closing CTAs.
- **Pinwheel collage**: 3-col grid with `grid-template-areas` for asymmetric magazine layouts (`events-magazine-collage`).

## Pending Clover integration (Same-Day Pickup)

Phase 1 not yet started — blocked on Clover API token + Supabase function deploy.

- Supabase project: `rdmosawrnjqbhhihnagj` (Brown Sugar CRM)
- Clover Merchant ID: `215255140992` (verify with Stephanie)
- Clover deep-link pattern: `https://brownsugarbakery-chgo.cloveronline.com/menu/{slug}-{cloverItemId}`
- Plan: hourly catalog sync (`sync-clover-catalog` Edge Function) + per-page-load stock fetch (`get-pickup-stock` Edge Function), pure client-side hydration in Liquid (Birthday Club pattern). v1 = browse on BSB, checkout on Clover (no custom cart).
- Mock data currently lives inline in `sections/same-day-catalog.liquid` (`MOCK_PRODUCTS` const). Cutover to live Supabase data is a one-line swap.

## Anti-patterns to reject

- ❌ "Heritage palette" colors (use BSB brand palette only)
- ❌ `templates/page.*.liquid` (use JSON templates)
- ❌ CSS variables / `:root` writes (use scoped inline styles)
- ❌ New section files when an existing one fits (reuse before fork)
- ❌ `url` type schema settings with anchor/param defaults (use `text`)
- ❌ Force-pushing to `main` or rewriting shared history
- ❌ Documentation files unless explicitly requested

## Useful files for context

- `sections/page-banner-strip.liquid` — reusable header pattern
- `sections/events-process.liquid` — N-step diagram, `max_blocks: 8`, auto-fit grid
- `sections/shipping-calendar.liquid` — interactive section reference (CT timezone, aria-live, keyboard nav)
- `sections/shipping-info-tiles.liquid` — click-to-expand tile pattern
- `sections/section-birthday-club.liquid` — Supabase-JS UMD + anon-key pattern (mirror for Clover catalog)
- `assets/custom.css` — global CSS overrides (PDP, cart, recommendations spacing)
