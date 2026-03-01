# Watchface Picker Side Panel — Design Spec (Figma 61-4364)

**Source:** [Figma node 61-4364](https://www.figma.com/design/hQz61wIVfSis1RrbE66VKR/Focus?node-id=61-4364&m=dev)

Fill in the values below from Figma (Dev mode → Inspect) so implementation matches the design exactly. All values in px unless noted.

## Panel (aside container)

| Property        | Value (px) | Notes |
|----------------|------------|--------|
| Width          | 282        | fixed `w-[282px]` |
| Padding        | 32         | safe-area for top/right/bottom; content uses p-8 |
| Background (light) | #EDEDED | uniform light grey per Figma |
| Background (dark)  | #1a1a1a | for contrast |

## Content area (scrollable list container)

| Property   | Value (px) |
|-----------|------------|
| Padding   | 32 (p-8)   |
| Gap between cards | 32 (gap-8) |

## Card / thumbnail (each watchface option)

| Property     | Value (px) |
|-------------|------------|
| Width       | 218 (full width inside padded area) |
| Height      | 150        |
| Border radius | 24 (rounded-[24px]) |
| Background  | #EDEDED (light) / rgba(255,255,255,0.06) (dark) |

## Shadows (Watchface card — Figma 61-4364)

- Inner: 5,7 radius 10 spread -1 rgba(189,189,189,0.1); -6,-1 radius 10 spread 2 rgba(255,255,255,0.2)
- Drop: -6,-7 radius 20 rgba(255,255,255,0.5); 8,8 radius 20 rgba(170,170,170,0.25)
