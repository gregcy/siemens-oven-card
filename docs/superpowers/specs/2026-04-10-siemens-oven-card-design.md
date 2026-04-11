# Siemens Oven Card — Design Spec

**Date:** 2026-04-10
**Updated:** 2026-04-11 (live sensor data confirmed — all three running states verified)
**Status:** Approved

---

## Overview

A standalone Home Assistant Lovelace custom card for Siemens ovens connected via the Home Connect integration. The card displays the oven's physical appearance, current heating program icon, and a time/status display, matching the aesthetic of a real oven control panel.

Designed as a proper custom Lovelace element (Web Component) for distribution via HACS, with zero manual setup beyond renaming entity IDs.

---

## Repository

- **New standalone repo:** `siemens-oven-card` (separate from the LG washer/dryer repo, which inspired the visual concept)
- **Target appliance:** Siemens HB676G5S6 (expected to work on any Home Connect oven)
- **Distribution:** HACS Frontend store

---

## Architecture

### Technology Stack

| Tool | Purpose |
|------|---------|
| LitElement 3 | Web component base — reactive properties, shadow DOM, templating |
| TypeScript 5 | Type safety for HA entity interfaces and card config |
| Rollup + Terser | Bundles to single `dist/siemens-oven-card.js` (ES2022 output) |

### Repository Structure

```
siemens-oven-card/
├── src/
│   ├── siemens-oven-card.ts    # main card LitElement
│   ├── editor.ts               # visual config editor (LovelaceCardEditor)
│   └── types.ts                # TypeScript interfaces
├── dist/                       # ← HACS installs everything in this directory
│   ├── siemens-oven-card.js    # compiled + minified output
│   └── images/
│       ├── oven-bg.png         # oven background image (960×400px)
│       ├── hot-air.png
│       ├── top-bottom.png
│       ├── hot-air-eco.png
│       ├── top-bottom-eco.png
│       ├── hot-air-grill.png
│       ├── pizza.png
│       ├── slow-cook.png
│       ├── bottom-heat.png
│       ├── keep-warm.png
│       ├── preheat-ovenware.png
│       ├── frozen.png
│       └── sabbath.png
├── hacs.json
├── package.json
├── rollup.config.js
├── tsconfig.json
└── README.md
```

### HACS Installation Experience

1. HACS → Frontend → search "Siemens Oven Card" → Download
   - Installs `siemens-oven-card.js` + all images automatically to `/hacsfiles/siemens-oven-card/`
2. Add card to dashboard, configure entity IDs (GUI editor or YAML)
3. Done — no `configuration.yaml` editing, no HA restart, no manual file copying

Image paths within the card reference `/hacsfiles/siemens-oven-card/images/<filename>.png`.

---

## Visual Layout

The card is a single component rendered as a custom element. Layout is three zones in a horizontal strip, with a conditional details row below.

### Main Card (fixed height ~160px)

```
┌─────────────────────────┬───────────────────┬──────────────┐
│                         │                   │              │
│     Zone 1 (45%)        │   Zone 2 (30%)    │  Zone 3(25%) │
│     Oven image          │   Program icon    │  Timer       │
│     oven-bg.png         │   + label         │  hh:mm       │
│                         │                   │              │
│                         ├───────────────────┴──────────────┤
│                         │  Progress bar (full right width) │
└─────────────────────────┴──────────────────────────────────┘
```

- **Zone 1:** Static oven background image (`oven-bg.png`, 960×400px PNG)
- **Zone 2:** Program icon (PNG from `dist/images/`) + program name label below. Green tint when running. Hidden when `inactive`/`unknown`.
- **Zone 3:** 7-segment style `hh:mm` timer display with a label beneath (`remaining` or `elapsed`)
- **Progress bar:** Thin bar spanning full width of the right panel (Zones 2+3). Visible **only when `program_progress` is 0–99**. Hidden when `100`, `unavailable`, or `unknown`.

### Conditional Details Row

Shown below the main card when `operation_state` is `run` or `pause`. Hidden otherwise.

Contains:
- Cavity temperature (`sensor.oven_current_oven_cavity_temperature`)
- Program progress % (only shown when value is 0–99)
- Door state (`sensor.oven_door`)

---

## State Logic

### Confirmed Sensor Behaviour (live testing on HB676G5S6)

