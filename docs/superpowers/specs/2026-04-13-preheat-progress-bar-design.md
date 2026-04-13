# Preheat Progress Bar Design

**Date:** 2026-04-13

## Overview

Add a 10-segment preheat progress bar below the setpoint temperature display in the oven card. The bar fills left-to-right as the oven heats toward its target temperature, matching the visual indicator on the physical Siemens oven display. Progress is calculated from the actual cavity temperature relative to the setpoint — no dedicated preheat-progress entity is needed.

## Requirements

- Display 10 small blue rectangle segments below the setpoint temperature number.
- Fill N segments based on `actual / setpoint * 10` (rounded, clamped to 0–10).
- Show only during `run` and `pause` operation states.
- Hide when either temperature entity is unavailable or unknown.
- Once actual temp ≥ setpoint all 10 segments remain lit — persistent "ready" indicator while cooking continues.

## Architecture

### `state.ts` — new function `getPreheatBars`

```ts
export function getPreheatBars(hass: HomeAssistant, config: SiemensOvenCardConfig): number | null
```

**Behaviour:**

- Reads `cavity_temp_entity` (actual) and `setpoint_temp_entity` (target).
- Returns `null` if either state is missing, `'unavailable'`, or `'unknown'`.
- Parses both as integers.
- Returns `null` if target is 0 or NaN (avoids divide-by-zero).
- Returns `Math.min(10, Math.round((actual / target) * 10))` — a value 0–10.

The function is stateless and pure — the caller gates on operation state.

### `siemens-oven-card.ts` — new method `_renderPreheatBar`

```ts
private _renderPreheatBar(opState: OperationState): TemplateResult | typeof nothing
```

**Behaviour:**

- Returns `nothing` if `opState` is not `'run'` or `'pause'`.
- Calls `getPreheatBars(this.hass, this._config)`.
- Returns `nothing` if result is `null`.
- Renders a `<div class="preheat-bars">` containing 10 `<div class="preheat-bar">` elements.
- First N bars get class `preheat-bar-active`; remaining bars get `preheat-bar-inactive`.

### `_renderSetpoint` update

Wraps the existing setpoint value and the new `_renderPreheatBar` call in a column flex container so the bar appears directly below the temperature number.

## Styles

| Class | Property | Value |
|---|---|---|
| `.preheat-bars` | display | flex |
| `.preheat-bars` | gap | 3px |
| `.preheat-bars` | margin-top | 4px |
| `.preheat-bar` | width | 10px |
| `.preheat-bar` | height | 6px |
| `.preheat-bar` | border-radius | 2px |
| `.preheat-bar-active` | background | #009fe3 |
| `.preheat-bar-active` | filter | drop-shadow(0 0 4px rgba(0,159,227,0.6)) |
| `.preheat-bar-inactive` | background | #1a3a4a |

## Visibility Rules

| Operation state | Actual temp | Result |
|---|---|---|
| `inactive`, `finished`, etc. | any | hidden |
| `run` or `pause` | unavailable/unknown | hidden |
| `run` or `pause` | valid, actual < setpoint | N bars lit (1–9) |
| `run` or `pause` | actual ≥ setpoint | all 10 bars lit |

## Files Changed

- `src/state.ts` — add `getPreheatBars` function
- `src/siemens-oven-card.ts` — add `_renderPreheatBar` method, update `_renderSetpoint`, add CSS classes
