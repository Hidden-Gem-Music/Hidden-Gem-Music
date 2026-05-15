# Frontend Styling Rules

**Project:** Hidden Gem Music Discovery Platform — SOFT290 Capstone
**Author:** mp3li
**Date:** 2026-05-15
**Status:** Active

---

## Purpose

This document records the current frontend styling conventions for shared work in `hidden-gem-music-app`.

The goal is consistency, not visual stagnation. New UI work should match the project’s established visual language unless an issue intentionally changes that language.

## Source-of-truth files

Primary theme files:

- `src/theme/colors.ts`
- `src/theme/typography.ts`

Core reusable surfaces:

- `src/components/Panel.tsx`
- `src/components/ScreenScaffold.tsx`
- `src/components/SecondarySurfaceFill.tsx`

## Color usage

Current color ownership is centralized in `src/theme/colors.ts`.

Important usage patterns:

- `colors.background` / `colors.backgroundBottom`
  - screen-level base gradient and page atmosphere
- `colors.panel` / `colors.panelAlt` / `colors.panelLight`
  - panel and raised-surface treatment
- `colors.text` / `colors.textLight` / `colors.textStrong`
  - body and emphasis text
- `colors.accent` / `colors.accentDark` / `colors.navGradient`
  - active states, emphasis, and branded highlight treatment
- `colors.border` / `colors.shadow`
  - shared panel outline depth and shadow treatment
- `colors.scrollbarTrack` / `colors.scrollbarThumb`
  - custom web scrollbar treatment

Rules:

- prefer theme tokens over inline hex values
- add new theme tokens before repeating a new raw color in multiple files
- use inline hex values only when a one-off visual treatment is genuinely screen-specific
- do not use raw white for normal UI text; use the app's light or dark text tokens unless there is a specific decorative exception

## Typography

Current typeface ownership is centralized in `src/theme/typography.ts`.

Current role mapping:

- `typefaces.display`
  - headline/display usage
- `typefaces.condensed`
  - compact labels and utility display use where needed
- `typefaces.body`
  - standard body copy and most supporting text

Rules:

- display font should remain reserved for headings or deliberate emphasis
- body font should remain the default for readable paragraphs, labels, and metadata
- avoid mixing ad hoc fonts into single screens when the existing type system already covers the need

## Shared surface rules

The default panel treatment is defined in `src/components/Panel.tsx`.

Current shared panel characteristics:

- rounded corners
- strong border
- visible shadow/depth
- medium internal padding

Rules:

- start with `Panel` before creating new one-off surface containers
- if a surface needs a custom fill treatment, layer that treatment inside the panel rather than replacing the panel structure entirely
- keep border/shadow language consistent across major screens unless a component is intentionally decorative

## Screen background rules

The default page shell is defined in `src/components/ScreenScaffold.tsx`.

Current scaffold behavior includes:

- full-screen background gradient
- light noise wash
- shared outer page padding
- shared stacked/web scroll behavior
- custom web scrollbar treatment when the scaffold owns scrolling

Rules:

- new screens should use `ScreenScaffold` unless there is a strong reason not to
- screen-level background experiments should be deliberate and should not break the app-wide atmosphere

## Spacing and layout conventions

The project does not currently use a strict tokenized spacing scale, but recurring spacing patterns are already established.

Practical rules:

- preserve the existing panel rhythm before introducing new spacing values
- prefer reusing established `padding`, `gap`, and section-spacing patterns from the nearest related screen
- keep large screen sections visually grouped through consistent vertical spacing
- on responsive screens, adjust grouping and stacking before shrinking every individual text size

## Border, radius, and depth rules

The current UI language favors clearly bounded surfaces rather than flat cards.

Rules:

- retain rounded corners on primary panels
- retain visible border contrast on major surfaces
- keep shadow usage consistent with the project’s existing layered/depth-heavy visual style
- do not flatten panels into borderless rectangles unless a design change explicitly calls for it

## Hover, pressed, and mobile interaction rules

The project uses hover and pressed styling on web where it improves affordance, but mobile behavior should stay simpler.

Rules:

- hover styling should be web-specific and should not create accidental mobile-like click behavior
- mobile should not depend on hover-only affordances
- controls that trigger heavier mobile work should show visible pressed styling quickly so the user knows the tap was accepted
- map arrow, zoom, reset, and welcome route buttons should keep mobile press feedback even when the actual map/navigation work may take a moment
- mobile pressed styling should not require firing the actual action from `onPressIn`; route/action buttons should keep normal completed-press semantics
- explicit-content badges on mobile should remain non-hover and non-click styled
- overlays/popups should block unintended underlying interactions unless navigation is intentionally exempted

## Discovery Map styling rules

Current Discovery Map rules:

- web glassy map-info blurb stays compact
- mobile glassy map-info blurb can be taller than web, but it must sit above the map rather than overlap country shapes
- mobile helper mode and detail mode may use separate heights because helper copy is longer than country stats
- the Discovery Map blurb heading uses the display font and app light text token
- helper/detail text should align in scale with nearby mobile country-list and filter-button text
- mobile data countries use the approved solid country fill treatment
- mobile selected countries use the approved light-blue selected treatment
- no-data countries should remain empty but keep visible borders so continent shapes are understandable
- the map should not rely on permanent labels; country identity is surfaced through hover/tap detail states
- reset should stay visually discoverable on mobile even when the map is already at its default viewport

## Loading-state styling and copy rules

The project already uses intentional loading text and loading panels instead of blank gaps.

Rules:

- prefer explicit loading states over empty sections
- avoid layout jump caused by changing loading punctuation width
- keep loading copy neutral and short
- when a screen already has a loading-text pattern or helper hook, reuse it instead of inventing a different pattern

## Responsive styling rules

This frontend is primarily shared between web and mobile rather than split into separate screen trees.

Rules:

- default to responsive/shared styling in the same screen/component
- preserve desktop structure where possible and stack/reflow for narrow layouts only where needed
- treat mobile spacing, hit targets, and overlay behavior as first-class constraints, not afterthoughts
- avoid creating new `*.web.tsx` / mobile splits unless there is a real technical reason

## Reuse vs new pattern guidance

Reuse an existing pattern when:

- a nearby screen already solves the same UI problem
- the change is structural rather than brand-new product behavior
- consistency is more valuable than novelty

Create a new pattern when:

- the user flow is meaningfully different
- existing components would require awkward exceptions
- reusing the old pattern would make the screen less clear or less maintainable

## Update rule

If the frontend theme, reusable surface system, or major interaction styling changes materially, this file should be updated in the same workstream.
