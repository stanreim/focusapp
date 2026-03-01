# Clock design spec — Figma nodes 61-3739, 60-16377

- **Base clock:** [61-3739](https://www.figma.com/design/hQz61wIVfSis1RrbE66VKR/Focus?node-id=61-3739&m=dev)
- **Watchface bright theme (light):** [60-16377](https://www.figma.com/design/hQz61wIVfSis1RrbE66VKR/Focus?node-id=60-16377&m=dev) — white dial, soft shadow, minimal markers, white center dot

## Face (dial)

- **Shape:** Perfect circle.
- **Background:** Light gray `#EDEDED`. Page/background gray `#EAEAEA`.
- **Neumorphic effect** (from Figma variable `Neumorph`):
  - Inner shadow 1: `#A6A6A61F`, offset (5, 7), blur 10, spread -1
  - Inner shadow 2: `#FFFFFF40`, offset (-6, -1), blur 10, spread 2
  - Drop shadow 1: `#FFFFFF80`, offset (-6, -7), blur 20, spread 0
  - Drop shadow 2: `#AAAAAA40`, offset (8, 8), blur 20, spread 0

CSS `box-shadow` order (inset first, then drop):

```css
box-shadow:
  inset 5px 7px 10px -1px rgba(166, 166, 166, 0.12),
  inset -6px -1px 10px 2px rgba(255, 255, 255, 0.25),
  -6px -7px 20px 0 rgba(255, 255, 255, 0.5),
  8px 8px 20px 0 rgba(170, 170, 170, 0.25);
```

## Hour markers (Figma 61-3739: 8 LINEs)

- **8 tick marks** at 12, 1:30, 3, 4:30, 6, 7:30, 9, 10:30 (rotations -90°, -45°, 0°, 45°, 90°, 135°, 180°, 225°).
- All **24px** long, stroke weight 1. Color: `rgb(158, 159, 166)` (Figma 0.62, 0.624, 0.651).

## Hands (Figma 61-3745, 61-3746)

- **Color:** Black `rgb(0,0,0)`; dark theme: `rgba(255,255,255,0.95)`.
- **Origin:** Center of the face.
- **Hour (Line 6):** 114.9px length, stroke weight 2 (clock height 509px → ~22.57% of width).
- **Minute (Line 5):** 153.9px length, stroke weight 2 (~30.24% of width).
- **Shape:** Rounded (pill). No seconds hand.

## Center (Figma 61-3747 Ellipse 1)

- **24×24px** circle. Fill `rgb(17, 17, 17)` (0.0667). **4px** stroke in face grey `#EDEDED`. Dark theme: white fill, subtle stroke.

## Outer ring

- Design is minimal; no strong dashed ring. Omit or use a very subtle stroke if needed.
