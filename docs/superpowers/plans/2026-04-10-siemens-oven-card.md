# Siemens Oven Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone HACS custom Lovelace card for Siemens Home Connect ovens — a LitElement web component displaying the oven image, active program icon, timer, and progress bar.

**Architecture:** A TypeScript LitElement card compiled by Rollup into a single `dist/siemens-oven-card.js`. All images (oven background + 14 program icons) live in `dist/images/` so HACS installs them automatically. Pure logic functions (timer calculation, state mapping) are split into their own modules for testability with Vitest. Requires the [home-connect-hass](https://github.com/ekutner/home-connect-hass) alternative integration.

**Tech Stack:** LitElement 3, TypeScript 5, Rollup 4, Vitest 1, Home Connect integration entities

---

## Pre-requisite: Spec

Read `docs/superpowers/specs/2026-04-10-siemens-oven-card-design.md` before starting. All design decisions and confirmed sensor behaviour are documented there.

---

## File Map

```
siemens-oven-card/           ← repo at ~/workspace/siemens-oven-card/
├── src/
│   ├── types.ts             ← HA interfaces + SiemensOvenCardConfig
│   ├── const.ts             ← PROGRAM_ICON_MAP, PROGRAM_LABEL_MAP, DEFAULT_RESOURCES_PATH
│   ├── timer.ts             ← pure timer functions (formatTime, getRemainingSeconds, getElapsedSeconds)
│   ├── state.ts             ← pure state functions (getOperationState, getProgramIconPath, getProgressPercent, showDetailsRow, showProgressBar)
│   ├── siemens-oven-card.ts ← main LitElement card
│   └── editor.ts            ← LovelaceCardEditor implementation
├── test/
│   ├── timer.test.ts        ← Vitest tests for timer.ts
│   └── state.test.ts        ← Vitest tests for state.ts
├── dist/
│   ├── siemens-oven-card.js ← compiled output (generated, do not edit)
│   ├── images/              ← committed PNG files (oven-bg + 12 program icons)
│   └── fonts/
│       └── 7segment.woff    ← copied from lg-washer-dryer-card/config/www/
├── hacs.json
├── package.json
├── rollup.config.js
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

---

## Task 1: Create and scaffold new repo

**Files:**
- Create: `~/workspace/siemens-oven-card/` (already exists — initialised during brainstorming)

- [ ] **Step 1: Verify repo state**

```bash
cd ~/workspace/siemens-oven-card
git log --oneline
ls
```

Expected: one commit (`chore: initial repo scaffold with spec and plan`), `.gitignore`, `dist/`, `docs/`.

- [ ] **Step 2: Create source directories**

```bash
mkdir -p src test
```

- [ ] **Step 3: Commit scaffold**

```bash
git add src test
git status  # confirm directories tracked (may need .gitkeep if empty)
```

If git won't track empty dirs, add placeholders:

```bash
touch src/.gitkeep test/.gitkeep
git add src/.gitkeep test/.gitkeep
git commit -m "chore: add src and test directories"
```

---

## Task 2: Configure build pipeline

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `rollup.config.js`
- Create: `vitest.config.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "siemens-oven-card",
  "version": "0.1.0",
  "description": "Home Assistant Lovelace card for Siemens Home Connect ovens",
  "scripts": {
    "build": "rollup -c rollup.config.js",
    "dev": "rollup -c rollup.config.js --watch",
    "test": "vitest run"
  },
  "devDependencies": {
    "@rollup/plugin-node-resolve": "^15.0.0",
    "@rollup/plugin-terser": "^0.4.0",
    "@rollup/plugin-typescript": "^11.0.0",
    "lit": "^3.0.0",
    "rollup": "^4.0.0",
    "tslib": "^2.6.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "declaration": false,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts", "test/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

Note: `useDefineForClassFields: false` is required — LitElement decorators break with the default `true` in ES2022+ targets.

- [ ] **Step 3: Create `rollup.config.js`**

```js
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/siemens-oven-card.ts',
  output: {
    file: 'dist/siemens-oven-card.js',
    format: 'es',
    sourcemap: false,
  },
  plugins: [
    resolve(),
    typescript({ tsconfig: './tsconfig.json' }),
    terser(),
  ],
};
```

- [ ] **Step 4: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 5: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 6: Commit**

```bash
git add package.json tsconfig.json rollup.config.js vitest.config.ts package-lock.json
git commit -m "chore: configure build pipeline (rollup, typescript, vitest)"
```

---

## Task 3: Define types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Write `src/types.ts`**

```typescript
export interface HassEntity {
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  language: string;
}

export interface SiemensOvenCardConfig {
  // Required entity IDs — rename prefix to match your oven's device serial
  operation_state_entity: string;
  active_program_entity: string;
  remaining_time_entity: string;
  elapsed_time_entity: string;
  cavity_temp_entity: string;
  setpoint_temp_entity: string;
  program_progress_entity: string;
  door_entity: string; // binary_sensor — off=closed, on=open
  // Optional
  name?: string;
  resources_path?: string; // default: '/hacsfiles/siemens-oven-card' — override for manual installs
}

export type OperationState =
  | 'inactive'
  | 'ready'
  | 'delayedstart'
  | 'run'
  | 'pause'
  | 'finished'
  | 'error'
  | 'actionrequired'
  | 'aborting';

export interface TimerInfo {
  display: string;
  label: string;
  colorClass: 'green' | 'amber' | 'dim';
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: add TypeScript type definitions"
```

---

## Task 4: Define constants and program maps

**Files:**
- Create: `src/const.ts`

- [ ] **Step 1: Write `src/const.ts`**

```typescript
export const CARD_VERSION = '0.1.0';

// Default base URL for all card assets (HACS install path).
// Override with config.resources_path for manual installs (/local/siemens-oven-card).
export const DEFAULT_RESOURCES_PATH = '/hacsfiles/siemens-oven-card';

// Maps sensor...active_program state → icon filename in dist/images/
// Keys are the full BSH enum values reported by home-connect-hass
export const PROGRAM_ICON_MAP: Record<string, string> = {
  'Cooking.Oven.Program.HeatingMode.HotAir': 'hot-air.svg',
  'Cooking.Oven.Program.HeatingMode.TopBottomHeating': 'top-bottom.svg',
  'Cooking.Oven.Program.HeatingMode.HotAirEco': 'hot-air-eco.svg',
  'Cooking.Oven.Program.HeatingMode.TopBottomHeatingEco': 'top-bottom-eco.svg',
  'Cooking.Oven.Program.HeatingMode.HotAirGrilling': 'hot-air-grill.svg',
  'Cooking.Oven.Program.HeatingMode.PizzaSetting': 'pizza.svg',
  'Cooking.Oven.Program.HeatingMode.SlowCook': 'slow-cook.svg',
  'Cooking.Oven.Program.HeatingMode.BottomHeating': 'bottom-heat.svg',
  'Cooking.Oven.Program.HeatingMode.KeepWarm': 'keep-warm.svg',
  'Cooking.Oven.Program.HeatingMode.PreheatOvenware': 'preheat-ovenware.svg',
  'Cooking.Oven.Program.HeatingMode.FrozenHeatupSpecial': 'frozen.svg',
  // Not in integration selector but correctly reported when selected on physical oven:
  'Cooking.Oven.Program.HeatingMode.GrillLargeArea': 'grill-large.svg',
  'Cooking.Oven.Program.HeatingMode.GrillSmallArea': 'grill-small.svg',
};

// Human-readable label shown below each program icon
export const PROGRAM_LABEL_MAP: Record<string, string> = {
  'Cooking.Oven.Program.HeatingMode.HotAir': 'Hot Air',
  'Cooking.Oven.Program.HeatingMode.TopBottomHeating': 'Top / Bottom',
  'Cooking.Oven.Program.HeatingMode.HotAirEco': 'Hot Air Eco',
  'Cooking.Oven.Program.HeatingMode.TopBottomHeatingEco': 'Top / Bottom Eco',
  'Cooking.Oven.Program.HeatingMode.HotAirGrilling': 'Hot Air Grill',
  'Cooking.Oven.Program.HeatingMode.PizzaSetting': 'Pizza',
  'Cooking.Oven.Program.HeatingMode.SlowCook': 'Slow Cook',
  'Cooking.Oven.Program.HeatingMode.BottomHeating': 'Bottom Heat',
  'Cooking.Oven.Program.HeatingMode.KeepWarm': 'Keep Warm',
  'Cooking.Oven.Program.HeatingMode.PreheatOvenware': 'Preheat Ovenware',
  'Cooking.Oven.Program.HeatingMode.FrozenHeatupSpecial': 'Frozen',
  'Cooking.Oven.Program.HeatingMode.GrillLargeArea': 'Grill Large Area',
  'Cooking.Oven.Program.HeatingMode.GrillSmallArea': 'Grill Small Area',
};
```

- [ ] **Step 2: Commit**

```bash
git add src/const.ts
git commit -m "feat: add program icon and label maps"
```

---

## Task 5: Timer utility functions + tests

**Files:**
- Create: `src/timer.ts`
- Create: `test/timer.test.ts`

- [ ] **Step 1: Write the failing tests in `test/timer.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatTime, getRemainingSeconds, parseElapsedEntity } from '../src/timer';

describe('formatTime', () => {
  it('formats zero seconds as 00:00', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('formats 90 seconds as 00:01', () => {
    expect(formatTime(90)).toBe('00:01');
  });

  it('formats 3600 seconds as 01:00', () => {
    expect(formatTime(3600)).toBe('01:00');
  });

  it('formats 5400 seconds as 01:30', () => {
    expect(formatTime(5400)).toBe('01:30');
  });

  it('pads single-digit minutes with leading zero', () => {
    expect(formatTime(3660)).toBe('01:01');
  });
});

describe('getRemainingSeconds', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-11T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns seconds until a future timestamp', () => {
    const future = '2026-04-11T12:45:00Z';
    expect(getRemainingSeconds(future)).toBe(45 * 60);
  });

  it('returns null for a past timestamp', () => {
    const past = '2026-04-11T11:00:00Z';
    expect(getRemainingSeconds(past)).toBeNull();
  });

  it('returns null for unavailable', () => {
    expect(getRemainingSeconds('unavailable')).toBeNull();
  });

  it('returns null for unknown', () => {
    expect(getRemainingSeconds('unknown')).toBeNull();
  });
});

describe('parseElapsedEntity', () => {
  it('normalises single-digit hours to two digits', () => {
    expect(parseElapsedEntity('0:03')).toBe('00:03');
  });

  it('normalises h:mm with two-digit minutes', () => {
    expect(parseElapsedEntity('1:45')).toBe('01:45');
  });

  it('passes through already-padded hh:mm', () => {
    expect(parseElapsedEntity('02:30')).toBe('02:30');
  });

  it('returns --:-- for unavailable', () => {
    expect(parseElapsedEntity('unavailable')).toBe('--:--');
  });

  it('returns --:-- for unknown', () => {
    expect(parseElapsedEntity('unknown')).toBe('--:--');
  });

  it('returns --:-- for empty string', () => {
    expect(parseElapsedEntity('')).toBe('--:--');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../src/timer'`

- [ ] **Step 3: Write `src/timer.ts`**

```typescript
/**
 * Formats a duration in total seconds as "hh:mm".
 * e.g. formatTime(5400) → "01:30"
 */
export function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Returns the number of seconds until the given ISO 8601 timestamp.
 * Returns null if the timestamp is in the past, invalid, unavailable, or unknown.
 */
export function getRemainingSeconds(isoTimestamp: string): number | null {
  const finish = new Date(isoTimestamp).getTime();
  if (isNaN(finish)) return null;
  const remaining = Math.floor((finish - Date.now()) / 1000);
  return remaining > 0 ? remaining : null;
}

/**
 * Normalises the elapsed time entity value (h:mm format from home-connect-hass)
 * to padded hh:mm. Returns "--:--" for unavailable/unknown/invalid values.
 *
 * The entity reports values like "0:03" or "1:45" — we just pad hours to 2 digits.
 */
export function parseElapsedEntity(value: string): string {
  if (!value || value === 'unavailable' || value === 'unknown') return '--:--';
  const parts = value.split(':');
  if (parts.length !== 2) return '--:--';
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return '--:--';
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: PASS — all 11 timer tests green.

- [ ] **Step 5: Commit**

```bash
git add src/timer.ts test/timer.test.ts
git commit -m "feat: add timer utility functions with tests"
```

---

## Task 6: State logic functions + tests

**Files:**
- Create: `src/state.ts`
- Create: `test/state.test.ts`

- [ ] **Step 1: Write the failing tests in `test/state.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import {
  getOperationState,
  getProgramIconPath,
  getProgressPercent,
  showDetailsRow,
  showProgressBar,
} from '../src/state';
import type { HomeAssistant, SiemensOvenCardConfig } from '../src/types';

const BASE_CONFIG: SiemensOvenCardConfig = {
  operation_state_entity: 'sensor.oven_operationstate',
  active_program_entity: 'sensor.oven_active_program',
  remaining_time_entity: 'sensor.oven_remainingprogramtime',
  elapsed_time_entity: 'sensor.oven_elapsedprogramtime',
  cavity_temp_entity: 'sensor.oven_currentcavitytemperature',
  setpoint_temp_entity: 'sensor.oven_setpointtemperature',
  program_progress_entity: 'sensor.oven_programprogress',
  door_entity: 'binary_sensor.oven_doorstate',
};

function makeHass(states: Record<string, string>): HomeAssistant {
  return {
    language: 'en',
    states: Object.fromEntries(
      Object.entries(states).map(([id, state]) => [
        id,
        {
          state,
          attributes: {},
          last_changed: '2026-04-11T12:00:00Z',
          last_updated: '2026-04-11T12:00:00Z',
        },
      ])
    ),
  };
}

describe('getOperationState', () => {
  it('extracts and lowercases the last segment of BSH enum', () => {
    const hass = makeHass({ 'sensor.oven_operationstate': 'BSH.Common.EnumType.OperationState.Inactive' });
    expect(getOperationState(hass, BASE_CONFIG)).toBe('inactive');
  });

  it('returns run for BSH Run state', () => {
    const hass = makeHass({ 'sensor.oven_operationstate': 'BSH.Common.EnumType.OperationState.Run' });
    expect(getOperationState(hass, BASE_CONFIG)).toBe('run');
  });

  it('returns pause for BSH Pause state', () => {
    const hass = makeHass({ 'sensor.oven_operationstate': 'BSH.Common.EnumType.OperationState.Pause' });
    expect(getOperationState(hass, BASE_CONFIG)).toBe('pause');
  });

  it('returns inactive when entity is missing', () => {
    const hass = makeHass({});
    expect(getOperationState(hass, BASE_CONFIG)).toBe('inactive');
  });
});

describe('getProgramIconPath', () => {
  const HACS_PATH = '/hacsfiles/siemens-oven-card';
  const MANUAL_PATH = '/local/siemens-oven-card';

  it('returns the correct HACS path for a known program', () => {
    expect(getProgramIconPath('Cooking.Oven.Program.HeatingMode.HotAir', HACS_PATH))
      .toBe('/hacsfiles/siemens-oven-card/images/hot-air.png');
  });

  it('returns the correct manual install path for a known program', () => {
    expect(getProgramIconPath('Cooking.Oven.Program.HeatingMode.HotAir', MANUAL_PATH))
      .toBe('/local/siemens-oven-card/images/hot-air.png');
  });

  it('returns null for unknown program state', () => {
    expect(getProgramIconPath('unknown', HACS_PATH)).toBeNull();
    expect(getProgramIconPath('unavailable', HACS_PATH)).toBeNull();
    expect(getProgramIconPath('', HACS_PATH)).toBeNull();
  });

  it('returns correct path for pizza', () => {
    expect(getProgramIconPath('Cooking.Oven.Program.HeatingMode.PizzaSetting', HACS_PATH))
      .toBe('/hacsfiles/siemens-oven-card/images/pizza.png');
  });

  it('returns correct path for grill large area', () => {
    expect(getProgramIconPath('Cooking.Oven.Program.HeatingMode.GrillLargeArea', HACS_PATH))
      .toBe('/hacsfiles/siemens-oven-card/images/grill-large.png');
  });
});

describe('getProgressPercent', () => {
  it('returns numeric value when sensor reports 0–99', () => {
    const hass = makeHass({ 'sensor.oven_programprogress': '14' });
    expect(getProgressPercent(hass, BASE_CONFIG)).toBe(14);
  });

  it('returns null when sensor reports 100 (no timer set — meaningless)', () => {
    const hass = makeHass({ 'sensor.oven_programprogress': '100' });
    expect(getProgressPercent(hass, BASE_CONFIG)).toBeNull();
  });

  it('returns null when sensor is unavailable', () => {
    const hass = makeHass({ 'sensor.oven_programprogress': 'unavailable' });
    expect(getProgressPercent(hass, BASE_CONFIG)).toBeNull();
  });

  it('returns null when sensor is unknown', () => {
    const hass = makeHass({ 'sensor.oven_programprogress': 'unknown' });
    expect(getProgressPercent(hass, BASE_CONFIG)).toBeNull();
  });

  it('returns null when entity is missing', () => {
    const hass = makeHass({});
    expect(getProgressPercent(hass, BASE_CONFIG)).toBeNull();
  });

  it('returns 0 when sensor reports 0', () => {
    const hass = makeHass({ 'sensor.oven_programprogress': '0' });
    expect(getProgressPercent(hass, BASE_CONFIG)).toBe(0);
  });
});

describe('showDetailsRow', () => {
  it('shows details for run and pause', () => {
    expect(showDetailsRow('run')).toBe(true);
    expect(showDetailsRow('pause')).toBe(true);
  });

  it('hides details for inactive, finished, error, aborting, actionrequired', () => {
    expect(showDetailsRow('inactive')).toBe(false);
    expect(showDetailsRow('finished')).toBe(false);
    expect(showDetailsRow('error')).toBe(false);
    expect(showDetailsRow('aborting')).toBe(false);
    expect(showDetailsRow('actionrequired')).toBe(false);
  });
});

describe('showProgressBar', () => {
  it('returns true when progress is 0–99', () => {
    const hass = makeHass({ 'sensor.oven_programprogress': '14' });
    expect(showProgressBar(hass, BASE_CONFIG, 'run')).toBe(true);
  });

  it('returns false when progress is 100', () => {
    const hass = makeHass({ 'sensor.oven_programprogress': '100' });
    expect(showProgressBar(hass, BASE_CONFIG, 'run')).toBe(false);
  });

  it('returns false when progress is unavailable', () => {
    const hass = makeHass({ 'sensor.oven_programprogress': 'unavailable' });
    expect(showProgressBar(hass, BASE_CONFIG, 'run')).toBe(false);
  });

  it('returns false when operation state is inactive', () => {
    const hass = makeHass({ 'sensor.oven_programprogress': '14' });
    expect(showProgressBar(hass, BASE_CONFIG, 'inactive')).toBe(false);
  });

  it('returns false when operation state is finished', () => {
    const hass = makeHass({ 'sensor.oven_programprogress': '14' });
    expect(showProgressBar(hass, BASE_CONFIG, 'finished')).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../src/state'`

- [ ] **Step 3: Write `src/state.ts`**

```typescript
import { DEFAULT_RESOURCES_PATH, PROGRAM_ICON_MAP } from './const';
import type { HomeAssistant, OperationState, SiemensOvenCardConfig } from './types';

const ACTIVE_STATES: OperationState[] = ['run', 'pause'];

/**
 * Returns the current operation state of the oven.
 * home-connect-hass reports full BSH enum strings, e.g.:
 * "BSH.Common.EnumType.OperationState.Run" → we extract "Run" and lowercase it → "run"
 * Falls back to 'inactive' if the entity is missing.
 */
export function getOperationState(
  hass: HomeAssistant,
  config: SiemensOvenCardConfig
): OperationState {
  const raw = hass.states[config.operation_state_entity]?.state ?? '';
  const parts = raw.split('.');
  const segment = parts[parts.length - 1]?.toLowerCase() ?? '';
  return (segment || 'inactive') as OperationState;
}

/**
 * Returns the full asset URL for the program icon, or null if not found.
 * Uses resourcesPath to support both HACS and manual installs.
 */
export function getProgramIconPath(programState: string, resourcesPath: string): string | null {
  const filename = PROGRAM_ICON_MAP[programState];
  return filename ? `${resourcesPath}/images/${filename}` : null;
}

/**
 * Returns the program progress as a 0–99 integer, or null if unavailable/100.
 *
 * NOTE: The Home Connect integration reports 100 when no timer is set — this is
 * not meaningful progress. We treat it as null to hide the progress bar.
 */
export function getProgressPercent(
  hass: HomeAssistant,
  config: SiemensOvenCardConfig
): number | null {
  const state = hass.states[config.program_progress_entity]?.state;
  if (!state || state === 'unavailable' || state === 'unknown') return null;
  const value = parseInt(state, 10);
  if (isNaN(value) || value >= 100) return null;
  return value;
}

/**
 * Returns true when the conditional details row should be visible.
 * Shown only during active states (run, pause).
 */
export function showDetailsRow(opState: OperationState): boolean {
  return ACTIVE_STATES.includes(opState);
}

/**
 * Returns true when the progress bar should be visible.
 * Requires active state AND a meaningful progress value (0–99).
 */
export function showProgressBar(
  hass: HomeAssistant,
  config: SiemensOvenCardConfig,
  opState: OperationState
): boolean {
  if (!ACTIVE_STATES.includes(opState)) return false;
  return getProgressPercent(hass, config) !== null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: PASS — all tests green (timer + state suites).

- [ ] **Step 5: Commit**

```bash
git add src/state.ts test/state.test.ts
git commit -m "feat: add state logic functions with tests"
```

---

## Task 7: Card skeleton — LitElement class

**Files:**
- Create: `src/siemens-oven-card.ts` (skeleton only — render is empty)

- [ ] **Step 1: Write `src/siemens-oven-card.ts`**

```typescript
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { CARD_VERSION, DEFAULT_RESOURCES_PATH, PROGRAM_LABEL_MAP } from './const';
import { formatTime, getRemainingSeconds, parseElapsedEntity } from './timer';
import {
  getOperationState,
  getProgramIconPath,
  getProgressPercent,
  showDetailsRow,
  showProgressBar,
} from './state';
import type { HomeAssistant, OperationState, SiemensOvenCardConfig, TimerInfo } from './types';

// Register card with HA's card picker
(window as Record<string, unknown>)['customCards'] ??= [];
((window as Record<string, unknown>)['customCards'] as unknown[]).push({
  type: 'siemens-oven-card',
  name: 'Siemens Oven Card',
  description: 'Card for Siemens Home Connect ovens',
  preview: false,
});

console.info(
  `%c SIEMENS-OVEN-CARD %c v${CARD_VERSION} `,
  'background:#8df427;color:#000;font-weight:bold;',
  'background:#555;color:#fff;'
);

@customElement('siemens-oven-card')
export class SiemensOvenCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config!: SiemensOvenCardConfig;
  @state() private _tick = 0;

  private _tickInterval?: ReturnType<typeof setInterval>;

  /** Resolves the base URL for all assets — supports HACS and manual installs. */
  private get _resourcesPath(): string {
    return this._config?.resources_path ?? DEFAULT_RESOURCES_PATH;
  }

  /** Called by HA when the user saves config (YAML or visual editor). */
  setConfig(config: SiemensOvenCardConfig): void {
    const required: (keyof SiemensOvenCardConfig)[] = [
      'operation_state_entity',
      'active_program_entity',
      'remaining_time_entity',
      'elapsed_time_entity',
      'cavity_temp_entity',
      'setpoint_temp_entity',
      'program_progress_entity',
      'door_entity',
    ];
    for (const field of required) {
      if (!config[field]) {
        throw new Error(`siemens-oven-card: missing required config field: ${field}`);
      }
    }
    this._config = config;
  }

  /** Returns the visual editor element registered in editor.ts. */
  static getConfigElement(): HTMLElement {
    return document.createElement('siemens-oven-card-editor');
  }

  /** Default config shown in the visual editor picker. */
  static getStubConfig(): SiemensOvenCardConfig {
    // Placeholder entity IDs — user must rename to match their device serial
    const prefix = 'siemens_hb676g5s6_68a40e6a233e';
    return {
      operation_state_entity: `sensor.${prefix}_bsh_common_status_operationstate`,
      active_program_entity: `sensor.${prefix}_active_program`,
      remaining_time_entity: `sensor.${prefix}_bsh_common_option_remainingprogramtime`,
      elapsed_time_entity: `sensor.${prefix}_bsh_common_option_elapsedprogramtime`,
      cavity_temp_entity: `sensor.${prefix}_cooking_oven_status_currentcavitytemperature`,
      setpoint_temp_entity: `sensor.${prefix}_cooking_oven_option_setpointtemperature`,
      program_progress_entity: `sensor.${prefix}_bsh_common_option_programprogress`,
      door_entity: `binary_sensor.${prefix}_bsh_common_status_doorstate`,
    };
  }

  /** Hint to HA about card height for dashboard layout. */
  getCardSize(): number {
    return 3;
  }

  connectedCallback(): void {
    super.connectedCallback();
    // Refresh every 30s so elapsed/remaining timers stay accurate
    this._tickInterval = setInterval(() => { this._tick++; }, 30_000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    clearInterval(this._tickInterval);
  }

  render() {
    if (!this._config || !this.hass) return nothing;
    return html`<ha-card><p>Siemens Oven Card skeleton</p></ha-card>`;
  }

  static styles = css`
    :host {
      display: block;
    }
  `;
}
```

- [ ] **Step 2: Verify it builds**

```bash
npm run build
```

Expected: `dist/siemens-oven-card.js` created, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/siemens-oven-card.ts
git commit -m "feat: add card skeleton (LitElement class, setConfig, lifecycle)"
```

---

## Task 8: Render Zone 1 — oven background image

**Files:**
- Modify: `src/siemens-oven-card.ts`

- [ ] **Step 1: Replace stub `render()` and `styles` with Zone 1 layout**

Replace the `render()` method and `static styles` in `src/siemens-oven-card.ts`:

```typescript
render() {
  if (!this._config || !this.hass) return nothing;

  // Inject 7-segment font dynamically to respect resources_path
  if (!this.shadowRoot!.querySelector('style[data-font]')) {
    const s = document.createElement('style');
    s.setAttribute('data-font', '');
    s.textContent = `@font-face { font-family: 'segment7'; src: url('${this._resourcesPath}/fonts/7segment.woff') format('woff'); }`;
    this.shadowRoot!.appendChild(s);
  }

  const opState = getOperationState(this.hass, this._config);

  return html`
    <ha-card>
      <div class="card-main">
        <div class="zone-image">
          <img
            src="${this._resourcesPath}/images/oven-bg.png"
            alt="${this._config.name ?? 'Oven'}"
          />
        </div>
        <div class="right-panel">
          <!-- Zones 2 + 3 and progress bar added in later tasks -->
        </div>
      </div>
    </ha-card>
  `;
}

static styles = css`
  :host {
    display: block;
  }

  ha-card {
    overflow: hidden;
    padding: 0;
    background: #0e0e0e;
  }

  .card-main {
    display: flex;
    height: 160px;
  }

  .zone-image {
    width: 45%;
    flex-shrink: 0;
    overflow: hidden;
  }

  .zone-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .right-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #0e0e0e;
  }
`;
```

- [ ] **Step 2: Build and verify no errors**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/siemens-oven-card.ts
git commit -m "feat: render Zone 1 oven background image"
```

---

## Task 9: Render Zone 2 — program icon

**Files:**
- Modify: `src/siemens-oven-card.ts`

- [ ] **Step 1: Add `_renderZone2()` private method**

Add this method to the class (before `render()`):

```typescript
private _renderZone2(opState: OperationState) {
  if (opState === 'error' || opState === 'actionrequired') {
    return html`
      <div class="zone-icon">
        <span class="warning-icon">⚠</span>
      </div>
    `;
  }

  if (opState === 'inactive' || opState === 'finished' || opState === 'aborting') {
    return html`<div class="zone-icon"></div>`;
  }

  const programState = this.hass.states[this._config.active_program_entity]?.state ?? '';
  const iconPath = getProgramIconPath(programState, this._resourcesPath);
  const programLabel = PROGRAM_LABEL_MAP[programState] ?? '';

  if (!iconPath) {
    return html`<div class="zone-icon"></div>`;
  }

  const tintClass = opState === 'pause' ? 'tint-amber' : 'tint-green';

  return html`
    <div class="zone-icon">
      <img
        class="program-icon ${tintClass}"
        src="${iconPath}"
        alt="${programLabel}"
      />
      <span class="program-label">${programLabel}</span>
    </div>
  `;
}
```

- [ ] **Step 2: Update `render()` to include zones-row with Zone 2**

Replace the `.right-panel` div contents:

```typescript
render() {
  if (!this._config || !this.hass) return nothing;

  if (!this.shadowRoot!.querySelector('style[data-font]')) {
    const s = document.createElement('style');
    s.setAttribute('data-font', '');
    s.textContent = `@font-face { font-family: 'segment7'; src: url('${this._resourcesPath}/fonts/7segment.woff') format('woff'); }`;
    this.shadowRoot!.appendChild(s);
  }

  const opState = getOperationState(this.hass, this._config);

  return html`
    <ha-card>
      <div class="card-main">
        <div class="zone-image">
          <img
            src="${this._resourcesPath}/images/oven-bg.png"
            alt="${this._config.name ?? 'Oven'}"
          />
        </div>
        <div class="right-panel">
          <div class="zones-row">
            ${this._renderZone2(opState)}
            <div class="zone-timer"></div>
          </div>
        </div>
      </div>
    </ha-card>
  `;
}
```

- [ ] **Step 3: Add Zone 2 CSS to `static styles`**

Append to existing `css` block:

```typescript
static styles = css`
  /* ... existing styles ... */

  .zones-row {
    display: flex;
    flex: 1;
  }

  .zone-icon {
    flex: 0 0 55%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-right: 1px solid #1a1a1a;
    overflow: hidden;
  }

  .program-icon {
    width: 56px;
    height: 56px;
    image-rendering: crisp-edges;
  }

  .program-icon.tint-green {
    filter: drop-shadow(0 0 8px rgba(141, 244, 39, 0.5));
  }

  .program-icon.tint-amber {
    filter: drop-shadow(0 0 8px rgba(244, 164, 39, 0.5));
  }

  .program-label {
    font-size: 9px;
    color: #888;
    text-align: center;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    padding: 0 4px;
  }

  .warning-icon {
    font-size: 32px;
    color: #f44;
  }

  .zone-timer {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }
`;
```

- [ ] **Step 4: Build and verify**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/siemens-oven-card.ts
git commit -m "feat: render Zone 2 program icon with state-dependent tint"
```

---

## Task 10: Render Zone 3 — timer display

**Files:**
- Modify: `src/siemens-oven-card.ts`

- [ ] **Step 1: Add `_getTimerInfo()` private method**

```typescript
private _getTimerInfo(opState: OperationState): TimerInfo {
  if (
    opState === 'inactive' ||
    opState === 'finished' ||
    opState === 'aborting' ||
    opState === 'error' ||
    opState === 'actionrequired'
  ) {
    return { display: '--:--', label: '', colorClass: 'dim' };
  }

  // run or pause: try remaining time first — shown when progress is 0-99 (timer active)
  const remaining = getRemainingSeconds(
    this.hass.states[this._config.remaining_time_entity]?.state ?? ''
  );
  if (remaining !== null) {
    return {
      display: formatTime(remaining),
      label: opState === 'pause' ? 'paused' : 'remaining',
      colorClass: 'green',
    };
  }

  // No timer set (progress === 100) — use elapsed time entity directly
  // home-connect-hass reports elapsed as h:mm (e.g. "0:03")
  const elapsedRaw = this.hass.states[this._config.elapsed_time_entity]?.state ?? '';
  return {
    display: parseElapsedEntity(elapsedRaw),
    label: opState === 'pause' ? 'paused' : 'elapsed',
    colorClass: opState === 'pause' ? 'amber' : 'green',
  };
}
```

- [ ] **Step 2: Add `_renderZone3()` method**

```typescript
private _renderZone3(opState: OperationState) {
  void this._tick; // Reference _tick so LitElement re-renders on interval
  const timer = this._getTimerInfo(opState);

  return html`
    <div class="zone-timer">
      <div class="timer-display">
        <span class="timer-ghost">88:88</span>
        <span class="timer-value ${timer.colorClass}">${timer.display}</span>
      </div>
      ${timer.label
        ? html`<span class="timer-label">${timer.label}</span>`
        : nothing}
    </div>
  `;
}
```

- [ ] **Step 3: Update `render()` to call `_renderZone3()`**

Replace `<div class="zone-timer"></div>` in the zones-row with:

```typescript
${this._renderZone3(opState)}
```

- [ ] **Step 4: Add timer CSS to `static styles`**

```typescript
  .timer-display {
    position: relative;
    font-family: 'segment7', 'Courier New', monospace;
    font-size: 32px;
    letter-spacing: 2px;
    line-height: 1;
  }

  .timer-ghost {
    color: #2a2a2a;
    user-select: none;
  }

  .timer-value {
    position: absolute;
    left: 0;
    top: 0;
  }

  .timer-value.green { color: #8df427; }
  .timer-value.amber { color: #f4a427; }
  .timer-value.dim   { color: #444; }

  .timer-label {
    font-size: 9px;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
```

- [ ] **Step 5: Build and verify**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/siemens-oven-card.ts
git commit -m "feat: render Zone 3 timer display with 7-segment font"
```

---

## Task 11: Render progress bar

**Files:**
- Modify: `src/siemens-oven-card.ts`

- [ ] **Step 1: Add `_renderProgressBar()` method**

```typescript
private _renderProgressBar(opState: OperationState) {
  if (!showProgressBar(this.hass, this._config, opState)) {
    return html`<div class="progress-bar-spacer"></div>`;
  }

  const progress = getProgressPercent(this.hass, this._config)!;
  const barClass = opState === 'pause' ? 'bar-run bar-paused' : 'bar-run';

  return html`
    <div class="progress-bar-container">
      <div
        class="progress-bar ${barClass}"
        style="width: ${progress}%"
        role="progressbar"
        aria-valuenow="${progress}"
        aria-valuemin="0"
        aria-valuemax="100"
      ></div>
    </div>
  `;
}
```

- [ ] **Step 2: Update `render()` to include progress bar inside `.right-panel`**

```typescript
<div class="right-panel">
  <div class="zones-row">
    ${this._renderZone2(opState)}
    ${this._renderZone3(opState)}
  </div>
  ${this._renderProgressBar(opState)}
</div>
```

- [ ] **Step 3: Add progress bar CSS**

```typescript
  .progress-bar-container {
    height: 6px;
    background: #1a1a1a;
    margin: 0 12px 10px;
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    border-radius: 3px;
    transition: width 0.5s ease;
  }

  .bar-run {
    background: linear-gradient(90deg, #3a8f00, #8df427);
  }

  .bar-paused {
    opacity: 0.5;
  }

  .progress-bar-spacer {
    height: 16px;
  }
```

- [ ] **Step 4: Build and verify**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/siemens-oven-card.ts
git commit -m "feat: render progress bar (shown only when progress is 0-99)"
```

---

## Task 12: Render conditional details row

**Files:**
- Modify: `src/siemens-oven-card.ts`

- [ ] **Step 1: Add `_renderDetails()` method**

```typescript
private _renderDetails(opState: OperationState) {
  if (!showDetailsRow(opState)) return nothing;

  const setpointState = this.hass.states[this._config.setpoint_temp_entity]?.state;
  const cavityState = this.hass.states[this._config.cavity_temp_entity]?.state;
  const progress = getProgressPercent(this.hass, this._config);
  // door_entity is a binary_sensor: off=closed, on=open
  const doorState = this.hass.states[this._config.door_entity]?.state;

  const setpoint =
    setpointState && setpointState !== 'unavailable' && setpointState !== 'unknown'
      ? setpointState
      : null;
  const cavity =
    cavityState && cavityState !== 'unavailable' && cavityState !== 'unknown'
      ? cavityState
      : null;
  const doorLabel =
    doorState === 'on' ? 'open' : doorState === 'off' ? 'closed' : null;

  return html`
    <div class="details-row">
      ${setpoint ? html`<span class="detail-item">🎯 ${setpoint}°C</span>` : nothing}
      ${cavity ? html`<span class="detail-item">🌡 ${cavity}°C</span>` : nothing}
      ${progress !== null ? html`<span class="detail-item">▓ ${progress}%</span>` : nothing}
      ${doorLabel ? html`<span class="detail-item">🚪 ${doorLabel}</span>` : nothing}
    </div>
  `;
}
```

- [ ] **Step 2: Update `render()` to include details row below `.card-main`**

```typescript
return html`
  <ha-card>
    <div class="card-main">
      <div class="zone-image">
        <img
          src="${this._resourcesPath}/images/oven-bg.png"
          alt="${this._config.name ?? 'Oven'}"
        />
      </div>
      <div class="right-panel">
        <div class="zones-row">
          ${this._renderZone2(opState)}
          ${this._renderZone3(opState)}
        </div>
        ${this._renderProgressBar(opState)}
      </div>
    </div>
    ${this._renderDetails(opState)}
  </ha-card>
`;
```

- [ ] **Step 3: Add details row CSS**

```typescript
  .details-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 20px;
    padding: 10px 14px;
    background: #111;
    border-top: 1px solid #1a1a1a;
  }

  .detail-item {
    font-size: 11px;
    color: #888;
  }
```

- [ ] **Step 4: Build and verify**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/siemens-oven-card.ts
git commit -m "feat: render conditional details row (cavity temp, progress, door)"
```

---

## Task 13: Visual editor

**Files:**
- Create: `src/editor.ts`
- Modify: `src/siemens-oven-card.ts` (add import)

- [ ] **Step 1: Write `src/editor.ts`**

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant, SiemensOvenCardConfig } from './types';

const ENTITY_FIELDS: Array<{ key: keyof SiemensOvenCardConfig; label: string }> = [
  { key: 'operation_state_entity', label: 'Operation State Entity' },
  { key: 'active_program_entity', label: 'Active Program Entity' },
  { key: 'remaining_time_entity', label: 'Remaining Time Entity' },
  { key: 'elapsed_time_entity', label: 'Elapsed Time Entity' },
  { key: 'cavity_temp_entity', label: 'Cavity Temperature Entity' },
  { key: 'setpoint_temp_entity', label: 'Setpoint Temperature Entity' },
  { key: 'program_progress_entity', label: 'Program Progress Entity' },
  { key: 'door_entity', label: 'Door Entity (binary_sensor)' },
];

@customElement('siemens-oven-card-editor')
export class SiemensOvenCardEditor extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) _config!: SiemensOvenCardConfig;

  setConfig(config: SiemensOvenCardConfig): void {
    this._config = config;
  }

  private _entityChanged(ev: CustomEvent): void {
    if (!this._config) return;
    const target = ev.target as HTMLElement;
    const key = target.getAttribute('data-key') as keyof SiemensOvenCardConfig;
    if (!key) return;
    const updated: SiemensOvenCardConfig = {
      ...this._config,
      [key]: (ev.detail as { value: string }).value,
    };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: updated } }));
  }

  private _nameChanged(ev: InputEvent): void {
    if (!this._config) return;
    const updated: SiemensOvenCardConfig = {
      ...this._config,
      name: (ev.target as HTMLInputElement).value || undefined,
    };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: updated } }));
  }

  private _resourcesPathChanged(ev: InputEvent): void {
    if (!this._config) return;
    const value = (ev.target as HTMLInputElement).value.trim();
    const updated: SiemensOvenCardConfig = {
      ...this._config,
      resources_path: value || undefined,
    };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: updated } }));
  }

  render() {
    if (!this._config) return html``;

    return html`
      <div class="editor">
        ${ENTITY_FIELDS.map(
          ({ key, label }) => html`
            <ha-entity-picker
              .hass=${this.hass}
              .value=${(this._config[key] as string) ?? ''}
              .label=${label}
              data-key=${key}
              @value-changed=${this._entityChanged}
              allow-custom-entity
            ></ha-entity-picker>
          `
        )}
        <ha-textfield
          label="Card Name (optional)"
          .value=${this._config.name ?? ''}
          @input=${this._nameChanged}
        ></ha-textfield>
        <ha-textfield
          label="Resources Path (manual install only — leave blank for HACS)"
          .value=${this._config.resources_path ?? ''}
          placeholder="/local/siemens-oven-card"
          @input=${this._resourcesPathChanged}
        ></ha-textfield>
      </div>
    `;
  }

  static styles = css`
    .editor {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px 0;
    }

    ha-entity-picker,
    ha-textfield {
      display: block;
    }
  `;
}
```

- [ ] **Step 2: Add import to `src/siemens-oven-card.ts`**

Add at the top after existing imports:

```typescript
import './editor';
```

- [ ] **Step 3: Build and verify**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/editor.ts src/siemens-oven-card.ts
git commit -m "feat: add visual config editor (LovelaceCardEditor)"
```

---

## Task 14: Add font and images to dist/

**Files:**
- Create: `dist/fonts/7segment.woff`
- Create: `dist/images/` PNG files

- [ ] **Step 1: Copy the 7-segment font**

```bash
cp ~/workspace/lg-washer-dryer-card/config/www/7segment.woff dist/fonts/7segment.woff
```

- [ ] **Step 2: Remove placeholder and add real images**

When image files are ready, copy them into `dist/images/`. Expected filenames:

```
dist/images/oven-bg.png           (960×400px oven background — PNG)
dist/images/hot-air.svg           (128×128px, white fill, transparent bg — SVG)
dist/images/top-bottom.svg
dist/images/hot-air-eco.svg
dist/images/top-bottom-eco.svg
dist/images/hot-air-grill.svg
dist/images/pizza.svg
dist/images/slow-cook.svg
dist/images/bottom-heat.svg
dist/images/keep-warm.svg
dist/images/preheat-ovenware.svg
dist/images/frozen.svg
dist/images/grill-large.svg
dist/images/grill-small.svg
```

Icons can be SVG or PNG. SVG preferred — extracted from the oven manual in Inkscape with white fill and transparent background. Card applies green/amber tint via CSS filter.

- [ ] **Step 3: Remove .gitkeep placeholders once images are added**

```bash
rm dist/images/.gitkeep dist/fonts/.gitkeep
```

- [ ] **Step 4: Commit font (images committed separately when ready)**

```bash
git add dist/fonts/7segment.woff
git commit -m "chore: add 7segment font to dist/"
```

---

## Task 15: HACS manifest and README

**Files:**
- Create: `hacs.json`
- Create: `README.md`

- [ ] **Step 1: Write `hacs.json`**

```json
{
  "name": "Siemens Oven Card",
  "render_readme": true,
  "content_in_root": false
}
```

`content_in_root: false` tells HACS to install everything from `dist/` to `/hacsfiles/siemens-oven-card/`.

- [ ] **Step 2: Write `README.md`**

````markdown
# Siemens Oven Card

A Home Assistant Lovelace card for Siemens ovens connected via the [Home Connect integration](https://www.home-assistant.io/integrations/home_connect/).

Displays the oven's current heating program, timer, and cooking progress in a panel that matches the oven's physical display aesthetic.

## Supported models

- Siemens HB676G5S6 (designed and tested)
- Expected to work on any Siemens/Bosch oven using the Home Connect integration

## Installation (HACS)

1. Open HACS → Frontend → Explore & Download Repositories
2. Search for **Siemens Oven Card** → Download
3. Add the card to your dashboard and configure your entity IDs

## Manual installation (for testing)

1. Copy `dist/siemens-oven-card.js` → `config/www/siemens-oven-card.js`
2. Copy `dist/images/` → `config/www/siemens-oven-card/images/`
3. Copy `dist/fonts/` → `config/www/siemens-oven-card/fonts/`
4. Add `/local/siemens-oven-card.js` as a Lovelace resource (Settings → Dashboards → Resources)
5. Use `resources_path: /local/siemens-oven-card` in your card config

## Configuration

```yaml
type: custom:siemens-oven-card
# Rename the prefix to match your oven's device serial
operation_state_entity: sensor.siemens_hb676g5s6_68a40e6a233e_bsh_common_status_operationstate
active_program_entity: sensor.siemens_hb676g5s6_68a40e6a233e_active_program
remaining_time_entity: sensor.siemens_hb676g5s6_68a40e6a233e_bsh_common_option_remainingprogramtime
elapsed_time_entity: sensor.siemens_hb676g5s6_68a40e6a233e_bsh_common_option_elapsedprogramtime
cavity_temp_entity: sensor.siemens_hb676g5s6_68a40e6a233e_cooking_oven_status_currentcavitytemperature
setpoint_temp_entity: sensor.siemens_hb676g5s6_68a40e6a233e_cooking_oven_option_setpointtemperature
program_progress_entity: sensor.siemens_hb676g5s6_68a40e6a233e_bsh_common_option_programprogress
door_entity: binary_sensor.siemens_hb676g5s6_68a40e6a233e_bsh_common_status_doorstate
name: Oven            # optional
resources_path: /hacsfiles/siemens-oven-card  # default — omit for HACS installs
```

Rename each entity ID to match your oven. Find them in **Developer Tools → States**.

## Notes

- The progress bar is shown only when a duration timer is active (progress reports 0–99%). When no timer is set the bar is hidden.
- The 7-segment font (© Jan Bobrowski, OFL) is bundled in the release.
````

- [ ] **Step 3: Commit**

```bash
git add hacs.json README.md
git commit -m "chore: add HACS manifest and README"
```

---

## Task 16: Final build verification

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: `dist/siemens-oven-card.js` created, no TypeScript errors, no rollup warnings.

- [ ] **Step 3: Verify dist/ structure**

```bash
ls dist/
ls dist/images/
ls dist/fonts/
```

Expected:
```
dist/siemens-oven-card.js   ← generated
dist/images/                ← PNG images
dist/fonts/7segment.woff    ← committed
```

- [ ] **Step 4: Check bundle size**

```bash
wc -c dist/siemens-oven-card.js
```

Expected: under 100KB.

- [ ] **Step 5: Push to GitHub**

```bash
git push origin main
```

---

## Post-implementation: Manual testing checklist

Before tagging a release, verify these behaviours in HA with the real oven:

- [ ] **Elapsed time entity behaviour** — We observed `elapsed_time_entity` reporting `0:01` during preheating which seemed too low, and it was unclear whether it resets when a timer is added or counts continuously from program start. After implementing, test:
  - Start oven with no timer — does elapsed count up correctly over several minutes?
  - Add a timer mid-session — does elapsed reset or continue from where it was?
  - If elapsed resets when a timer is added, the "no timer" elapsed display is unreliable and we should fall back to calculating elapsed from `operation_state.last_changed` instead
- [ ] Remaining time counts down correctly with a timer set
- [ ] Progress bar appears/disappears correctly when toggling timer on/off
- [ ] Setpoint temp shows correctly in details row
- [ ] Door state shows "open"/"closed" correctly when opened during cooking
- [ ] GrillLargeArea and GrillSmallArea icons display when those programs are active

---

## Post-implementation: First HACS release

When images are committed and the card is tested manually:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Create a GitHub release from the tag. HACS will detect the release and make it installable via custom repository URL: `https://github.com/gregcy/siemens-oven-card`

---

## Self-Review Notes

**Spec coverage check:**
- ✅ Three-zone layout (Tasks 8, 9, 10)
- ✅ Progress bar shown only when progress 0–99 (Task 11)
- ✅ Conditional details row: setpoint temp, cavity temp, progress, door (Task 12)
- ✅ 13 program icon mappings including GrillLargeArea + GrillSmallArea, SVG format (Task 4)
- ✅ Timer: remaining from ISO timestamp (Task 10)
- ✅ Timer: elapsed from elapsed_time entity when no timer set (Task 10)
- ✅ Progress bar hidden when `program_progress == 100` (no timer) (Task 6, 11)
- ✅ Visual editor with 8 entity pickers + name + resources_path (Task 13)
- ✅ `resources_path` for HACS vs manual install throughout (Tasks 3, 4, 7, 9, 10, 13)
- ✅ Font injected dynamically via shadow DOM (Task 8)
- ✅ All 7 operation states handled (Tasks 9, 10, 11, 12)
- ✅ `setConfig` validation with clear error messages (Task 7)
- ✅ Timer re-renders every 30s (Task 7)
- ✅ BSH enum state values extracted and lowercased (Task 6 `getOperationState`)
- ✅ Door is binary_sensor — off=closed, on=open (Task 12 `_renderDetails`)
- ✅ `sensor.oven_pre_heat_finished` excluded (not exposed by home-connect-hass)
