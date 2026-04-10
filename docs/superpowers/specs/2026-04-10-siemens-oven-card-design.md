# Siemens Oven Card — Design Spec

**Date:** 2026-04-10
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

The card is a single `picture-elements`-style component rendered as a custom element. Layout is three zones in a horizontal strip, with a conditional details row below.

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
- **Zone 2:** Program icon (PNG from `dist/images/`) + program name label below. Hidden when `inactive`/`unknown`.
- **Zone 3:** 7-segment style `hh:mm` timer display with a label beneath (`remaining`, `elapsed`, `preheating`, or blank)
- **Progress bar:** Thin bar spanning full width of the right panel (Zones 2+3), visible only when `operation_state` is `ready` or `run`. Hidden when inactive/finished/error.

### Conditional Details Row

Shown below the main card when `operation_state` is `ready`, `run`, or `pause`. Hidden otherwise.

Contains:
- Setpoint temperature (`number.oven_setpoint_temperature`)
- Cavity temperature (`sensor.oven_current_oven_cavity_temperature`)
- Program progress % (`sensor.oven_program_progress`, if available)
- Door state (`sensor.oven_door`)

---

## State Logic

### Operation States (`sensor.oven_operation_state`)

| State | Zone 2 (Icon) | Zone 3 (Timer) | Progress Bar | Details Row |
|-------|--------------|----------------|--------------|-------------|
| `inactive` | Hidden | `--:--` (dim) | Hidden | Hidden |
| `ready` (preheating) | Program icon (amber tint) | `--:--` label: "preheating" | Visible, red→amber gradient | Shown |
| `run` + remaining time available | Program icon (green tint) | Remaining `hh:mm`, label: "remaining" | Visible, green gradient | Shown |
| `run` + remaining time unavailable | Program icon (green tint) | Elapsed `hh:mm`, label: "elapsed" | Visible, green gradient (if progress available) | Shown |
| `pause` | Program icon (amber tint) | Timer frozen, label: "paused" | Visible, frozen | Shown |
| `finished` | Hidden | `--:--` (dim) | Hidden | Hidden |
| `error` / `actionrequired` | Warning icon (red) | `--:--` | Hidden | Hidden |
| `aborting` | Hidden | `--:--` (dim) | Hidden | Hidden |

### Timer Calculation

**Remaining time** (`sensor.oven_remaining_program_time` is a future ISO 8601 timestamp):
```
remaining_minutes = (finish_timestamp - now()) / 60
display = floor(remaining_minutes / 60) + ":" + pad(remaining_minutes % 60)
```

**Elapsed time** (when `remaining_program_time` is `unavailable`/`unknown` and `operation_state` is `run`):
```
elapsed_seconds = now() - sensor.oven_operation_state.last_changed
display = floor(elapsed_seconds / 3600) + ":" + pad(floor((elapsed_seconds % 3600) / 60))
```
Note: `last_changed` reflects when `operation_state` last changed to `run`. If the oven transitions through `ready` before `run`, elapsed time resets at that transition — this is the desired behaviour.

### Progress Bar

- Source: `sensor.oven_program_progress` (0–100 integer)
- If sensor is `unavailable` or `unknown`: progress bar is hidden entirely (graceful degradation — works on all models)
- Preheating state (`ready`): red → amber gradient
- Running state (`run`): dark green → bright green gradient
- Pause state: bar frozen at last value, reduced opacity

### Program Icon Mapping

Maps `select.oven_active_program` state value to icon filename:

| Entity State Value | Icon File |
|-------------------|-----------|
| `cooking_oven_program_heating_mode_hot_air` | `hot-air.png` |
| `cooking_oven_program_heating_mode_top_bottom_heating` | `top-bottom.png` |
| `cooking_oven_program_heating_mode_hot_air_eco` | `hot-air-eco.png` |
| `cooking_oven_program_heating_mode_top_bottom_heating_eco` | `top-bottom-eco.png` |
| `cooking_oven_program_heating_mode_hot_air_grilling` | `hot-air-grill.png` |
| `cooking_oven_program_heating_mode_pizza_setting` | `pizza.png` |
| `cooking_oven_program_heating_mode_slow_cook` | `slow-cook.png` |
| `cooking_oven_program_heating_mode_bottom_heating` | `bottom-heat.png` |
| `cooking_oven_program_heating_mode_keep_warm` | `keep-warm.png` |
| `cooking_oven_program_heating_mode_preheat_ovenware` | `preheat-ovenware.png` |
| `cooking_oven_program_heating_mode_frozen_heatup_special` | `frozen.png` |
| `cooking_oven_program_heating_mode_sabbath_programme` | `sabbath.png` |

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
setpoint_temp_entity: number.oven_setpoint_temperature
door_entity: sensor.oven_door

# Optional
name: Oven
resources_path: /hacsfiles/siemens-oven-card  # default — override for manual installs
```

### `resources_path` — HACS vs manual install

All asset paths (images, font) are constructed as `${resources_path}/images/<file>.png`. This makes the card installable in two ways:

| Install method | `resources_path` value | Files go in |
|---|---|---|
| HACS (default) | `/hacsfiles/siemens-oven-card` (default, omit from config) | Installed automatically by HACS |
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
  // Required
  operation_state_entity: string;
  active_program_entity: string;
  remaining_time_entity: string;
  cavity_temp_entity: string;
  program_progress_entity: string;
  setpoint_temp_entity: string;
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
| `sensor.oven_operation_state` | Yes | States: `inactive`, `ready`, `run`, `pause`, `finished`, `error`, `actionrequired`, `aborting` |
| `select.oven_active_program` | Yes | Values: `cooking_oven_program_heating_mode_*` |
| `sensor.oven_remaining_program_time` | Yes | ISO 8601 future timestamp when active, `unavailable` when idle |
| `sensor.oven_current_oven_cavity_temperature` | Yes | Integer °C, reliable even when idle |
| `sensor.oven_program_progress` | Yes | 0–100 integer when active; card hides bar gracefully if `unavailable` |
| `number.oven_setpoint_temperature` | Yes | `unavailable` when idle — shown in details row when active |
| `sensor.oven_door` | Yes | States: `open`, `closed`, `locked` |

---

## Known Unknowns

- **`sensor.oven_program_progress` availability:** Community reports suggest this sensor may stay `unavailable` on some models/firmware even while running. The card handles this gracefully by hiding the progress bar if the sensor is unavailable. To be confirmed by running the oven and checking the sensor value.
- **Setpoint temperature units:** Assumed °C. If HA returns a different unit, the display label may need updating.

---

## Out of Scope

- Controlling the oven (setting programs, temperatures) — display only
- Supporting non-Home Connect oven integrations
- Supporting other Siemens/Bosch appliance types in this repo
- Alarm clock display (`number.oven_alarm_clock`) — not part of initial card

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
