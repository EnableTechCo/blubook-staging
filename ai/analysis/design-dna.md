# BluBook workspace design DNA

## Direction

The protected application uses a calm, premium operational-dashboard language: clean white,
cool blue-grey, dark navy text, the existing BluBook cobalt accent, and restrained translucent
surfaces. It takes cues from the supplied planning and workflow references without copying their
branding, assets, or layout.

## Tokens

- App background: near-white cool blue (`paper`)
- Primary surfaces: white at 70-90% opacity (`paper-light`)
- Secondary surfaces: pale blue-grey (`cream`, renamed visually but kept as a compatibility token)
- Text: dark navy (`ink`, `ink-deep`)
- Accent and focus: BluBook cobalt (`cobalt`, `cobalt-deep`, `cobalt-wash`)
- Positive, negative, warning, and status colours retain their semantic roles
- Surface radius: 16px; shell radius: 24px; controls: 12px; badges: pill
- Surface shadow: cool low-opacity ambient shadow plus a one-pixel inset highlight
- Spacing: existing 4px Tailwind scale with 16-24px internal panel padding

## Typography

Work Sans remains the interface font and Instrument Serif remains the display accent. Page titles
are constrained to roughly 36-52px, section titles to 24-28px, body copy to 13-16px, and metadata
to 9-12px. Weight and contrast provide hierarchy without oversized decorative headings.

## Motion

Motion is limited to frequent interactions. Buttons and button-like controls use a 160ms strong
ease-out and a 0.98 pressed scale. Colour, border, shadow, opacity, and transform are the only
transitioned properties. Reduced-motion preferences collapse transitions and disable smooth
scrolling.

## Glass usage

Glass is reserved for the navigation rail, sticky toolbar, dialogs, and selected primary cards.
It uses translucent white, 18px blur, 130% saturation, a quiet cool border, and a subtle shadow.
Content-dense tables and forms stay more opaque for legibility.
