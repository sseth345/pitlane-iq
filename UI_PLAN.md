# PitLane IQ — Frontend UI Implementation Plan

## Reference Image
The **first strategy dashboard mockup** is the definitive, approved design target.
All screens derive from that aesthetic. Any deviation from this look is a bug.

---

## 1. Color System (Semantic Meaning)

Every color has a strict job. No color is decorative.

| Token                    | Hex         | Role                                              |
|--------------------------|-------------|----------------------------------------------------|
| `--bg-base`              | `#0A0A0B`   | Page background (deep graphite, NOT pure black)    |
| `--bg-surface`           | `#111113`   | Panel/card backgrounds                             |
| `--bg-elevated`          | `#18181B`   | Elevated panels, hover states                      |
| `--bg-hover`             | `#27272A`   | Row hover, interactive element focus               |
| `--glass-surface`        | `rgba(17,17,19,0.65)` | Restrained glass, reduced 10-15% from earlier |
| `--glass-border`         | `rgba(255,255,255,0.08)` | Subtle panel edge distinction            |
| `--border`               | `#27272A`   | Primary dividers                                   |
| `--border-subtle`        | `#1E1E21`   | Secondary/inner dividers                           |
| `--text-primary`         | `#FAFAFA`   | **WHITE** — Primary analytical data, headers, values |
| `--text-secondary`       | `#A1A1AA`   | Column headers, labels, metadata                   |
| `--text-muted`           | `#52525B`   | Axis labels, timestamps, low-priority text         |
| `--accent`               | `#E10600`   | **RED** — CRITICAL alerts, DANGER, race state, pit alerts |
| `--accent-secondary`     | `#00D2BE`   | **CYAN** — Active telemetry traces ONLY, selected driver lines |
| `--status-critical`      | `#E10600`   | Undercut threat > 75%, VSC/SC flags                |
| `--status-watch`         | `#F59E0B`   | Amber warning, approaching cliff                   |
| `--status-good`          | `#10B981`   | "PIT OPEN", optimal window, safe state             |

### Background Gradient
The page background will have a very subtle diagonal gradient:
```css
background: linear-gradient(135deg, #0A0A0B 0%, #0D0D10 50%, #0A0B0D 100%);
```
This is NOT a dramatic gradient. It's just enough to prevent the "flat black screen" feeling.

---

## 2. Typography

| Usage                | Font             | Weight | Size    |
|----------------------|------------------|--------|---------|
| Page titles          | Outfit           | 600    | 14-16px |
| Section headers      | Inter            | 600    | 13px    |
| Data labels          | Inter            | 500    | 11-12px |
| Table cell data      | JetBrains Mono   | 400    | 11px    |
| Timing/gap values    | JetBrains Mono   | 500    | 12px    |
| Axis labels          | JetBrains Mono   | 400    | 10px    |
| Badges (PIT OPEN)    | Inter            | 600    | 10px    |

---

## 3. Glassmorphism Rules (Reduced 10-15%)

- Glass is used ONLY on the main strategy panels to create depth layering.
- `backdrop-filter: blur(8px)` (down from 12px).
- Glass panels have `border: 1px solid rgba(255,255,255,0.08)`.
- The **Tyre Degradation panel** (bottom-left) has a **white/light background** as a deliberate contrast element (from the reference image).
- No glow effects on panel borders. No bloom. No neon edges.

---

## 4. Strategy Dashboard Layout (Main Screen)

