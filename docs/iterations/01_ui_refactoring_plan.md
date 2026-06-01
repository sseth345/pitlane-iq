# Component Refactoring & Data Prep Plan

The goal of this phase is to break down our pixel-perfect, but monolithic, `StrategyView.tsx` into clean, isolated components. This is a crucial prerequisite before we connect the backend API and real FastF1 data.

## Why are we doing this first?
If we try to wire up live WebSocket data or complex API state into a single 500+ line file, it will become a tangled, unmaintainable mess. By separating the UI into discrete components, we can cleanly define exactly what data each piece needs (e.g., the `GapChart` only cares about lap data, the `ThreatGauge` only cares about the threat score).

## Proposed Changes

We will extract the hardcoded sections from `StrategyView.tsx` into the following dedicated files:

### `src/components/strategy/`

#### `DriverTable.tsx`
- Will handle the left column (Driver standings, Tyre, Gap, Status).
- **Expected Data Props:** Array of Driver objects.

#### `GapChart.tsx`
- Will handle the Recharts Race Timeline & Gap Analysis.
- **Expected Data Props:** Historical lap data array, selected drivers.

#### `TyreDegPanel.tsx`
- Will handle the bottom-left white panel with the degradation curves.
- **Expected Data Props:** Tyre compound life data.

#### `ThreatGauge.tsx`
- Will house the semicircular SVG gauge and immediate threat metrics.
- **Expected Data Props:** Threat score (0-100), Gap time, Pit Exit Delta.

#### `RightSidebar.tsx`
- Will contain the Pit Stop Options, Live Pit Wall Feed, and Lift Stop Analysis panels to keep the main view clean.
- **Expected Data Props:** Pit options array, Pit wall event feed array.

#### `StrategyView.tsx`
- Will be reduced from 500+ lines to ~50 lines.
- It will act purely as the **Layout Container**, importing the components above and passing the (currently mock, soon-to-be real) data down to them.
