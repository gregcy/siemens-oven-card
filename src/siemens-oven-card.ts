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
            <div class="zones-row">
              ${this._renderZone2(opState)}
              ${this._renderZone3(opState)}
            </div>
            ${this._renderProgressBar(opState)}
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
  `;
}