This is the primary view. Derived directly from the reference image.

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: "F1 RACE STRATEGY: {GP} — LAP {X}/{Y}"    [Driver ▾]  │
├──────────┬──────────────────────────────┬───────────────────────┤
│          │                              │  PIT STOP STRATEGY    │
│ DRIVER   │  RACE TIMELINE &             │  OPTIONS              │
│ STANDINGS│  GAP ANALYSIS                │  ─────────────────    │
│ TABLE    │  (Multi-driver gap chart)    │  Opt 1: 25L | M | P1 │
│          │                              │  Opt 2: 34L | S | P3 │
│ 1  VER   │                              │  Alt:   28L | H | P2 │
│ 2  HAM   │                              ├───────────────────────┤
│ 3  NOR   │                              │  LIVE PIT WALL DATA   │
│ ...      │                              │  (scrolling feed)     │
├──────────┼──────────────────────────────┼───────────────────────┤
│          │                              │ STRATEGY RISK &       │
│ TYRE     │  (continued or second chart  │ UNDERCUT THREAT GAUGE │
│ DEGRADATION │ area if needed)           │                       │
│ & LIFE   │                              │  ╭────────╮           │
│          │                              │  │  76%   │  CRITICAL │
│ (WHITE   │                              │  │ GAUGE  │           │
│  BG PANEL)│                             │  ╰────────╯           │
│          │                              │  Gap: -1.85s          │
│          │                              │  Threat: HIGH         │
└──────────┴──────────────────────────────┴───────────────────────┘
```

### 4.1 Driver Standings Table (Left Panel)
- Columns: `#`, `DRIVER`, `TYRES`, `GAP`, `STATUS`
- Rows are compact (28px height).
- Tyre compound shown as a small colored circle with letter (`M`, `S`, `H`).
- GAP values in `JetBrains Mono`, white text, with `+` or `-` prefix.
- STATUS column shows `PIT OPEN` as a green badge or `—` if no action.
- Hover highlights row with `var(--bg-hover)`.

### 4.2 Race Timeline & Gap Analysis (Center)
- **Recharts `LineChart`** with multi-driver gap evolution.
- Y-axis: gap to leader in seconds (e.g., `+1.55s` to `-30.00s`).
- X-axis: lap numbers.
- Each driver trace uses their team color from `DRIVER_TEAMS`.
- Grid lines: `var(--border-subtle)`, dashed.
- Chart background: `var(--bg-surface)`.
- Legend integrated into the chart header, not a separate Recharts legend.

### 4.3 Pit Stop Strategy Options (Top Right)
- 3 rows: `Opt 1`, `Opt 2`, `Alt`.
- Columns: `LAPS`, `TYRE` (compound badge), `PREDICTED POS`.
- Simple, dense table with monospaced values.
- Selected option has a left accent border (cyan or red depending on urgency).

### 4.4 Live Pit Wall Data (Right, Below Options)
- A scrolling feed of timestamped events.
- Format: `18:50  Pit Wall stream...`
- Uses `JetBrains Mono`, `11px`, `var(--text-secondary)`.
- Most recent entry at top.

### 4.5 Tyre Degradation & Life (Bottom Left — WHITE PANEL)
- **This panel deliberately has a white/light background** (`#F5F5F5` or `#FFFFFF`).
- This is the key design contrast element from the reference.
- Shows compound degradation curves (Soft in red, Medium in amber).
- Annotations like `47% @ L18` on the curves.
- Right side shows live tyre state: `28 Laps`, `Soft`, compound badge.
- X-axis: lap numbers. Y-axis: tyre life percentage.

### 4.6 Strategy Risk & Undercut Threat Gauge (Bottom Right)
- A **semicircular SVG gauge** from 0 to 100.
- Arc color transitions: Green (0-35) → Amber (35-60) → Red (60-100).
- Center number displayed large: `76%` in `JetBrains Mono 700`.
- Label below: `CRITICAL` in red, `WATCH` in amber, or `SAFE` in green.
- Below the gauge: 3 compact metrics in a row:
  - `Gap: -1.85s`
  - `Pit Exit Δ: 21.2s`
  - `Threat: HIGH`

---

## 5. Loading Screen

- Full screen, `var(--bg-base)` background with the subtle gradient.
- Center: An SVG outline of an F1 car (simple, geometric, ~200px wide).
  - The car's outline **strokes in** using a Framer Motion `pathLength` animation.
  - Color: `var(--accent-secondary)` (cyan), transitioning to white once fully drawn.
