# Siemens Oven Card — Design Spec

**Date:** 2026-04-10
**Updated:** 2026-04-11 (migrated to home-connect-hass alternative integration — entity IDs and state value formats updated)
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
- **Required HA integration:** [home-connect-hass](https://github.com/ekutner/home-connect-hass) (alternative integration — the official Home Connect integration is missing grill programs and has unreliable setpoint temp)

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
- Setpoint temperature (`sensor.siemens_hb676g5s6_68a40e6a233e_cooking_oven_option_setpointtemperature`)
- Cavity temperature (`sensor.siemens_hb676g5s6_68a40e6a233e_cooking_oven_status_currentcavitytemperature`)
- Program progress % (only shown when value is 0–99)
- Door state (`binary_sensor.siemens_hb676g5s6_68a40e6a233e_bsh_common_status_doorstate`, `off` = closed, `on` = open)

---

## State Logic

### Confirmed Sensor Behaviour (live testing on HB676G5S6 with home-connect-hass)

All entity IDs use the prefix `siemens_hb676g5s6_68a40e6a233e` (the device serial). Users rename these to match their own device.

Operation state values are full BSH enum strings: `BSH.Common.EnumType.OperationState.Run`. The card extracts the last segment and lowercases it (`Run` → `run`) for internal state comparison.

Program values are CamelCase with dots: `Cooking.Oven.Program.HeatingMode.HotAir`. Used directly as icon map keys.

| Scenario | `operation_state` | `remaining_time` | `program_progress` | `elapsed_time` | setpoint temp |
|---|---|---|---|---|---|
| Off/idle | `...Inactive` | absent | absent | absent | absent |
| Preheating/cooking, no timer | `...Run` | past timestamp | `100` | counting up (`h:mm`) | valid (e.g. `160`) |
| Preheating/cooking, with timer | `...Run` | future ISO timestamp | `0–99` | counting up (`h:mm`) | valid (e.g. `160`) |

**Key findings from live data:**
- The oven never enters `ready` state — it goes directly to `Run`
- `program_progress` = `100` whenever no timer is set (meaningless sentinel); reports real 0–99 when a timer is active
- `remaining_program_time` always exists when running — detect "no timer" by `progress === 100` OR timestamp is in the past
- `elapsed_program_time` reports `h:mm` (e.g. `0:03`) directly — no calculation needed
- `setpoint_temperature` works reliably in all running states (fixed vs official integration)
- Door is a `binary_sensor` — `off` = closed, `on` = open (no `locked` state exposed)
- **Preheat cannot be distinguished from cooking** with available sensors — the design uses a single unified "running" state
- `Cooking.Oven.Program.HeatingMode.GrillLargeArea` and `GrillSmallArea` are not in the integration's program selector list but are correctly reported by `active_program` sensor when selected on the physical oven

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

**Remaining time** — when `program_progress` is 0–99 (timer active):
```
remaining_seconds = finish_timestamp - now()   // finish_timestamp from remaining_program_time entity
display = floor(remaining_seconds / 3600) + ":" + pad(floor((remaining_seconds % 3600) / 60))
label = "remaining"
```

**Elapsed time** — when `program_progress` is 100 (no timer set):
```
// Use elapsed_program_time entity directly — reports h:mm (e.g. "0:03")
display = normalize to hh:mm (pad hours to 2 digits)
label = "elapsed"
```

The card refreshes every 30 seconds via a `setInterval` so remaining time stays accurate.

### Progress Bar

- Source: `sensor.oven_program_progress`
- **Show only when value is an integer in range 0–99**
- Value of `100` means no timer was set — treated as hidden (not meaningful progress)
- `unavailable` or `unknown` — hidden
- Color: green gradient (`#3a8f00` → `#8df427`)
- Pause state: bar frozen at last value, 50% opacity

### Program Icon Mapping

Maps `sensor.siemens_hb676g5s6_68a40e6a233e_active_program` state value to icon filename:

| Entity State Value | Icon File | Display Label |
|---|---|---|
| `Cooking.Oven.Program.HeatingMode.HotAir` | `hot-air.png` | Hot Air |
| `Cooking.Oven.Program.HeatingMode.TopBottomHeating` | `top-bottom.png` | Top / Bottom |
| `Cooking.Oven.Program.HeatingMode.HotAirEco` | `hot-air-eco.png` | Hot Air Eco |
| `Cooking.Oven.Program.HeatingMode.TopBottomHeatingEco` | `top-bottom-eco.png` | Top / Bottom Eco |
| `Cooking.Oven.Program.HeatingMode.HotAirGrilling` | `hot-air-grill.png` | Hot Air Grill |
| `Cooking.Oven.Program.HeatingMode.PizzaSetting` | `pizza.png` | Pizza |
| `Cooking.Oven.Program.HeatingMode.SlowCook` | `slow-cook.png` | Slow Cook |
| `Cooking.Oven.Program.HeatingMode.BottomHeating` | `bottom-heat.png` | Bottom Heat |
| `Cooking.Oven.Program.HeatingMode.KeepWarm` | `keep-warm.png` | Keep Warm |
| `Cooking.Oven.Program.HeatingMode.PreheatOvenware` | `preheat-ovenware.png` | Preheat Ovenware |
| `Cooking.Oven.Program.HeatingMode.FrozenHeatupSpecial` | `frozen.png` | Frozen |
| `Cooking.Oven.Program.HeatingMode.SabbathProgramme` | `sabbath.png` | Sabbath |
| `Cooking.Oven.Program.HeatingMode.GrillLargeArea` | `grill-large.png` | Grill Large Area |
| `Cooking.Oven.Program.HeatingMode.GrillSmallArea` | `grill-small.png` | Grill Small Area |

If state is `unknown`/`unavailable` or not in the map: icon hidden.

Note: `GrillLargeArea` and `GrillSmallArea` do not appear in the integration's program selector but are correctly reported by the `active_program` sensor when selected physically on the oven.

---

## Card Configuration

### YAML

```yaml
type: custom:siemens-oven-card

# Required — rename the prefix to match your oven's device serial
operation_state_entity: sensor.siemens_hb676g5s6_68a40e6a233e_bsh_common_status_operationstate
active_program_entity: sensor.siemens_hb676g5s6_68a40e6a233e_active_program
remaining_time_entity: sensor.siemens_hb676g5s6_68a40e6a233e_bsh_common_option_remainingprogramtime
elapsed_time_entity: sensor.siemens_hb676g5s6_68a40e6a233e_bsh_common_option_elapsedprogramtime
cavity_temp_entity: sensor.siemens_hb676g5s6_68a40e6a233e_cooking_oven_status_currentcavitytemperature
setpoint_temp_entity: sensor.siemens_hb676g5s6_68a40e6a233e_cooking_oven_option_setpointtemperature
program_progress_entity: sensor.siemens_hb676g5s6_68a40e6a233e_bsh_common_option_programprogress
door_entity: binary_sensor.siemens_hb676g5s6_68a40e6a233e_bsh_common_status_doorstate

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
  // Required entity IDs — rename prefix to match your oven's device serial
  operation_state_entity: string;
  active_program_entity: string;
  remaining_time_entity: string;
  elapsed_time_entity: string;
  cavity_temp_entity: string;
  setpoint_temp_entity: string;
  program_progress_entity: string;
  door_entity: string;  // binary_sensor — off=closed, on=open
  // Optional
  name?: string;
  resources_path?: string;  // default: '/hacsfiles/siemens-oven-card'
}
```

### Visual Editor

The card implements `LovelaceCardEditor` so users can configure all entity fields via the HA GUI without touching YAML. The editor presents labelled entity picker fields for each required entity (8 fields), an optional name field, and an optional resources path field for manual installs.

---

## Images

All images are provided by the developer (not auto-generated):

| File | Spec |
|------|------|
| `oven-bg.png` | 960×400px, PNG, RGBA. Oven front-facing photo, appliance on left ~50% of frame, dark/neutral background on right |
| Program icons (×14) | SVG or PNG, RGBA, consistent size (recommend 128×128px). White fill, transparent background — card applies green/amber tint via CSS. Match the physical icons shown on the HB676G5S6 oven display |

Images live in `dist/images/` and are committed to the repo so they are included in HACS releases automatically.

---

## Entities Used

All entities use prefix `sensor.siemens_hb676g5s6_68a40e6a233e_` or `binary_sensor.siemens_hb676g5s6_68a40e6a233e_`. Users rename to match their device serial.

| Entity | Required | Notes |
|--------|----------|-------|
| `sensor...bsh_common_status_operationstate` | Yes | Full enum: `BSH.Common.EnumType.OperationState.Run` etc. Card extracts last segment + lowercases. Never enters `Ready` on HB676G5S6. |
| `sensor...active_program` | Yes | Full enum: `Cooking.Oven.Program.HeatingMode.HotAir` etc. Used directly as icon map keys. |
| `sensor...bsh_common_option_remainingprogramtime` | Yes | ISO 8601 future timestamp when timer active; past timestamp when no timer set. |
| `sensor...bsh_common_option_elapsedprogramtime` | Yes | `h:mm` format (e.g. `0:03`). Counts from program start. Used for elapsed display when no timer set. |
| `sensor...cooking_oven_status_currentcavitytemperature` | Yes | Float °C, reliable in all states. |
| `sensor...cooking_oven_option_setpointtemperature` | Yes | Integer °C. Reliable in all running states (fixed vs official integration). |
| `sensor...bsh_common_option_programprogress` | Yes | 0–99 when timer active; `100` when no timer (hidden); absent when idle. |
| `binary_sensor...bsh_common_status_doorstate` | Yes | `off` = closed, `on` = open. No `locked` state exposed. |

**Excluded:**
- `sensor.oven_pre_heat_finished` — not exposed by home-connect-hass; preheat detection not possible

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