| Scenario | `operation_state` | `pre_heat_finished` | `remaining_time` | `program_progress` | cavity temp |
|---|---|---|---|---|---|
| Off/idle | `inactive` | — | `unavailable` | `unavailable` | 60°C (ambient) |
| Preheating, no timer | `run` | `off` | `unknown` | `100` | rising |
| Preheating, with timer | `run` | `off` | valid timestamp | 0–99 | rising |
| Cooking, with timer | `run` | `off` | valid timestamp | 0–99 | at/above setpoint |
| Cooking, no timer | `run` | `off` | `unknown` | `100` | at/above setpoint |

**Key findings from live data:**
- The oven never enters `ready` state — it goes directly to `run`
- `sensor.oven_pre_heat_finished` stays `off` throughout ALL running states (preheating AND cooking) — not usable for preheat detection
- `sensor.oven_program_progress` = `100` whenever no timer is set (meaningless); reports real 0–99 when a timer is active
- `number.oven_setpoint_temperature` stays `unavailable` in all running states — removed from card
- **Preheat cannot be distinguished from cooking** with available sensors — the design uses a single unified "running" state

### Operation State Table

| State | Zone 2 (Icon) | Zone 3 (Timer) | Progress Bar | Details Row |
|-------|--------------|----------------|--------------|-------------|
| `inactive` | Hidden | `--:--` (dim) | Hidden | Hidden |
| `run` + remaining time valid | Program icon, green tint | Remaining `hh:mm`, label: "remaining" | Shown (green, if progress 0–99) | Shown |
| `run` + remaining time invalid | Program icon, green tint | Elapsed `hh:mm`, label: "elapsed" | Hidden (progress = 100) | Shown |
| `pause` | Program icon, amber tint | Timer display frozen, label: "paused" | Shown if progress 0–99, frozen + dimmed | Shown |
| `finished` | Hidden | `--:--` (dim) | Hidden | Hidden |
| `error` / `actionrequired` | Warning icon (red ⚠) | `--:--` | Hidden | Hidden |
| `aborting` | Hidden | `--:--` (dim) | Hidden | Hidden |

### Timer Calculation

**Remaining time** — when `sensor.oven_remaining_program_time` is a future ISO 8601 timestamp:
```
remaining_seconds = finish_timestamp - now()
display = floor(remaining_seconds / 3600) + ":" + pad(floor((remaining_seconds % 3600) / 60))
label = "remaining"
```

**Elapsed time** — when `remaining_program_time` is `unavailable` or `unknown` (no timer set):
```
elapsed_seconds = now() - sensor.oven_operation_state.last_changed
display = floor(elapsed_seconds / 3600) + ":" + pad(floor((elapsed_seconds % 3600) / 60))
label = "elapsed"
```

The card refreshes every 30 seconds via a `setInterval` so both displays stay accurate.

### Progress Bar

- Source: `sensor.oven_program_progress`
- **Show only when value is an integer in range 0–99**
- Value of `100` means no timer was set — treated as hidden (not meaningful progress)
- `unavailable` or `unknown` — hidden
- Color: green gradient (`#3a8f00` → `#8df427`)
- Pause state: bar frozen at last value, 50% opacity

### Program Icon Mapping

Maps `select.oven_active_program` state value to icon filename:

| Entity State Value | Icon File | Display Label |
|---|---|---|
| `cooking_oven_program_heating_mode_hot_air` | `hot-air.png` | Hot Air |
| `cooking_oven_program_heating_mode_top_bottom_heating` | `top-bottom.png` | Top / Bottom |
| `cooking_oven_program_heating_mode_hot_air_eco` | `hot-air-eco.png` | Hot Air Eco |
| `cooking_oven_program_heating_mode_top_bottom_heating_eco` | `top-bottom-eco.png` | Top / Bottom Eco |
| `cooking_oven_program_heating_mode_hot_air_grilling` | `hot-air-grill.png` | Hot Air Grill |
| `cooking_oven_program_heating_mode_pizza_setting` | `pizza.png` | Pizza |
| `cooking_oven_program_heating_mode_slow_cook` | `slow-cook.png` | Slow Cook |
| `cooking_oven_program_heating_mode_bottom_heating` | `bottom-heat.png` | Bottom Heat |
| `cooking_oven_program_heating_mode_keep_warm` | `keep-warm.png` | Keep Warm |
| `cooking_oven_program_heating_mode_preheat_ovenware` | `preheat-ovenware.png` | Preheat Ovenware |
| `cooking_oven_program_heating_mode_frozen_heatup_special` | `frozen.png` | Frozen |
| `cooking_oven_program_heating_mode_sabbath_programme` | `sabbath.png` | Sabbath |