- Below the car: A compact progress section:
  - Text: `Initializing FastF1 Session...` in `Inter 500, 13px, white`.
  - A thin horizontal progress bar (2px height, cyan fill on dark track).
  - Below: A scrolling monospace log showing actual loading steps:
    - `[OK] FastF1 cache connected`
    - `[OK] Session 2024_5_R loaded (57 laps, 20 drivers)`
    - `[..] Computing tyre degradation model...`
  - Log text in `JetBrains Mono, 10px, var(--text-muted)`.

---

## 6. Replay Screen

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: "RACE REPLAY: {GP} — LAP {X}/{Y}"    [▶ ⏸ ⏩] Speed  │
├─────────────────────────────────────────────┬───────────────────┤
│                                             │ STANDINGS         │
│  GAP EVOLUTION CHART                        │ (compact table)   │
│  (Primary view — same style as Strategy)    │                   │
│                                             │ 1. VER  +0.0s     │
│                                             │ 2. HAM  +0.6s     │
│                                             │ 3. NOR  +1.2s     │
│                                             ├───────────────────┤
│                                             │ STRATEGY INTEL    │
│                                             │ (pit windows,     │
│                                             │  tyre state)      │
├──────────────────┬──────────────────────────┴───────────────────┤
│  TRACK MAP       │  EVENT STREAM                                │
│  (small, muted,  │  L34  ⚠ HAM pits → MEDIUM                   │
│   supporting)    │  L33  🏁 NOR sets fastest lap 1:29.432       │
│                  │  L31  ↗ PER overtakes ALO (P5→P4)            │
│                  │  L28  🔴 Safety Car deployed                  │
└──────────────────┴──────────────────────────────────────────────┘
```

- **Top**: Playback controls (Play/Pause, speed selector 1x/2x/4x). Header shows current lap.
- **Center-left**: Gap evolution chart (the same dense, analytical chart from Strategy view but now animated with a vertical "current lap" cursor).
- **Right-top**: Live standings table (compact, updating per frame).
- **Right-mid**: Strategy intelligence (pit windows, tyre compound/age).
- **Bottom-left**: Small track map with driver dots. Muted, NOT the hero.
- **Bottom-right**: Dense event stream. Each event shows lap, icon, description. Red for warnings, white for standard events, green for gains.

---

## 7. Shadow Mode / Debrief Screen

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: "SHADOW INTELLIGENCE: {GP}"                            │
├──────────────────────────────────┬──────────────────────────────┤
│                                  │                              │
│  AI STRATEGY CHAT                │  TELEMETRY CONTEXT           │
│                                  │                              │
│  ┌─────────────────────────┐     │  (Mini gap chart)            │
│  │ Why did HAM pit early?  │     │  (Mini tyre deg chart)       │
│  └─────────────────────────┘     │  (Current standings table)   │
│                                  │                              │
│  ┌─────────────────────────┐     │                              │
│  │ AI: Hamilton's deg rate │     │                              │
│  │ was 0.12s/lap vs NOR's │     │                              │
│  │ 0.06s/lap. The undercut │     │                              │
│  │ window closed at L22.   │     │                              │
│  └─────────────────────────┘     │                              │
│                                  │                              │
│  [Ask a question...]             │                              │
├──────────────────────────────────┴──────────────────────────────┤
│  SHADOW FEED (live alerts timeline)                              │
│  L34 ⚠ CRITICAL: Undercut threat from NOR — score 76%           │
│  L31 ℹ Tyre cliff approaching for HAM (est. L36)                │
└─────────────────────────────────────────────────────────────────┘
```

- **Left**: Chat interface. Sharp borders, no rounded bubbles. User messages right-aligned, AI responses left-aligned. Monospaced data within responses.
- **Right**: Contextual telemetry panels that update based on what the AI is discussing.
- **Bottom**: A dense, scrolling Shadow Feed showing real-time intelligence alerts. Red for critical, amber for watch, white for info.

