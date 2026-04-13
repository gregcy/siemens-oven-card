# Preheat Progress Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display a 10-segment preheat progress bar below the setpoint temperature, filling left-to-right as the oven heats toward its target temperature.

**Architecture:** A new `getPreheatBars` pure function in `state.ts` calculates how many of the 10 segments should be lit based on actual vs setpoint temperature. A new `_renderPreheatBar` method in the card renders the segments, called from within `_renderSetpoint`. Rendering is gated on `run`/`pause` operation states; once the oven reaches temperature all 10 remain lit.

**Tech Stack:** TypeScript, Lit (LitElement, html, css), Vitest

---

## File Map

| File | Change |
|---|---|
| `src/state.ts` | Add `getPreheatBars` export |
| `src/siemens-oven-card.ts` | Add `_renderPreheatBar`, update `_renderSetpoint`, add CSS |
| `test/state.test.ts` | Add `getPreheatBars` test suite |

---

### Task 1: `getPreheatBars` in `state.ts`

**Files:**
- Modify: `src/state.ts`
- Test: `test/state.test.ts`

- [ ] **Step 1: Write the failing tests**

Add this describe block to the bottom of `test/state.test.ts` (after the existing `getProgressPercent` describe block):

```ts
describe('getPreheatBars', () => {
  it('returns null when cavity temp is unavailable', () => {
    const hass = makeHass({
      'sensor.oven_currentcavitytemperature': 'unavailable',
      'sensor.oven_setpointtemperature': '170',
    });
    expect(getPreheatBars(hass, BASE_CONFIG)).toBeNull();
  });

  it('returns null when setpoint temp is unavailable', () => {
    const hass = makeHass({
      'sensor.oven_currentcavitytemperature': '100',
      'sensor.oven_setpointtemperature': 'unavailable',
    });
    expect(getPreheatBars(hass, BASE_CONFIG)).toBeNull();
  });

  it('returns null when cavity temp is unknown', () => {
    const hass = makeHass({
      'sensor.oven_currentcavitytemperature': 'unknown',
      'sensor.oven_setpointtemperature': '170',
    });
    expect(getPreheatBars(hass, BASE_CONFIG)).toBeNull();
  });

  it('returns null when setpoint is 0 (avoids divide-by-zero)', () => {
    const hass = makeHass({
      'sensor.oven_currentcavitytemperature': '50',
      'sensor.oven_setpointtemperature': '0',
    });
    expect(getPreheatBars(hass, BASE_CONFIG)).toBeNull();
  });

  it('returns null when either entity is missing', () => {
    const hass = makeHass({});
    expect(getPreheatBars(hass, BASE_CONFIG)).toBeNull();
  });

  it('returns 3 when actual is ~30% of setpoint', () => {
    // 51 / 170 = 0.3 → round(3.0) = 3
    const hass = makeHass({
      'sensor.oven_currentcavitytemperature': '51',
      'sensor.oven_setpointtemperature': '170',
    });
    expect(getPreheatBars(hass, BASE_CONFIG)).toBe(3);
  });

  it('returns 10 when actual equals setpoint', () => {
    const hass = makeHass({
      'sensor.oven_currentcavitytemperature': '170',
      'sensor.oven_setpointtemperature': '170',
    });
    expect(getPreheatBars(hass, BASE_CONFIG)).toBe(10);
  });

  it('returns 10 when actual exceeds setpoint', () => {
    const hass = makeHass({
      'sensor.oven_currentcavitytemperature': '175',
      'sensor.oven_setpointtemperature': '170',
    });
    expect(getPreheatBars(hass, BASE_CONFIG)).toBe(10);
  });

  it('returns 1 when actual is very low relative to setpoint', () => {
    // 20 / 170 = 0.118 → round(1.18) = 1
    const hass = makeHass({
      'sensor.oven_currentcavitytemperature': '20',
      'sensor.oven_setpointtemperature': '170',
    });
    expect(getPreheatBars(hass, BASE_CONFIG)).toBe(1);
  });

  it('returns 0 when actual is 0', () => {
    const hass = makeHass({
      'sensor.oven_currentcavitytemperature': '0',
      'sensor.oven_setpointtemperature': '170',
    });
    expect(getPreheatBars(hass, BASE_CONFIG)).toBe(0);
  });
});
```

Also add `getPreheatBars` to the import at the top of the test file:

```ts
import {
  getOperationState,
  getProgramIconPath,
  getProgressPercent,
  showDetailsRow,
  getPreheatBars,
} from '../src/state';
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --reporter=verbose 2>&1 | grep -A3 "getPreheatBars"
```

Expected: multiple failures with "getPreheatBars is not a function" or similar.

- [ ] **Step 3: Implement `getPreheatBars` in `src/state.ts`**

