# Flatten the landing hero action

Written against: 61847829164caab752e63d379d8d9e75c4e72823

## Evidence chain

- Surface: `/`, primary hero action
- Problem: The primary hero action adds a 30px external shadow over an already image-led composition.
- Design evidence: The accepted iOCO design brief specifies gradient buttons with moderate rounding and no glow or oversized shadow. The installed `design-taste-frontend` guidance prefers flat grouping and reserves elevation for meaningful hierarchy.
- Owner: `src/app/page.tsx`
- Scope and affected surfaces: The primary hero action only.
- Uncertainty: None. The shadow is a single presentation utility and does not communicate state.

## Design decision

Remove the external shadow from the primary hero action. Preserve the BluBook cobalt gradient, white semibold label, 8px rounding, action arrow, pressed feedback, and destination.

## Reuse

- Existing `from-cobalt-deep to-cobalt` gradient, `rounded-lg`, `public-action`, and global active-state feedback.
- Exemplar: The flat primary action in the Why BluBook section.

## Changes

1. `src/app/page.tsx`
   - Change: Remove the arbitrary hero CTA shadow utility.
   - Preserve: Size, spacing, contrast, hover arrow movement, label, and link destination.
   - Verify: The action remains clearly primary against the dark hero without appearing luminous or detached.

## Scope

- Inherit: Hero CTA only.
- Verify: Contrast against the darkest and brightest parts of the hero crop.
- Exclude: Story-card shadows, the special contact panel shadow, authenticated buttons, and all button behavior.

## Validation

- Product: Open `/` and confirm the hero CTA remains prominent through color and weight rather than elevation.
- Interface: Verify normal, hover, focus-visible, and active states on desktop, plus the default state at 390px.
- System: Confirm no new button variant or parallel style owner is introduced.
- Repository: `git diff --check` -> no whitespace errors.

## Stop conditions

- Stop if contrast without the shadow falls below the existing readable state against the rendered hero.

## Design documentation

- After acceptance and validation: none. This applies the existing button contract from the accepted brief.
