# Siemens Oven Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone HACS custom Lovelace card for Siemens Home Connect ovens — a LitElement web component displaying the oven image, active program icon, timer, and progress bar.

**Architecture:** A TypeScript LitElement card compiled by Rollup into a single `dist/siemens-oven-card.js`. All images (oven background + 12 program icons) live in `dist/images/` so HACS installs them automatically. Pure logic functions (timer calculation, state mapping) are split into their own modules for testability with Vitest.

**Tech Stack:** LitElement 3, TypeScript 5, Rollup 4, Vitest 1, Home Connect integration entities

---

## Pre-requisite: Spec

Read `docs/superpowers/specs/2026-04-10-siemens-oven-card-design.md` in the `lg-washer-dryer-card` repo before starting. All design decisions are documented there.

---

## File Map

```
siemens-oven-card/           ← new repo at ~/workspace/siemens-oven-card/
├── src/
│   ├── types.ts             ← HA interfaces + SiemensOvenCardConfig
│   ├── const.ts             ← PROGRAM_ICON_MAP, PROGRAM_LABEL_MAP, HACSFILES_BASE
│   ├── timer.ts             ← pure timer functions (formatTime, getRemainingSeconds, getElapsedSeconds)
│   ├── state.ts             ← pure state functions (getOperationState, getProgramIconPath, etc.)
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
- Create: `~/workspace/siemens-oven-card/` (new git repo)
- Create: `.gitignore`

- [ ] **Step 1: Create the repo directory and initialise git**

```bash
mkdir ~/workspace/siemens-oven-card
cd ~/workspace/siemens-oven-card
git init
```

Expected: `Initialized empty Git repository in ~/workspace/siemens-oven-card/.git/`

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
dist/siemens-oven-card.js
dist-tsc/
.DS_Store
```

Note: `dist/images/` and `dist/fonts/` are NOT gitignored — they contain committed assets.

- [ ] **Step 3: Create the directory structure**

```bash
mkdir -p src test dist/images dist/fonts
```

- [ ] **Step 4: Commit scaffold**

