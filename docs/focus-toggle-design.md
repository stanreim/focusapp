# Focus toggle design spec — Figma node 61-3727

Source: [Focus – Timer/Focus toggle](https://www.figma.com/design/hQz61wIVfSis1RrbE66VKR/Focus?node-id=61-3727&m=dev)

## Container (Timer tap area)

- **Frame:** 342×208px at lg; min-height 120px / 168px (sm) / 208px (lg).
- **Layout:** Content centered in the tap area (items-center, justify-center).
- **Padding:** p-4 / p-5 (sm) / p-6 (lg).

## Toggle pill (track)

- **Shape:** Pill / stadium (full rounded corners).
- **Height:** ~48px so the thumb fits snugly.
- **Min width:** ~120–136px so the pill is clearly visible (thumb + gap + “Focus” + padding).
- **Light:** Soft light gray track (e.g. #e5e5e5 or #e0e0e0).
- **Dark:** Dark track (e.g. #2a2a2a) with subtle inset shadow.
- **Shadow:** Subtle inset for depth, consistent with app.

## Thumb (knob)

- **Size:** ~40px circle.
- **Position:** Left when off, right when on; small inset from track edge (e.g. 4px).
- **Light:** White fill, soft drop shadow.
- **Dark:** Mid gray (#4a4a4a) with shadow.
- **Animation:** Slide with ease (e.g. cubic-bezier(0.4, 0, 0.2, 1)).

## Label

- **Text:** “Focus”.
- **Position:** To the right of the thumb with clear horizontal spacing (e.g. 8–12px).
- **Typography:** SF Pro Medium, ~13px, medium-dark gray (e.g. #5a5a5a light / #a0a0a0 dark).
- **Countdown:** When on, show “Xm” in same style if needed.

## Layout

- **Structure:** [Thumb] [gap] [“Focus”] (and optional countdown when on).
- **Alignment:** Thumb and label vertically centered in the 48px track.
