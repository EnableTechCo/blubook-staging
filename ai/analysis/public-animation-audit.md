# Public and authentication motion audit

## Scope

The landing page, shared authentication shell, role login routes, and client signup route use the
same motion language as the protected workspace. No route, form action, state transition, or
authentication behavior is animated or changed.

## Implemented motion

| Surface | Motion | Trigger | Purpose |
| --- | --- | --- | --- |
| Landing hero copy | 18px fade/translate with a short three-step stagger | Initial load | Establish hierarchy without delaying interaction |
| Landing hero image | Subtle opacity and 0.985-to-1 scale | Initial load | Pair the editorial image with the copy entrance |
| Landing hero atmosphere | One low-speed Vanta fog canvas | Desktop, standard motion | Add restrained depth behind the first impression |
| Mobile navigation | 18px fade/translate | Menu open | Clarify where the temporary surface came from |
| Story detail | 18px fade/translate | Active story change | Confirm that the selected panel changed |
| Selected section compositions | 18px fade/translate, once | 20% in view | Guide attention through major marketing chapters |
| Process and arrangement groups | 24px/0.985 entrance with 60ms stagger | 20% in view, once | Explain grouping without delaying interaction |
| Primary CTA arrows | 4px horizontal shift | Fine-pointer hover | Reinforce the action direction without moving the control |
| Authentication content | 18px fade/translate | Initial load | Connect sign-in and signup to the public visual language |

## Constraints

- Entrances remain CSS only; Vanta and its compatible Three.js runtime are isolated to one hero
  background.
- The WebGL effect uses a static CSS gradient fallback, runs without pointer or gyro tracking, and
  is disabled below 1024px and when reduced motion is requested.
- Only opacity and transform animate during entrances.
- Directional CTA hover feedback is limited to fine-pointer devices.
- Existing global `prefers-reduced-motion` handling collapses every animation and transition.
- Motion never blocks input, form submission, navigation, or content reading.
- Server-rendered content is visible by default; viewport reveals are progressive enhancement and
  do not depend on JavaScript for readability.

## Deliberately omitted

- Sticky product demonstration: the page has no natural screenshot sequence, so adding one would
  change structure and invent a walkthrough.
- Parallax and pointer tilt: neither clarifies the existing content, and both would compete with the
  restrained Vanta hero atmosphere.
- Metric counters: the public page has no genuine headline statistics.
- Link-underlines everywhere, card glows, marquee, typewriter text, and continuous floating:
  repeated decoration would undermine the visual-authorship pass and add no functional feedback.