```bash
git add .gitignore
git commit -m "chore: initial repo scaffold"
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
  // Required entity IDs — rename to match your oven
  operation_state_entity: string;
  active_program_entity: string;
  remaining_time_entity: string;
  cavity_temp_entity: string;
  program_progress_entity: string;
  setpoint_temp_entity: string;
  door_entity: string;
  // Optional
  name?: string;
  resources_path?: string; // default: '/hacsfiles/siemens-oven-card' — override for manual installs
}

export type OperationState =
  | 'inactive'
  | 'ready'
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

// Maps select.oven_active_program state → icon filename in dist/images/
export const PROGRAM_ICON_MAP: Record<string, string> = {
  cooking_oven_program_heating_mode_hot_air: 'hot-air.png',
  cooking_oven_program_heating_mode_top_bottom_heating: 'top-bottom.png',
  cooking_oven_program_heating_mode_hot_air_eco: 'hot-air-eco.png',
  cooking_oven_program_heating_mode_top_bottom_heating_eco: 'top-bottom-eco.png',
  cooking_oven_program_heating_mode_hot_air_grilling: 'hot-air-grill.png',
  cooking_oven_program_heating_mode_pizza_setting: 'pizza.png',
  cooking_oven_program_heating_mode_slow_cook: 'slow-cook.png',
  cooking_oven_program_heating_mode_bottom_heating: 'bottom-heat.png',
  cooking_oven_program_heating_mode_keep_warm: 'keep-warm.png',
  cooking_oven_program_heating_mode_preheat_ovenware: 'preheat-ovenware.png',
  cooking_oven_program_heating_mode_frozen_heatup_special: 'frozen.png',
  cooking_oven_program_heating_mode_sabbath_programme: 'sabbath.png',
};

// Human-readable label shown below each program icon
export const PROGRAM_LABEL_MAP: Record<string, string> = {
  cooking_oven_program_heating_mode_hot_air: 'Hot Air',
  cooking_oven_program_heating_mode_top_bottom_heating: 'Top / Bottom',
  cooking_oven_program_heating_mode_hot_air_eco: 'Hot Air Eco',
  cooking_oven_program_heating_mode_top_bottom_heating_eco: 'Top / Bottom Eco',
  cooking_oven_program_heating_mode_hot_air_grilling: 'Hot Air Grill',
  cooking_oven_program_heating_mode_pizza_setting: 'Pizza',
  cooking_oven_program_heating_mode_slow_cook: 'Slow Cook',
  cooking_oven_program_heating_mode_bottom_heating: 'Bottom Heat',
  cooking_oven_program_heating_mode_keep_warm: 'Keep Warm',
  cooking_oven_program_heating_mode_preheat_ovenware: 'Preheat Ovenware',
  cooking_oven_program_heating_mode_frozen_heatup_special: 'Frozen',
  cooking_oven_program_heating_mode_sabbath_programme: 'Sabbath',
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
import { formatTime, getRemainingSeconds, getElapsedSeconds } from '../src/timer';

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
    vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns seconds until a future timestamp', () => {
    const future = '2026-04-10T12:45:00Z';
    expect(getRemainingSeconds(future)).toBe(45 * 60);
  });

  it('returns null for a past timestamp', () => {
    const past = '2026-04-10T11:00:00Z';
    expect(getRemainingSeconds(past)).toBeNull();
  });

  it('returns null for an invalid timestamp', () => {
    expect(getRemainingSeconds('unavailable')).toBeNull();
    expect(getRemainingSeconds('unknown')).toBeNull();
  });
});

describe('getElapsedSeconds', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns seconds elapsed since a past timestamp', () => {
    const past = '2026-04-10T11:00:00Z';
    expect(getElapsedSeconds(past)).toBe(3600);
  });

  it('returns 0 for a future timestamp', () => {
    const future = '2026-04-10T13:00:00Z';
    expect(getElapsedSeconds(future)).toBe(0);
  });

  it('returns 0 for an invalid timestamp', () => {
    expect(getElapsedSeconds('unavailable')).toBe(0);
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
 * Returns null if the timestamp is in the past, invalid, or unavailable.
 */
export function getRemainingSeconds(isoTimestamp: string): number | null {
  const finish = new Date(isoTimestamp).getTime();
  if (isNaN(finish)) return null;
  const remaining = Math.floor((finish - Date.now()) / 1000);
  return remaining > 0 ? remaining : null;
}

/**
 * Returns the number of seconds elapsed since the given ISO 8601 timestamp.
 * Returns 0 if the timestamp is in the future or invalid.
 */
export function getElapsedSeconds(isoTimestamp: string): number {
  const start = new Date(isoTimestamp).getTime();
  if (isNaN(start)) return 0;
  return Math.max(0, Math.floor((Date.now() - start) / 1000));
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: PASS — all 8 timer tests green.

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
  operation_state_entity: 'sensor.oven_operation_state',
  active_program_entity: 'select.oven_active_program',
  remaining_time_entity: 'sensor.oven_remaining_program_time',
  cavity_temp_entity: 'sensor.oven_current_oven_cavity_temperature',
  program_progress_entity: 'sensor.oven_program_progress',
  setpoint_temp_entity: 'number.oven_setpoint_temperature',
  door_entity: 'sensor.oven_door',
};

function makeHass(states: Record<string, string>): HomeAssistant {
  return {
    language: 'en',
    states: Object.fromEntries(
      Object.entries(states).map(([id, state]) => [
        id,
        { state, attributes: {}, last_changed: '2026-04-10T12:00:00Z', last_updated: '2026-04-10T12:00:00Z' },
      ])
    ),
  };
}

describe('getOperationState', () => {
  it('returns inactive when entity is inactive', () => {
    const hass = makeHass({ 'sensor.oven_operation_state': 'inactive' });
    expect(getOperationState(hass, BASE_CONFIG)).toBe('inactive');
  });

  it('returns run when entity is run', () => {
    const hass = makeHass({ 'sensor.oven_operation_state': 'run' });
    expect(getOperationState(hass, BASE_CONFIG)).toBe('run');
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
    expect(getProgramIconPath('cooking_oven_program_heating_mode_hot_air', HACS_PATH))
      .toBe('/hacsfiles/siemens-oven-card/images/hot-air.png');
  });

  it('returns the correct manual install path for a known program', () => {
    expect(getProgramIconPath('cooking_oven_program_heating_mode_hot_air', MANUAL_PATH))
      .toBe('/local/siemens-oven-card/images/hot-air.png');
  });

  it('returns null for unknown program state', () => {
    expect(getProgramIconPath('unknown', HACS_PATH)).toBeNull();
    expect(getProgramIconPath('unavailable', HACS_PATH)).toBeNull();
    expect(getProgramIconPath('', HACS_PATH)).toBeNull();
  });

  it('returns correct path for pizza', () => {
    expect(getProgramIconPath('cooking_oven_program_heating_mode_pizza_setting', HACS_PATH))
      .toBe('/hacsfiles/siemens-oven-card/images/pizza.png');
  });
});

describe('getProgressPercent', () => {
  it('returns numeric value when sensor reports a number', () => {
    const hass = makeHass({ 'sensor.oven_program_progress': '68' });
    expect(getProgressPercent(hass, BASE_CONFIG)).toBe(68);
  });

  it('returns null when sensor is unavailable', () => {
    const hass = makeHass({ 'sensor.oven_program_progress': 'unavailable' });
    expect(getProgressPercent(hass, BASE_CONFIG)).toBeNull();
  });

  it('returns null when sensor is unknown', () => {
    const hass = makeHass({ 'sensor.oven_program_progress': 'unknown' });
    expect(getProgressPercent(hass, BASE_CONFIG)).toBeNull();
  });

  it('returns null when entity is missing', () => {
    const hass = makeHass({});
    expect(getProgressPercent(hass, BASE_CONFIG)).toBeNull();
  });
});

describe('showDetailsRow', () => {
  it('shows details for ready, run, pause', () => {
    expect(showDetailsRow('ready')).toBe(true);
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
  it('shows progress bar for ready, run, pause', () => {
    expect(showProgressBar('ready')).toBe(true);
    expect(showProgressBar('run')).toBe(true);
    expect(showProgressBar('pause')).toBe(true);
  });

  it('hides progress bar for other states', () => {
    expect(showProgressBar('inactive')).toBe(false);
    expect(showProgressBar('finished')).toBe(false);
    expect(showProgressBar('error')).toBe(false);
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

const ACTIVE_STATES: OperationState[] = ['ready', 'run', 'pause'];

/**
 * Returns the current operation state of the oven.
 * Falls back to 'inactive' if the entity is missing.
 */
export function getOperationState(
  hass: HomeAssistant,
  config: SiemensOvenCardConfig
): OperationState {
  const state = hass.states[config.operation_state_entity]?.state ?? 'inactive';
  return state as OperationState;
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
 * Returns the program progress as a 0–100 integer, or null if unavailable.
 */
export function getProgressPercent(
  hass: HomeAssistant,
  config: SiemensOvenCardConfig
): number | null {
  const state = hass.states[config.program_progress_entity]?.state;
  if (!state || state === 'unavailable' || state === 'unknown') return null;
  const value = parseInt(state, 10);
  return isNaN(value) ? null : value;
}

/**
 * Returns true when the conditional details row should be visible.
 */
export function showDetailsRow(opState: OperationState): boolean {
  return ACTIVE_STATES.includes(opState);
}

/**
 * Returns true when the progress bar should be visible.
 */
export function showProgressBar(opState: OperationState): boolean {
  return ACTIVE_STATES.includes(opState);
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
import { formatTime, getRemainingSeconds, getElapsedSeconds } from './timer';
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

  /** Called by HA when the user saves config (YAML or visual editor). */
  setConfig(config: SiemensOvenCardConfig): void {
    const required: (keyof SiemensOvenCardConfig)[] = [
      'operation_state_entity',
      'active_program_entity',
      'remaining_time_entity',
      'cavity_temp_entity',
      'program_progress_entity',
      'setpoint_temp_entity',
      'door_entity',
    ];
    for (const field of required) {
      if (!config[field]) {
        throw new Error(`siemens-oven-card: missing required config field: ${field}`);
      }
    }
    this._config = config;
  }

  /** Resolves the base URL for all assets — supports HACS and manual installs. */
  private get _resourcesPath(): string {
    return this._config?.resources_path ?? DEFAULT_RESOURCES_PATH;
  }

  /** Returns the visual editor element registered in editor.ts. */
  static getConfigElement(): HTMLElement {
    return document.createElement('siemens-oven-card-editor');
  }

  /** Default config shown in the visual editor picker. */
  static getStubConfig(): SiemensOvenCardConfig {
    return {
      operation_state_entity: 'sensor.oven_operation_state',
      active_program_entity: 'select.oven_active_program',
      remaining_time_entity: 'sensor.oven_remaining_program_time',
      cavity_temp_entity: 'sensor.oven_current_oven_cavity_temperature',
      program_progress_entity: 'sensor.oven_program_progress',
      setpoint_temp_entity: 'number.oven_setpoint_temperature',
      door_entity: 'sensor.oven_door',
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

- [ ] **Step 1: Replace the stub `render()` with the Zone 1 layout**

Replace the `render()` method and `styles` in `src/siemens-oven-card.ts`:

```typescript
render() {
  if (!this._config || !this.hass) return nothing;

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
          <!-- Zones 2 + 3 and progress bar go here in later tasks -->
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

- [ ] **Step 1: Add the `_renderZone2()` private method and zones-row layout**

Add this private method to the `SiemensOvenCard` class (before `render()`):

```typescript
private _renderZone2(opState: OperationState) {
  const programState = this.hass.states[this._config.active_program_entity]?.state ?? '';
  const iconPath = getProgramIconPath(programState, this._resourcesPath);
  const programLabel = PROGRAM_LABEL_MAP[programState] ?? '';

  if (opState === 'error' || opState === 'actionrequired') {
    return html`
      <div class="zone-icon">
        <span class="warning-icon">⚠</span>
      </div>
    `;
  }

  const tintClass =
    opState === 'run' ? 'tint-green'
    : opState === 'pause' ? 'tint-amber'
    : opState === 'ready' ? 'tint-amber'
    : '';

  if (!iconPath || opState === 'inactive' || opState === 'finished' || opState === 'aborting') {
    return html`<div class="zone-icon"></div>`;
  }

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

- [ ] **Step 2: Update `render()` to include the zones-row with Zone 2**

Replace the `.right-panel` div in `render()`:

```typescript
<div class="right-panel">
  <div class="zones-row">
    ${this._renderZone2(opState)}
    <!-- Zone 3 added in next task -->
    <div class="zone-timer"></div>
  </div>
</div>
```

Also update the top of `render()` to compute `opState`:

```typescript
render() {
  if (!this._config || !this.hass) return nothing;
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

Append to the existing `css` block:

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

Add this method to the class:

```typescript
private _getTimerInfo(opState: OperationState): TimerInfo {
  // States that show nothing active
  if (
    opState === 'inactive' ||
    opState === 'finished' ||
    opState === 'aborting' ||
    opState === 'error' ||
    opState === 'actionrequired'
  ) {
    return { display: '--:--', label: '', colorClass: 'dim' };
  }

  if (opState === 'ready') {
    return { display: '--:--', label: 'preheating', colorClass: 'amber' };
  }

  // run or pause: try remaining time first
  const remainingState = this.hass.states[this._config.remaining_time_entity]?.state ?? '';
  if (remainingState && remainingState !== 'unavailable' && remainingState !== 'unknown') {
    const remaining = getRemainingSeconds(remainingState);
    if (remaining !== null) {
      return {
        display: formatTime(remaining),
        label: opState === 'pause' ? 'paused' : 'remaining',
        colorClass: 'green',
      };
    }
  }

  // Fall back to elapsed time
  const lastChanged =
    this.hass.states[this._config.operation_state_entity]?.last_changed ?? '';
  const elapsed = getElapsedSeconds(lastChanged);
  return {
    display: formatTime(elapsed),
    label: opState === 'pause' ? 'paused' : 'elapsed',
    colorClass: 'amber',
  };
}
```

- [ ] **Step 2: Add `_renderZone3()` method**

```typescript
private _renderZone3(opState: OperationState) {
  // Reference _tick so LitElement re-renders when the interval fires
  void this._tick;
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

Replace `<div class="zone-timer"></div>` in `render()` with:

```typescript
${this._renderZone3(opState)}
```

- [ ] **Step 4: Add font-face and timer CSS to `static styles`**

```typescript
static styles = css`
  /* ... existing styles ... */

  @font-face {
    font-family: 'segment7';
    src: url('${HACSFILES_BASE}/fonts/7segment.woff') format('woff');
  }

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
`;
```

**Note:** LitElement's tagged `css` does not support template interpolation, so the font-face URL cannot use `_resourcesPath`. Instead, inject it as an inline style on the host element from `render()`. Add this line inside `render()` before the `return html\`...\``:

```typescript
// Inject font dynamically so it respects resources_path (HACS vs manual install)
if (!this.shadowRoot!.querySelector('style[data-font]')) {
  const s = document.createElement('style');
  s.setAttribute('data-font', '');
  s.textContent = `@font-face { font-family: 'segment7'; src: url('${this._resourcesPath}/fonts/7segment.woff') format('woff'); }`;
  this.shadowRoot!.appendChild(s);
}
```

Remove the `@font-face` block from `static styles` entirely.

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
  if (!showProgressBar(opState)) {
    // Reserve space so the card height stays consistent
    return html`<div class="progress-bar-spacer"></div>`;
  }

  const progress = getProgressPercent(this.hass, this._config);
  if (progress === null) {
    // Sensor unavailable — hide bar but keep spacer
    return html`<div class="progress-bar-spacer"></div>`;
  }

  const barClass =
    opState === 'ready' ? 'bar-preheat'
    : opState === 'pause' ? 'bar-run bar-paused'
    : 'bar-run';

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

- [ ] **Step 3: Add progress bar CSS to `static styles`**

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

  .bar-preheat {
    background: linear-gradient(90deg, #f44444, #f4a427);
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
git commit -m "feat: render progress bar with state-dependent gradient"
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
  const doorState = this.hass.states[this._config.door_entity]?.state;

  const setpoint =
    setpointState && setpointState !== 'unavailable' && setpointState !== 'unknown'
      ? setpointState
      : null;
  const cavity =
    cavityState && cavityState !== 'unavailable' ? cavityState : null;
  const door =
    doorState && doorState !== 'unavailable' ? doorState : null;

  return html`
    <div class="details-row">
      ${setpoint ? html`<span class="detail-item">🌡 Set: ${setpoint}°C</span>` : nothing}
      ${cavity ? html`<span class="detail-item">🌡 Cavity: ${cavity}°C</span>` : nothing}
      ${progress !== null ? html`<span class="detail-item">▓ ${progress}%</span>` : nothing}
      ${door ? html`<span class="detail-item">🚪 ${door}</span>` : nothing}
    </div>
  `;
}
```

- [ ] **Step 2: Update `render()` to include the details row below `.card-main`**

```typescript
return html`
  <ha-card>
    <div class="card-main">
      <div class="zone-image">
        <img
          src="/hacsfiles/siemens-oven-card/images/oven-bg.png"
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
git commit -m "feat: render conditional details row (setpoint, cavity, progress, door)"
```

---

## Task 13: Visual editor

**Files:**
- Create: `src/editor.ts`
- Modify: `src/siemens-oven-card.ts` (import editor)

- [ ] **Step 1: Write `src/editor.ts`**

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant, SiemensOvenCardConfig } from './types';

const ENTITY_FIELDS: Array<{ key: keyof SiemensOvenCardConfig; label: string }> = [
  { key: 'operation_state_entity', label: 'Operation State Entity' },
  { key: 'active_program_entity', label: 'Active Program Entity' },
  { key: 'remaining_time_entity', label: 'Remaining Time Entity' },
  { key: 'cavity_temp_entity', label: 'Cavity Temperature Entity' },
  { key: 'program_progress_entity', label: 'Program Progress Entity' },
  { key: 'setpoint_temp_entity', label: 'Setpoint Temperature Entity' },
  { key: 'door_entity', label: 'Door Entity' },
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
    const updated: SiemensOvenCardConfig = { ...this._config, [key]: (ev.detail as { value: string }).value };
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

- [ ] **Step 2: Import editor in `src/siemens-oven-card.ts`**

Add this import at the top of `src/siemens-oven-card.ts` (after the existing imports):

```typescript
import './editor';
```

- [ ] **Step 3: Build and verify**

```bash
npm run build
```

Expected: no errors, `dist/siemens-oven-card.js` includes editor code.

- [ ] **Step 4: Commit**

```bash
git add src/editor.ts src/siemens-oven-card.ts
git commit -m "feat: add visual config editor (LovelaceCardEditor)"
```

---

## Task 14: Add font and images to dist/

**Files:**
- Create: `dist/fonts/7segment.woff` (copy from lg-washer-dryer-card)
- Create: `dist/images/.gitkeep` (placeholder until real images provided)

- [ ] **Step 1: Copy the 7segment font**

```bash
cp ~/workspace/lg-washer-dryer-card/config/www/7segment.woff dist/fonts/7segment.woff
```

- [ ] **Step 2: Create placeholder for images directory**

```bash
touch dist/images/.gitkeep
```

The 12 program icon PNGs and `oven-bg.png` will be added by the developer when they have the files. Expected filenames (from the spec):

```
dist/images/oven-bg.png           (960×400px oven background)
dist/images/hot-air.png           (128×128px)
dist/images/top-bottom.png
dist/images/hot-air-eco.png
dist/images/top-bottom-eco.png
dist/images/hot-air-grill.png
dist/images/pizza.png
dist/images/slow-cook.png
dist/images/bottom-heat.png
dist/images/keep-warm.png
dist/images/preheat-ovenware.png
dist/images/frozen.png
dist/images/sabbath.png
```

- [ ] **Step 3: Update `.gitignore` — ensure font and images are tracked**

Confirm `.gitignore` does NOT contain `dist/fonts/` or `dist/images/`. Only `dist/siemens-oven-card.js` is ignored (it's generated). The current `.gitignore` is already correct.

- [ ] **Step 4: Commit font**

```bash
git add dist/fonts/7segment.woff dist/images/.gitkeep
git commit -m "chore: add 7segment font and images placeholder to dist/"
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

`content_in_root: false` tells HACS to install everything from `dist/` (including `dist/images/` and `dist/fonts/`) to `/hacsfiles/siemens-oven-card/`.

- [ ] **Step 2: Write `README.md`**

```markdown
# Siemens Oven Card

A Home Assistant Lovelace card for Siemens ovens connected via the [Home Connect integration](https://www.home-assistant.io/integrations/home_connect/).

Displays the oven's current heating program, timer, and preheat progress in a panel that matches the oven's physical display aesthetic.

## Supported models

- Siemens HB676G5S6 (designed and tested)
- Expected to work on any Siemens/Bosch oven using the Home Connect integration

## Installation (HACS)

1. Open HACS → Frontend → Explore & Download Repositories
2. Search for **Siemens Oven Card** → Download
3. Add the card to your dashboard and configure your entity IDs

## Configuration

```yaml
type: custom:siemens-oven-card
operation_state_entity: sensor.oven_operation_state
active_program_entity: select.oven_active_program
remaining_time_entity: sensor.oven_remaining_program_time
cavity_temp_entity: sensor.oven_current_oven_cavity_temperature
program_progress_entity: sensor.oven_program_progress
setpoint_temp_entity: number.oven_setpoint_temperature
door_entity: sensor.oven_door
name: Oven  # optional
```

Rename each entity ID to match your oven. Find them in **Developer Tools → States** and filter by your oven's name.

## Notes

- The progress bar requires `sensor.oven_program_progress` to report a value while running. On some firmware versions this sensor stays unavailable — the card hides the bar gracefully in that case.
- The 7-segment font (© Jan Bobrowski, OFL) is bundled in the release.
```

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

Expected: All tests PASS (timer + state suites).

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: `dist/siemens-oven-card.js` created, no TypeScript errors, no rollup warnings.

- [ ] **Step 3: Verify dist/ structure**

```bash
ls -la dist/
ls -la dist/images/
ls -la dist/fonts/
```

Expected:
```
dist/siemens-oven-card.js   ← generated (not committed)
dist/images/.gitkeep        ← placeholder (images added by developer)
dist/fonts/7segment.woff    ← committed
```

- [ ] **Step 4: Check bundle size**

```bash
wc -c dist/siemens-oven-card.js
```

Expected: under 100KB (LitElement + card code minified).

- [ ] **Step 5: Final commit**

```bash
git add .
git status  # confirm only expected files
git commit -m "chore: verified build and tests pass"
```

---

## Post-implementation: Add images

When the developer has prepared the oven background and 12 program icon PNGs:

```bash
# Copy images into dist/images/
cp ~/Downloads/oven-bg.png dist/images/
cp ~/Downloads/hot-air.png dist/images/
# ... repeat for all 12 program icons

# Remove placeholder
rm dist/images/.gitkeep

git add dist/images/
git commit -m "chore: add oven background and program icon images"
```

Then create the first GitHub release — HACS will pick up `dist/` automatically.

---

## Self-Review Notes

**Spec coverage check:**
- ✅ Three-zone layout (Tasks 8, 9, 10)
- ✅ Progress bar with state-dependent gradient (Task 11)
- ✅ Conditional details row (Task 12)
- ✅ 12 program icon mappings in PROGRAM_ICON_MAP (Task 4)
- ✅ Timer: remaining from ISO timestamp (Task 10, `_getTimerInfo`)
- ✅ Timer: elapsed from `last_changed` when no remaining time (Task 10, `_getTimerInfo`)
- ✅ Graceful degradation when `program_progress` unavailable (Task 11)
- ✅ Visual editor (Task 13)
- ✅ Images + font in `dist/` for HACS auto-install (Task 14)
- ✅ `hacs.json` with `content_in_root: false` (Task 15)
- ✅ All 8 operation states handled (Tasks 9, 10, 11, 12)
- ✅ `setConfig` validation with clear error messages (Task 7)
- ✅ Timer re-renders every 30s via `setInterval` + `_tick` property (Task 7)
- ✅ `resources_path` config option for HACS vs manual installs (Tasks 3, 4, 7, 9, 10, 13)
- ✅ Font injected dynamically via shadow DOM to respect `resources_path` (Task 10)
