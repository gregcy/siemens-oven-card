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
(window as unknown as Record<string, unknown>)['customCards'] ??= [];
((window as unknown as Record<string, unknown>)['customCards'] as unknown[]).push({
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
}