If state is `unknown`/`unavailable` or not in the map: icon hidden.

---

## Card Configuration

### YAML

```yaml
type: custom:siemens-oven-card

# Required — rename to match your oven entities
operation_state_entity: sensor.oven_operation_state
active_program_entity: select.oven_active_program
remaining_time_entity: sensor.oven_remaining_program_time
cavity_temp_entity: sensor.oven_current_oven_cavity_temperature
program_progress_entity: sensor.oven_program_progress
door_entity: sensor.oven_door

# Optional
name: Oven
resources_path: /hacsfiles/siemens-oven-card  # default — override for manual installs
```

### `resources_path` — HACS vs manual install

All asset paths (images, font) are constructed as `${resources_path}/images/<file>.png`.

| Install method | `resources_path` value | Files go in |
|---|---|---|
| HACS (default) | `/hacsfiles/siemens-oven-card` (omit from config) | Installed automatically by HACS |
| Manual | `/local/siemens-oven-card` (set explicitly) | `config/www/siemens-oven-card/` |

**Manual install steps:**
1. Copy `dist/siemens-oven-card.js` → `config/www/siemens-oven-card.js`
2. Copy `dist/images/` → `config/www/siemens-oven-card/images/`
3. Copy `dist/fonts/` → `config/www/siemens-oven-card/fonts/`
4. Add `/local/siemens-oven-card.js` as a Lovelace resource (Settings → Dashboards → Resources)
5. Add `resources_path: /local/siemens-oven-card` to the card config

### TypeScript Interface

```typescript
interface SiemensOvenCardConfig {
  // Required entity IDs — rename to match your oven
  operation_state_entity: string;
  active_program_entity: string;
  remaining_time_entity: string;
  cavity_temp_entity: string;
  program_progress_entity: string;
  door_entity: string;
  // Optional
  name?: string;
  resources_path?: string;  // default: '/hacsfiles/siemens-oven-card'
}
```

### Visual Editor

The card implements `LovelaceCardEditor` so users can configure all entity fields via the HA GUI without touching YAML. The editor presents labelled entity picker fields for each required entity, an optional name field, and an optional resources path field for manual installs.

---

## Images

All images are provided by the developer (not auto-generated):

| File | Spec |
|------|------|
| `oven-bg.png` | 960×400px, PNG, RGBA. Oven front-facing photo, appliance on left ~50% of frame, dark/neutral background on right |
| Program icons (×12) | PNG, RGBA, consistent size (recommend 128×128px). Match the physical icons shown on the HB676G5S6 oven display |

Images live in `dist/images/` and are committed to the repo so they are included in HACS releases automatically.

---

## Entities Used

| Entity | Required | Notes |
|--------|----------|-------|
| `sensor.oven_operation_state` | Yes | States: `inactive`, `run`, `pause`, `finished`, `error`, `actionrequired`, `aborting`. Never enters `ready` on HB676G5S6. |
| `select.oven_active_program` | Yes | Values: `cooking_oven_program_heating_mode_*`. Reports correctly while running. |
| `sensor.oven_remaining_program_time` | Yes | ISO 8601 future timestamp when timer active; `unknown` when no timer set. |
| `sensor.oven_current_oven_cavity_temperature` | Yes | Float °C, reliable in all states. |
| `sensor.oven_program_progress` | Yes | 0–99 when timer active and running; `100` when no timer (hidden); `unavailable` when idle. |
| `sensor.oven_door` | Yes | States: `open`, `closed`, `locked`. |

**Excluded from original design (confirmed unavailable/unreliable):**
- `number.oven_setpoint_temperature` — `unavailable` in all running states
- `sensor.oven_pre_heat_finished` — stays `off` throughout all running states; cannot distinguish preheating from cooking

---

## Out of Scope

- Controlling the oven (setting programs, temperatures) — display only
- Supporting non-Home Connect oven integrations
- Supporting other Siemens/Bosch appliance types in this repo
- Alarm clock display (`number.oven_alarm_clock`) — not part of initial card
- Preheat detection — no reliable sensor signal available on this model

---

## HACS Manifest (`hacs.json`)

```json
{
  "name": "Siemens Oven Card",
  "render_readme": true,
  "content_in_root": false
}
```

HACS will install everything in `dist/` (including `dist/images/`) to `/hacsfiles/siemens-oven-card/`.
