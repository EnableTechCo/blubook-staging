# BluBook authenticated workspace system

## Direction

- Personality: a utilitarian South African business operations desk; precise, accountable, calm, and visibly built for work.
- Signature: the BluBook case ledger — pale cobalt operational folios with compact ledger headers, decisive figures, quiet ruled detail, and a slim cobalt signal where a state needs emphasis.
- Canvas: white and continuous. The dark BluBook navigation rail remains the branded anchor.
- Accent: cobalt is reserved for navigation, primary actions, focus, and selected state. Teal, green, amber, and red communicate status only.
- Layout rule: visual refinement must preserve existing routes, information architecture, component order, and dashboard placement unless a separate change is explicitly approved.

## Domain

Service network, operational requests, accountable specialists, document trails, deadlines, compliance, sales phasing, financial reporting, tenders, quotations, and client onboarding.

## Depth and surfaces

- Strategy: functional borders plus one shallow shadow on top-level folios; tonal shifts and hairlines inside them.
- Canvas: white.
- Folio: near-opaque pale cobalt glass with a quiet 1px blue-grey border and shallow blue-black shadow.
- Inset: slightly cooler/darker control and data backgrounds; never another floating glass card.
- Popover/dialog: an opaque white operational surface one level above its parent, with a separate navy backdrop and the strongest permitted workspace shadow.
- Sidebar: a flat, full-height BluBook navy operational rail with ruled sections and no floating-card treatment.
- Top bar: a full-width pale-blue command strip, visually connected to the workspace instead of floating above it.

## Tokens

### Spacing

- Base: 4px.
- Micro: 4, 8, 12px.
- Component: 12, 16px.
- Panel: 20px mobile, 24px desktop.
- Section: 28, 32px.
- Major page rhythm: 40px.

### Radius

- Small controls: 6px.
- Standard controls: 8px.
- Folios/cards: 8px.
- Dialogs/large floating surfaces: 10px.
- Navigation rail and toolbar: 0px when flush to the viewport; floating mobile menus use 8px.

### Typography

- Body and controls: Work Sans.
- Operational figures: Work Sans 600 with tabular numerals.
- Page title: Work Sans 600, 30–38px, tight tracking.
- Panel title: Work Sans 600, 18–22px.
- Label/metadata: Work Sans 500–600, 10–12px, restrained tracking.
- Instrument Serif: signature module or editorial titles only, never dynamic figures or dense controls.
- Text levels: primary 100%, supporting 68%, metadata 52%, disabled 36%.

## Reusable patterns

### Workspace page header

- Compact product header with a cobalt eyebrow rule, Work Sans semibold title, supporting copy, and optional action aligned to the lower edge.
- The title or primary action is the single focal point.

### Operational folio

- 8px radius; existing page and component spacing is preserved.
- Near-opaque pale cobalt glass, quiet blue-grey border, and one shallow shadow.
- Header belongs to the same material; use a hairline and spacing rather than a second fill.

### Metric band

- One leading figure may be larger than the rest.
- Values use tabular Work Sans semibold; labels are compact uppercase metadata.
- Semantic color appears only when the value communicates a verdict.

### Buttons

- Minimum 44px hit area; 6px radius; Work Sans 12px/600.
- Primary is cobalt. Secondary is pale/white. Quiet actions remain transparent.
- 150ms named-property transitions and 0.98 active scale.

### Form controls

- Minimum 44px height; 6px radius.
- Opaque inset cool background, clear quiet border, 3px translucent cobalt focus ring.
- Labels use 12px/600 and help text uses 12px/1.6 supporting color.

### Records and tables

- Records use one folio material with metadata separated by spacing or hairlines.
- Dense comparison tables retain native table semantics and horizontal containment.
- Dynamic numbers use tabular numerals.
- Status labels are compact rounded rectangles, not decorative pills; colour communicates a real lifecycle state only.

### Dialogs

- Native dialog behaviour is retained for focus trapping, Escape, focus return, and scroll locking.
- The dialog surface is explicitly opaque and independent of generic card/background selectors.
- The backdrop is a separate translucent navy layer; the shell may remain perceptible but never compete with the form.
- Existing form structure, actions, routes, and field order remain unchanged.

## Rejected defaults

- Equal grids of identical cards: use a leading state or figure and demote supporting records.
- Glass nested inside glass: one folio material with transparent internal regions.
- Marketing-scale serif headings: compact product hierarchy, with serif reserved as a brand signature.
- Decorative gradients and multiple accent hues: cobalt communicates action; semantic colors communicate status.
- Reference-image feature copying: use the supplied CRM references for visual treatment only; do not add search, filters, bulk actions, metrics, or routes that are not already present.
