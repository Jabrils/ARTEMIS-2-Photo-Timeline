**2026-05-18 12:00 UTC**

# Finding: No Promo Widget or Attribution Footer

**Type**: Gap
**Severity**: Low
**Files**: `src/hud/HUD.tsx`, new `src/hud/PromoWidget.tsx`

---

## What Was Found

The HUD has no promotional widget and no attribution footer. Specifically:

1. No bottom-right popup component exists anywhere in `src/hud/`
2. No text or link referencing "artemistimeline.com" exists in any source file
3. `src/hud/HUD.tsx` renders no persistent bottom-right UI element beyond the existing telemetry/progress bar row

## Scope

- New file: `src/hud/PromoWidget.tsx` — self-contained component with two sections:
  - CTA text: "Like this tool? Support my work by playing my game & watch my youtube."
  - Attribution footer: "This project is inspired by [artemistimeline.com](https://artemistimeline.com/)" (clickable `<a>` tag)
- `src/hud/HUD.tsx` — import and render `<PromoWidget />` in bottom-right of the HUD overlay

## Preliminary Assessment

New standalone component. No store access needed. Styled to match the existing HUD aesthetic (dark semi-transparent background, cyan border, mono font). Positioned `absolute bottom-4 right-4` or anchored in the HUD's bottom flex row. The attribution link opens in a new tab (`target="_blank" rel="noopener noreferrer"`).
