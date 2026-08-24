# Landing color transition and hierarchy

## Context

The landing page hero has a strong dark photographic treatment, but it currently ends directly against a pure-white content section. The maximum luminance change makes the first section feel detached from the hero, while the following white and paper sections do not form a deliberate tonal rhythm.

This plan is based on `871731fff6474ecd8e5eeaf9c2c6ede4e7d67781` and preserves the existing iOCO-inspired editorial structure, BluBook cobalt palette, content, imagery, and interactions.

## Changes

1. Add a short, non-interactive gradient bridge at the bottom of the hero using the existing cobalt-wash token.
2. Continue that color into the opening of the Why BluBook section, then ease it through paper into white over the section rather than switching immediately.
3. Normalize the following light-section hierarchy:
   - Why BluBook: cobalt-wash to white transition
   - What we coordinate: white
   - Comparison: paper outer field with a white copy panel
   - How it works: existing dark ink section
   - Stories: existing paper field
   - Contact: existing white field
4. Keep the solution static and token-based. Do not add animation, dependencies, images, shadows, or structural elements.

## Acceptance criteria

- The hero and first section read as one continuous composition at desktop and mobile widths.
- Hero copy and calls to action remain fully legible and unobscured.
- Light sections follow a clear white/paper hierarchy without introducing a new color.
- No horizontal overflow or browser console errors are introduced.
- Existing landing-page tests and targeted lint checks pass.
