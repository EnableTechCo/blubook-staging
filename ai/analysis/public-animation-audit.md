# Public and authentication motion audit

## Scope

The landing page, shared authentication shell, role login routes, and client signup route use the
same motion language as the protected workspace. No route, form action, state transition, or
authentication behavior is animated or changed.

## Implemented motion

| Surface | Motion | Trigger | Purpose |
| --- | --- | --- | --- |
| Landing hero copy | 14px fade/translate with a short three-step stagger | Initial load | Establish hierarchy without delaying interaction |
| Landing hero image | Subtle opacity and 0.985-to-1 scale | Initial load | Pair the editorial image with the copy entrance |
| Landing hero atmosphere | One low-speed Vanta fog canvas | Desktop, standard motion | Add restrained depth behind the first impression |
| Mobile navigation | 14px fade/translate | Menu open | Clarify where the temporary surface came from |
| Story detail | 14px fade/translate | Active story change | Confirm that the selected panel changed |
| Selected public cards | 3px lift and ambient shadow | Fine-pointer hover | Give feedback only to meaningful interactive surfaces |
| Authentication card | 14px fade/translate | Initial load | Connect sign-in and signup to the public visual language |

## Constraints

- Entrances remain CSS only; Vanta and its compatible Three.js runtime are isolated to one hero
  background.
- The WebGL effect uses a static CSS gradient fallback, runs without pointer or gyro tracking, and
  is disabled below 1024px and when reduced motion is requested.
- Only opacity and transform animate during entrances.
- Hover lift is disabled on touch and coarse-pointer devices.
- Existing global `prefers-reduced-motion` handling collapses every animation and transition.
- Motion never blocks input, form submission, navigation, or content reading.
