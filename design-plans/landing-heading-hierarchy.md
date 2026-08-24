# Restore the landing heading hierarchy

Written against: 61847829164caab752e63d379d8d9e75c4e72823

## Evidence chain

- Surface: `/`, public landing section headings
- Problem: Major section headings use 42px to 64px normal-weight Instrument Serif, making nearly every section compete with the hero.
- Design evidence: The accepted iOCO design brief specifies approximately 28px to 32px semibold section headings and says to transfer the reference's weight and sizing relationships while keeping existing typefaces. The installed `design-taste-frontend` guidance identifies typography as the highest-leverage preserve-mode modernization step and discourages default Instrument Serif use.
- Owner: `src/app/page.tsx`, `src/components/public/LandingComparison.tsx`, and `src/components/public/LandingStories.tsx`
- Scope and affected surfaces: The major `h2` headings on the public landing page.
- Uncertainty: None. Work Sans semibold is already loaded and used throughout the same page.

## Design decision

Use the existing Work Sans family at 32px semibold for major landing section headings. Keep the hero's deliberate weight contrast unchanged and retain the short gradient accent rules on major sections.

## Reuse

- `font-body`, the existing Work Sans `next/font` variable, `font-semibold`, and the current ink and white text tokens.
- Exemplar: The semibold first line of the existing hero headline in `src/app/page.tsx`.

## Changes

1. `src/app/page.tsx`
   - Change: Restyle the Why BluBook, What we coordinate, How it works, and contact headings to 32px Work Sans semibold with a controlled line height.
   - Preserve: Heading text, hierarchy order, accent rules, section IDs, and responsive layout.
   - Verify: The hero remains the only dominant display moment and long headings wrap naturally.
2. `src/components/public/LandingComparison.tsx`
   - Change: Apply the same heading treatment to the comparison heading.
   - Preserve: Comparison state, buttons, animation, and content.
   - Verify: The heading remains visually primary within the right column without overpowering the image.
3. `src/components/public/LandingStories.tsx`
   - Change: Apply the same heading treatment to the stories heading.
   - Preserve: Story data, cards, images, and responsive grid.
   - Verify: The heading remains distinct from story titles at desktop and mobile sizes.

## Scope

- Inherit: Major `h2` headings on the public landing page.
- Verify: Mobile wrapping, dark-section contrast, and relationship to 26px story and service titles.
- Exclude: Authenticated headings, authentication pages, hero typography, and card titles.

## Validation

- Product: Scan `/` from top to bottom and confirm the hero has clear typographic priority.
- Interface: Verify all affected headings at 1280px and 390px without clipping or awkward single-word lines.
- System: Confirm only the existing Work Sans owner is reused and no font dependency is added.
- Repository: `node_modules\.bin\eslint.cmd src/app/page.tsx src/components/public/LandingComparison.tsx src/components/public/LandingStories.tsx` -> no lint errors.

## Stop conditions

- Stop if a section heading relies on its previous pixel height for measured JavaScript layout.

## Design documentation

- After acceptance and validation: none. This implements the accepted landing typography hierarchy.
