# Music Picker Side Panel — Design Spec (Figma 61-4690)

**Source:** [Figma node 61-4690](https://www.figma.com/design/hQz61wIVfSis1RrbE66VKR/Zeno-Day?node-id=61-4690&m=dev) — "Home / Select Soundtrack"

Implementation uses Figma MCP `get_design_context` for node 61:4690.

## Panel (aside container)

| Property   | Value (px) | Notes |
|-----------|------------|--------|
| Width     | 363        | Toggle frame `w-[363px]` |
| Padding   | 24 H, 10 V | `px-[24px] py-[10px]`; safe-area via max(24/10, env(safe-area-*)) |
| Background| #EDEDED    | `bg-[#ededed]` |

## Content layout (Toggle — 61:4764)

- Column: `flex flex-col gap-[48px] items-end`, full height.
- Scrollable track list: gap 16px between rows, aligned end (right).
- Track row: gap 16px; text block (182px, right-aligned) optional; artwork 80×80px, `rounded-[2px]`.
- Typography: Gray 1 #111 (title), Gray 3 #6d6d6d (subtitle); SF Pro Bold 16px / SF Pro Regular 16px.
- Selected row: "Focused" (bold) + song name (regular 16px #6d6d6d) + 80px art.
- Bottom: "Select your mood" (16px #6d6d6d, 133px width) + close button: 72px circle #dcdcdc, inner 64px white, 16px close (X) icon. Inner shadow: inset 1px -3px 4px rgba(0,0,0,0.2), inset 0 4px 4px rgba(0,0,0,0.1).

## Animation

- Slide in from right: `translateX(100%)` → `translateX(0)`, 380ms, `cubic-bezier(0.32, 0.72, 0, 1)`.
- Backdrop: invisible, click to close; Escape to close.
