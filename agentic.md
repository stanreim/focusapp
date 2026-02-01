# agentic.md

## Focus — A Minimal Daily Focus Instrument

**Read this file completely before making any changes to the codebase.**

---

## 1. Product Intent (Read First)

This product is a **minimalistic daily focus web app**.

It is **not** a productivity dashboard, task manager, or analytics tool.
It is a **calm, intentional instrument** designed to help users:

- Focus on *today only*
- Play one ambient soundtrack
- Enter a deep, distraction-free state
- Complete a small set of tasks and then stop

Think of it as a **Swiss watch** or a **physical focus device**, not traditional software.

---

## 2. Core Philosophy

### What this app should feel like

- Calm
- Mechanical
- Physical
- Predictable
- Trustworthy
- Premium
- Quietly alive

### What this app should NOT feel like

- Busy
- Configurable
- Gamified
- Animated for spectacle
- Data-heavy
- "Productivity porn"

Every interaction should feel **inevitable**, not clever.

---

## 3. Core Use Case

> "I want to focus for a while, with gentle structure and no distractions."

The app supports **one session at a time**:

- One timer
- One soundtrack
- One visual state
- One list of tasks (for today only)

No past, no future, no optimization loops.

---

## 4. Primary Interactions (Gesture-First)

This app is **gesture-driven**, not button-driven.

### Global gestures

| Gesture | Action |
|---------|--------|
| Click anywhere | Start / pause music + timer |
| Long press anywhere (>800ms) | Open sound selection |
| Scroll up/down | Control volume (with subtle visual feedback) |
| Enter focus mode | Fade entire UI except timer + soundtrack |
| Exit focus mode | Restore UI gently |

There should be **very few visible controls**.
Discovery happens through interaction, not instruction.

### Implementation Reference

Gestures are handled in `src/app/App.tsx`:
- `handleScreenClick` — click to toggle play/pause
- `handlePointerDown` / `handlePointerUp` — long press detection (800ms threshold)
- `handleWheel` — volume control via scroll

---

## 5. Focus Mode

Focus mode is a **state**, not a new screen.

In focus mode:

- UI elements fade away instead of being replaced
- Only the timer and selected soundtrack remain visible
- No task list
- No settings
- No controls except implicit "click to pause"

Focus mode should feel **almost meditative**.

### Visual Progression

As the timer runs, the experience gradually:
- Reduces saturation (100% → 50%)
- Reduces contrast (100% → 70%)
- Adds subtle blur (0px → 3px)
- Reduces opacity slightly

When session ends:
- Audio fades to silence over 3 seconds
- Video/background fades to white over 3 seconds

---

## 6. Visual & Motion Principles

### Visual style

- Minimalistic
- Neumorphic / soft physical UI
- Feels like a real object on a desk
- High-quality materials, no sharp edges
- Soft shadows, gentle highlights

### Motion

- Extremely restrained
- Slow
- Predictable
- Peripheral, not attention-grabbing

The **only continuous animation** should be:
- Slow vinyl record rotation during playback

**No full-screen abstract animations.**
**No decorative motion.**

### Current Implementation Notes

The codebase includes some shader backgrounds (`Mood2ShaderBackground.tsx`, `Mood2ThreeShaderBackground.tsx`) and wave animations (`wave-background.tsx`). These should be:
- Used sparingly
- Kept subtle and peripheral
- Never attention-grabbing

---

## 7. Sound & Haptics

Sound is a **first-class feature**, not an accessory.

- Ambient / focus-oriented soundtracks
- One sound at a time
- Vinyl-style rotation reinforces "playing" state
- Volume changes have visual feedback but never dominate

Sound selection is hidden behind **long press**, not a visible menu.

### Audio Implementation

- `src/app/components/AudioPlayer.tsx` — handles playback, volume, fading
- `src/app/components/SoundPickerModal.tsx` — sound selection UI (opened via long press)
- Audio files stored in `/public/assets/mood-{0-3}.mp3`

### Volume Feedback

Volume feedback appears briefly (1.5s) at bottom of screen:
```
VOLUME 70%
```
Styled with backdrop blur, minimal presence.

---

## 8. Tasks (Very Important Constraints)

Tasks are intentionally limited.

### Rules

- Tasks are for **today only**
- Max ~5 tasks
- No dates
- No history
- No analytics
- No productivity metrics
- No streaks
- No achievements

The app should **forget aggressively**.

Tasks are there to reduce mental load, not to track performance.

### Implementation

- `src/app/components/TodoList.tsx` — task list component
- Keep task data ephemeral (localStorage at most, no server sync)
- No completion animations beyond a simple checkmark

---

## 9. Themes

Themes change *mood*, not structure.

### Allowed themes

| Theme | Background | Use case |
|-------|------------|----------|
| Light (default) | `#ededed` | Primary daily use |
| Dark | `#111` | Low-light environments |
| Color | `#56329d` | One opinionated accent mode |

### Implementation

Theme state in `src/app/App.tsx`:
```typescript
const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'color'>('light');
```

Cycles via: `light → dark → color → light`

### Avoid

- User-defined color palettes
- Excessive customization
- Theme proliferation
- Per-mood color schemes that fragment the experience

Consistency > flexibility.

---

## 10. Technical Stack & Guidelines

### Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui + Radix UI primitives |
| Animation | Motion (framer-motion successor) |
| 3D (minimal) | Three.js + React Three Fiber |
| Audio | HTML5 Audio API + react-player |

### Project Structure

