# Simplify the landing hero

Written against: 61847829164caab752e63d379d8d9e75c4e72823

## Evidence chain

- Surface: `/`, public landing hero
- Problem: The hero ends with a decorative three-part relationship strip that adds a fifth message layer beneath the headline, supporting copy, and actions.
- Design evidence: The accepted iOCO design brief prohibits unnecessary metric or trust rows in the hero. The installed `design-taste-frontend` guidance also prohibits decorative hero-bottom text strips and limits the hero to four content layers.
- Owner: `src/app/page.tsx`
- Scope and affected surfaces: The hero section and its desktop and mobile vertical spacing only.
- Uncertainty: None. The strip is static decoration and has no route or interaction contract.

## Design decision

Remove the decorative relationship strip and use the recovered space to bring the hero closer to the accepted approximately 500px desktop height. Keep the generated crystalline artwork, headline, supporting copy, actions, navigation, and anchor destinations unchanged.

## Reuse

- Existing hero layout, image overlays, responsive breakpoints, and page spacing utilities.
- Exemplar: The accepted iOCO brief's compact image-led hero composition.

## Changes

1. `src/app/page.tsx`
   - Change: Remove the absolute bottom relationship strip, reduce the hero minimum height to approximately 500px on desktop and 600px on mobile, and remove the restrictive headline width that forces an unnecessary third desktop line.
   - Preserve: Hero image, copy, typography, actions, overlays, header, responsive image positioning, and section IDs.
   - Verify: The desktop headline uses two lines, no content overlaps the hero edge at 1280px or 390px, and both actions remain visible.

## Scope

- Inherit: Public landing page only.
- Verify: Header overlay contrast and the transition from the hero into `#why-blubook`.
- Exclude: Authentication, authenticated workspaces, landing-page copy, and motion behavior.

## Validation

- Product: Open `/` and confirm the hero contains only the eyebrow, headline, supporting copy, and actions.
- Interface: Verify 1280x720 and 390x844 viewports with no overlap or horizontal overflow.
- System: Confirm the existing image, navigation, and action owners remain unchanged.
- Repository: `node_modules\.bin\vitest.cmd run src/app/page.test.tsx --reporter=verbose` -> focused landing tests pass.

## Stop conditions

- Stop if removing the strip exposes an undocumented analytics or navigation dependency.

## Design documentation

- After acceptance and validation: none. This applies the already accepted landing-page design brief.