---

## 8. Component File Plan

### New Files to Create
| File | Purpose |
|------|---------|
| `src/lib/utils.ts` | `cn()` utility function (clsx + tailwind-merge) |
| `src/components/ui/Card.tsx` | Glass panel with sharp borders |
| `src/components/ui/Badge.tsx` | Status badges (PIT OPEN, CRITICAL, WATCH) |
| `src/components/ui/ThreatGauge.tsx` | SVG semicircular gauge |
| `src/components/ui/ProgressBar.tsx` | Thin animated progress bar |
| `src/components/Loader.tsx` | Full-screen loading with SVG car + log |
| `src/components/strategy/DriverTable.tsx` | Left-panel standings |
| `src/components/strategy/GapChart.tsx` | Center gap evolution chart |
| `src/components/strategy/PitOptions.tsx` | Top-right pit strategy table |
| `src/components/strategy/PitWallFeed.tsx` | Right scrolling event feed |
| `src/components/strategy/TyreDegPanel.tsx` | Bottom-left white panel |
| `src/components/strategy/UndercutGauge.tsx` | Bottom-right threat gauge |
| `src/components/replay/ReplayView.tsx` | Main replay layout |
| `src/components/replay/EventStream.tsx` | Bottom event feed |
| `src/components/replay/TrackMap.tsx` | Small supporting track visual |
| `src/components/replay/PlaybackControls.tsx` | Play/pause/speed |
| `src/components/chat/ShadowView.tsx` | Main shadow/debrief layout |
| `src/components/chat/ChatInterface.tsx` | AI chat panel |
| `src/components/chat/ShadowFeed.tsx` | Bottom alert timeline |

### Files to Modify
| File | Changes |
|------|---------|
| `src/index.css` | Finalize design tokens, add subtle bg gradient, sharpen borders |
| `src/App.tsx` | Add Loader state, wire new views |
| `src/components/layout/AppShell.tsx` | Replace emoji icons with lucide-react, refine sidebar |
| `src/components/strategy/StrategyView.tsx` | Complete rewrite to match the 6-panel layout |
| `src/stores/sessionStore.ts` | Add strategy data state |

---

## 9. Animation Rules (Framer Motion)

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Page transitions | `opacity: 0→1, y: 8→0` | 200ms | `ease-out` |
| Card mount | `opacity: 0→1, scale: 0.98→1` | 250ms | `spring(0.5)` |
| Gauge needle | `rotate: 0→value` | 800ms | `spring(0.6, 0.8)` |
| Chart data update | Re-render with Recharts `animationDuration={500}` | 500ms | default |
| Loading car SVG | `pathLength: 0→1` | 2000ms | `ease-in-out` |
| Row hover | `backgroundColor transition` | 150ms | `ease` |
| Badge pulse (CRITICAL) | `scale: 1→1.05→1` | 1500ms | `repeat: Infinity` |

**Rules:**
- No bouncy spring animations. Everything is precise and quick.
- Animations are functional (guiding attention) not decorative.
- Loading car animation is the ONE creative/expressive moment. Everything else is restrained.

---

## 10. Execution Order

1. `index.css` — Final design token pass + bg gradient
2. `src/lib/utils.ts` — cn() utility
3. `src/components/ui/*` — Card, Badge, ThreatGauge, ProgressBar
4. `src/components/Loader.tsx` — Loading screen with SVG car
5. `src/components/strategy/*` — Full 6-panel Strategy view rewrite
6. `src/components/layout/AppShell.tsx` — Sidebar with lucide icons
7. `src/App.tsx` — Wire everything up
8. `src/components/replay/*` — Replay view
9. `src/components/chat/*` — Shadow/Debrief view
10. Final polish pass — spacing, hover states, edge cases
