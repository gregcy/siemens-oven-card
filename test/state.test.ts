import { describe, it, expect } from 'vitest';
import {
  getOperationState,
  getProgramIconPath,
  getProgressPercent,
  showDetailsRow,
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
      .toBe('/hacsfiles/siemens-oven-card/images/hot-air.svg');
  });

  it('returns the correct manual install path for a known program', () => {
    expect(getProgramIconPath('Cooking.Oven.Program.HeatingMode.HotAir', MANUAL_PATH))
      .toBe('/local/siemens-oven-card/images/hot-air.svg');
  });

  it('returns null for unknown program state', () => {
    expect(getProgramIconPath('unknown', HACS_PATH)).toBeNull();
    expect(getProgramIconPath('unavailable', HACS_PATH)).toBeNull();
    expect(getProgramIconPath('', HACS_PATH)).toBeNull();
  });

  it('returns correct path for pizza', () => {
    expect(getProgramIconPath('Cooking.Oven.Program.HeatingMode.PizzaSetting', HACS_PATH))
      .toBe('/hacsfiles/siemens-oven-card/images/pizza.svg');
  });

  it('returns correct path for grill large area', () => {
    expect(getProgramIconPath('Cooking.Oven.Program.HeatingMode.GrillLargeArea', HACS_PATH))
      .toBe('/hacsfiles/siemens-oven-card/images/grill-large.svg');
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

