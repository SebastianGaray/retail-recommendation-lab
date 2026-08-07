# Retail Recommendation Lab Design Mapping

## 1. Relationship to the canonical portfolio design

This application adapts the visual identity defined by `sebastiangaray.github.io/DESIGN.md`. The portfolio remains canonical; this document records the implemented retail-specific mapping without duplicating the canonical specification.

## 2. Shared visual invariants

Warm neutral canvases, slate/warm-neutral accent, Source Serif 4 headings, Inter interface copy, JetBrains Mono metadata, filled primary actions, bordered secondary actions, two-pixel focus rings, one-pixel borders, four-pixel radii, restrained shadows, System/Light/Dark themes and visible portfolio attribution are required.

## 3. Exact palette mapping

| Role | Canonical Light / Dark | Local token | Mapping |
|---|---|---|---|
| Background | `#fdf8f8` / `#1b1918` | `--bg` | Exact |
| Surface | `#ffffff` / `#292624` | `--surface` | Exact |
| Subtle surface | `#f7f3f2` / `#23201f` | `--surface-low` | Exact |
| Elevated surface | `#ebe7e6` / `#312d2a` | `--surface-high` | Exact |
| Text | `#1c1b1b` / `#f1ece7` | `--text` | Exact |
| Secondary text | `#444748` / `#c9c0b8` | `--text-secondary` | Exact |
| Muted text | `#515f74` / `#aaa098` | `--muted` | Exact |
| Border | `#c4c7c7` / `#48423e` | `--line` | Exact |
| Strong border | `#8d9292` / `#6a615b` | `--line-strong` | Exact |
| Accent | `#334155` / `#d8cec5` | `--primary` | Exact |
| Accent hover | `#475569` / `#eee6df` | `--primary-hover` | Exact |
| Accent active / primary fill | `#000000` / `#e3dad2` | `--primary-2` | Adapted from canonical primary button fill |
| Accent contrast | `#ffffff` / `#211e1c` | `--on-primary` | Exact button pairing |
| Focus | `#64748b` / `#c5a98f` | `--focus` | Exact |
| Success | `#2f6b4f` / `#79aa8d` | `--success` | Exact |
| Warning | `#8a5b16` / `#d5ad6c` | `--warning` | Exact |
| Danger | Not defined | `--error: #ba1a1a / #ffb4ab` | Adapted for error semantics and contrast |
| Info | Not defined | `--info` = shared accent | Adapted; informational emphasis remains in-family |

## 4. Theme mapping

Light and Dark use the exact canonical background, surface, text, border, accent, focus, success and warning values. System remains the default and follows `prefers-color-scheme`; explicit selection persists under `rrl-theme`. Product imagery remains naturally colored while its frame and fallback inherit the active theme.

## 5. Typography mapping

Source Serif 4 (600/700) is used for headings and the project brand. Inter (400/500/600/700) remains the dense interface family. JetBrains Mono (500/700) labels prices, metrics, metadata and disclosure text. Georgia, system sans-serif and monospace remain fallbacks.

## 6. Button and link mapping

Add to cart, Analyze cart and View recommendations use the canonical filled primary family: black/warm-light fill, contrasting label, four-pixel radius and `0.75rem 1.2rem`-scale padding. Product details, reset and quantity controls are bordered secondary actions. Remove is a danger-colored text action. External Portfolio and GitHub links carry `↗`. All controls share a `2px` focus outline with `4px` offset; disabled controls remain visible at 50% opacity and suppress the pointer cursor.

## 7. Border, radius and shadow mapping

Cards, filters, dialogs, inputs and panels use `1px solid --line` and the canonical `4px` radius. Hover uses `--line-strong`; standard cards do not float. The canonical shadow token exists for genuinely floating UI but product hover relies on border emphasis. Drawers retain a single dividing border.

## 8. Spacing mapping

The retail shell keeps its task-appropriate `1280px` maximum width, `24px` desktop and `16px` mobile gutters. Sections use `80px` desktop and `56px` mobile padding. Local composition follows an 8px-oriented rhythm while keeping canonical control targets of at least 44px.

## 9. Navigation and attribution

The sticky 72px header contains project identity, Portfolio return, methodology, language, theme and cart access. Footer attribution repeats Portfolio and GitHub external links. The public portfolio return target is `https://sebastiangaray.github.io/`.

## 10. Local component patterns

Product cards use a fixed 4:3 image frame, bordered surface, metadata, price hierarchy and paired detail/add actions. The cart is a right-side native dialog with quantity steppers, removal, subtotal and reset. Recommendation cards use 16:10 images and reason badges. Strategy controls, comparison metrics, empty copy and error panels reuse the shared surface and border hierarchy.

## 11. Domain-specific identity

Retail character comes from product imagery, merchandising scale, catalog grids, price typography, cart interaction, recommendation explanations and strategy comparison—not from a replacement brand color.

## 12. Domain-specific semantic colors

Success uses the canonical green for available/offline-ready status. Danger uses `#ba1a1a` in Light and `#ffb4ab` in Dark for unavailable artifacts and removal. Recommendation reasons use the elevated surface plus shared accent. Category distinction is carried primarily by text and imagery; no competing categorical brand palette is defined.

## 13. Responsive behavior

Three-column retail grids become two columns at `960px` and one column at `700px`. Filters become non-sticky and then single-column at `420px`; dialogs, footer and product actions reflow without horizontal scrolling. The cart uses the full available width on narrow screens.

## 14. Accessibility

The application uses semantic sections, a skip link, native inputs and dialogs, minimum 44px targets, visible focus, localized accessible labels, live cart status, stable image dimensions and localized image failure states. Color is not the only source of recommendation or selected-state meaning. Reduced motion disables scrolling and loading animation.

## 15. Localization

English and Spanish routes have parallel content, metadata and controls. Language switching uses base-path-safe links. Portfolio attribution is localized while the destination remains stable.

## 16. Writing style

Copy is direct, technical and evidence-led. It repeatedly identifies synthetic behavior, transparent strategies and offline evaluation, and avoids checkout language, production claims or implications about real shoppers.

## 17. Allowed deviations

The retail application may use wider content, denser grids, natural product imagery, image loading motion, price emphasis, cart dialogs, recommendation reason badges and strategy controls. Danger colors may be added where errors or removal require them.

## 18. Prohibited deviations

Do not replace the shared accent, return to indigo/blue canvases, increase radii into a soft-card aesthetic, add decorative shadows, introduce unrelated fonts, hide portfolio attribution, weaken focus visibility, add checkout/payment/authentication/tracking or imply real customer behavior.

## 19. Implementation notes for Astro

Tokens live in `apps/web/src/styles/global.css`. `data-theme` selects Dark; a System value delegates to `prefers-color-scheme`. Astro keeps static output and the `/retail-recommendation-lab` base. The storefront component owns bilingual markup; browser-local TypeScript owns cart, artifacts, recommendations and persisted theme preference. No shared runtime package is used.

## 20. Final-code confirmation

This document matches the final implemented CSS tokens, storefront navigation, themes, typography, actions, cards, dialogs, responsive rules and attribution in this repository.
