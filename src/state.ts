import { PROGRAM_ICON_MAP } from './const';
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