Add this function at the end of `src/state.ts`, before the final blank line:

```ts
/**
 * Returns the number of preheat bar segments (0–10) to light up, or null if
 * either temperature entity is unavailable/missing.
 *
 * Formula: Math.min(10, Math.round((actual / setpoint) * 10))
 * Returns 10 once actual ≥ setpoint (bar stays full after reaching temperature).
 */
export function getPreheatBars(
  hass: HomeAssistant,
  config: SiemensOvenCardConfig
): number | null {
  const actualState = hass.states[config.cavity_temp_entity]?.state;
  const setpointState = hass.states[config.setpoint_temp_entity]?.state;

  if (
    !actualState || actualState === 'unavailable' || actualState === 'unknown' ||
    !setpointState || setpointState === 'unavailable' || setpointState === 'unknown'
  ) {
    return null;
  }

  const actual = parseInt(actualState, 10);
  const setpoint = parseInt(setpointState, 10);

  if (isNaN(actual) || isNaN(setpoint) || setpoint === 0) return null;

  return Math.min(10, Math.round((actual / setpoint) * 10));
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- --reporter=verbose 2>&1 | grep -A3 "getPreheatBars"
```

Expected: all `getPreheatBars` tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/state.ts test/state.test.ts
git commit -m "feat: add getPreheatBars helper to calculate preheat segment count"
```

---

### Task 2: Render preheat bar in card

**Files:**
- Modify: `src/siemens-oven-card.ts`

- [ ] **Step 1: Add `getPreheatBars` to the import at the top of `src/siemens-oven-card.ts`**

Current import (line 7–10):
```ts
import {
  getOperationState,
  getProgramIconPath,
  getProgressPercent,
  showDetailsRow,
} from './state';
```

Replace with:
```ts
import {
  getOperationState,
  getProgramIconPath,
  getProgressPercent,
  getPreheatBars,
  showDetailsRow,
} from './state';
```

- [ ] **Step 2: Add `_renderPreheatBar` method**

Add this method directly after the `_renderSetpoint` method (around line 310 in the current file):

```ts
private _renderPreheatBar(opState: OperationState) {
  if (opState !== 'run' && opState !== 'pause') return nothing;

  const bars = getPreheatBars(this.hass, this._config);
  if (bars === null) return nothing;

  return html`
    <div class="preheat-bars">
      ${Array.from({ length: 10 }, (_, i) => html`
        <div class="preheat-bar ${i < bars ? 'preheat-bar-active' : 'preheat-bar-inactive'}"></div>
      `)}
    </div>
  `;
}
```

- [ ] **Step 3: Update `_renderSetpoint` to call `_renderPreheatBar`**

Current `_renderSetpoint` return (the active branch):
```ts
return html`
  <div class="zone-setpoint">
    ${setpoint ? html`<span class="setpoint-value">${setpoint}°C</span>` : nothing}
  </div>
`;
```

Replace with:
```ts
return html`
  <div class="zone-setpoint">
    <div class="setpoint-stack">
      ${setpoint ? html`<span class="setpoint-value">${setpoint}°C</span>` : nothing}
      ${this._renderPreheatBar(opState)}
    </div>
  </div>
`;
```

- [ ] **Step 4: Add CSS classes to `static styles`**

Add these rules inside the `static styles = css\`...\`` block, after the `.setpoint-value` rule:

```css
/* ── Preheat bar ── */

.setpoint-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}

.preheat-bars {
  display: flex;
  gap: 3px;
  margin-top: 4px;
}

.preheat-bar {
  width: 10px;
  height: 6px;
  border-radius: 2px;
}

.preheat-bar-active {
  background: #009fe3;
  filter: drop-shadow(0 0 4px rgba(0, 159, 227, 0.6));
}

.preheat-bar-inactive {
  background: #1a3a4a;
}
```

- [ ] **Step 5: Build and verify no TypeScript errors**

```bash
npm run build 2>&1
```

Expected: build completes with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/siemens-oven-card.ts
git commit -m "feat: render preheat progress bar below setpoint temperature"
```

---

### Task 3: Full test run and smoke check

- [ ] **Step 1: Run full test suite**

```bash
npm test 2>&1
```

Expected: all tests pass, no failures.

- [ ] **Step 2: Run the build**

```bash
npm run build 2>&1
```

Expected: `dist/siemens-oven-card.js` produced with no errors.

- [ ] **Step 3: Smoke check in dev.html**

Open `dev.html` in a browser (or check the existing dev server if running). Verify:
- During an active (`run`) state with actual < setpoint: N bars lit, remainder dim
- During an active state with actual ≥ setpoint: all 10 bars lit
- During `inactive`/`finished` state: no bar visible
