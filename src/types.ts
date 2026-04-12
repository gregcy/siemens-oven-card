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
  elapsed_time_entity?: string; // no longer used — elapsed derived from operation_state last_changed
  cavity_temp_entity: string;
  setpoint_temp_entity: string;
  program_progress_entity: string;
  door_entity: string; // binary_sensor — off=closed, on=open
  // Optional
  remote_control_entity?: string; // binary_sensor — on=remote start allowed
  connected_entity?: string;      // binary_sensor — on=connected
  childlock_entity?: string;      // binary_sensor — on=child lock active
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