```
src/
├── app/
│   ├── App.tsx              # Main application logic
│   ├── components/          # App-specific components
│   │   ├── AudioPlayer.tsx
│   │   ├── BackgroundVideo.tsx
│   │   ├── HomeWrapper.tsx
│   │   ├── LiveClock.tsx
│   │   ├── SoundPickerModal.tsx
│   │   ├── TimerSelector.tsx
│   │   ├── TodoList.tsx
│   │   ├── VolumeControl.tsx
│   │   └── ui/              # shadcn/ui components
│   └── contexts/
├── assets/                  # Static images (imported)
├── components/ui/           # Additional UI components
├── imports/                 # Figma Make generated components
├── styles/
│   ├── fonts.css
│   ├── index.css
│   ├── tailwind.css
│   └── theme.css
└── main.tsx
```

### Code Principles

Code should be:
- **Readable** — Clear intent, minimal abstraction
- **Calm** — No clever tricks, no over-engineering
- **Deterministic** — Predictable behavior, no magic
- **Easy to reason about** — Single responsibility, clear data flow

### Performance Guidelines

- Prefer CSS + SVG + DOM over canvas-heavy solutions
- No heavy shaders or GPU-intensive effects
- Animations must be smooth and predictable (60fps)
- Minimize re-renders in React components
- Lazy load heavy components if needed

### Dependency Philosophy

- Minimal dependencies
- Prefer built-in browser APIs
- No analytics libraries
- No tracking
- No external services beyond audio hosting (if needed)

---

## 11. Mood System

The app has 4 moods (0-3), each with associated audio/video.

### Current Configuration

```typescript
const moods = [
  { video: '/assets/mood-0.mp4', audio: '...' },  // Default
  { video: '/assets/mood-1.mp4', audio: null },   // Generative
  { video: '/assets/mood-2.mp3', audio: null },   // Generative
  { video: '/assets/mood-3.mp4', audio: null },   // Generative
];
```

### Mood Themes (Background)

```typescript
const moodThemes = [
  { type: 'waves', bg: "#fcfcfc", stroke: "rgba(90, 90, 90, 0.18)" },
  { type: 'waves', bg: "#f0fdf4", stroke: "rgba(22, 163, 74, 0.15)" },
  { type: 'image', src: mood2Image, bg: "#f5f5f5" },
  { type: 'waves', bg: "#faf5ff", stroke: "rgba(147, 51, 234, 0.15)" },
];
```

### Switching Moods

- Long press on clock area cycles to next mood
- Both video and audio crossfade over 2-3 seconds
- Mood switching is subtle, not spectacular

---

## 12. Non-Goals (Do Not Build)

**Do NOT add:**

- Productivity stats
- Time tracking history
- Charts or graphs
- Social features
- Notifications
- Gamification
- AI coaching
- Recommendations
- "Insights"
- Streak counters
- Achievement badges
- Leaderboards
- Integrations with other apps
- Cloud sync
- User accounts
- Settings panels with many options

If a feature increases cognitive load, it's likely wrong.

---

## 13. Guardrails Checklist

Before implementing any feature or change, verify:

### Philosophy Check
- [ ] Does this help the user focus, or does it ask for attention?
- [ ] Does this add cognitive load?
- [ ] Is this "productivity porn"?
- [ ] Would this feel at home on a physical focus device?

### Interaction Check
- [ ] Is this gesture-driven rather than button-driven?
- [ ] Is discovery through interaction, not instruction?
- [ ] Are there fewer visible controls after this change?

### Visual Check
- [ ] Is any new animation restrained and slow?
- [ ] Does this maintain the "calm instrument" aesthetic?
- [ ] Is this peripheral rather than attention-grabbing?

### Technical Check
- [ ] Is the code calm and deterministic?
- [ ] Are dependencies minimal?
- [ ] Is performance smooth (60fps)?
- [ ] Does this work without network connectivity?

**If any answer is "no" or uncertain, reconsider the change.**

---

## 14. North Star Question

Before implementing anything, ask:

> "Does this help the user focus — or does it ask for attention?"

If it asks for attention, **don't build it**.

---

## 15. One-Sentence Product Definition

> A calm, gesture-driven daily focus instrument that feels like a physical object and helps users focus on what matters today — and nothing else.

---

## 16. Files to Know

| File | Purpose |
|------|---------|
| `src/app/App.tsx` | Main application state and gesture handling |
| `src/app/components/AudioPlayer.tsx` | Audio playback with crossfade |
| `src/app/components/TimerSelector.tsx` | Timer duration selection (hold to select) |
| `src/app/components/HomeWrapper.tsx` | Main UI wrapper |
| `src/app/components/SoundPickerModal.tsx` | Sound selection modal |
| `src/imports/Home-7-86.tsx` | Main Home UI (Figma generated) |
| `src/styles/tailwind.css` | Tailwind configuration |
| `src/styles/theme.css` | Theme variables |

---

## 17. Asset Requirements

### Audio Files (`/public/assets/`)
- `mood-0.mp3` through `mood-3.mp3`
- Format: MP3, 128-192 kbps
- Style: Ambient, atmospheric, loopable

### Video Files (`/public/assets/`)
- `mood-0.mp4` through `mood-3.mp4`
- Format: MP4 (H.264)
- Resolution: 1920x1080+
- Style: Slow, abstract, seamlessly loopable

---

## Summary for AI Agents

When working on this codebase:

1. **Read this file first** — Understand the philosophy before coding
2. **Subtract, don't add** — Less is more
3. **Preserve calm** — No busy animations, no attention-grabbing features
4. **Gesture-first** — Hide controls, reveal through interaction
5. **Forget aggressively** — No history, no tracking, no analytics
6. **Ask the north star question** — Does this help focus or ask for attention?

This is a focus instrument, not software. Treat it accordingly.
