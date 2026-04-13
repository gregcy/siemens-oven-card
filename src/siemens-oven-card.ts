import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { CARD_VERSION, DEFAULT_RESOURCES_PATH, PROGRAM_LABEL_MAP } from './const';
import { formatTime, getRemainingSeconds, parseElapsedToSeconds, getSecondsSince } from './timer';
import {
  getOperationState,
  getProgramIconPath,
  getProgressPercent,
  showDetailsRow,
  showProgressBar,
} from './state';
import type { HomeAssistant, OperationState, SiemensOvenCardConfig, TimerInfo } from './types';
import './editor';

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

  // Tracks the last known elapsed seconds while running, so we can freeze it on pause
  private _lastElapsedSeconds: number | null = null;
  // The entity last_updated value when we last computed elapsed, so we can detect entity refreshes
  private _lastElapsedUpdated: string | null = null;

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

    const tintClass = 'tint-green';

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
      return { display: '', label: '', colorClass: 'dim' };
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

    // No timer set (progress === 100) — use elapsed entity + interpolate seconds.
    // The entity reports h:mm (minute precision). We interpolate within the current
    // minute using last_updated. While paused, we freeze the last known good value
    // so the timer doesn't reset if the entity goes unavailable.
    const elapsedEntity = this._config.elapsed_time_entity
      ? this.hass.states[this._config.elapsed_time_entity]
      : undefined;

    if (opState === 'pause') {
      // Return the last known elapsed — don't read entity (may be unavailable/reset)
      return {
        display: this._lastElapsedSeconds !== null ? formatTime(this._lastElapsedSeconds) : '',
        label: 'paused',
        colorClass: 'amber',
      };
    }

    // Running: if the entity has a new update, reset our interpolation base
    const entityUpdated = elapsedEntity?.last_updated ?? '';
    if (entityUpdated !== this._lastElapsedUpdated) {
      const baseSeconds = parseElapsedToSeconds(elapsedEntity?.state ?? '');
      if (baseSeconds !== null) {
        this._lastElapsedSeconds = baseSeconds;
        this._lastElapsedUpdated = entityUpdated;
      }
    }

    // Interpolate seconds since the entity last updated (capped at 60s)
    const secondsSinceUpdate = Math.min(getSecondsSince(entityUpdated) ?? 0, 60);
    const totalElapsed = this._lastElapsedSeconds !== null
      ? this._lastElapsedSeconds + secondsSinceUpdate
      : null;
    return {
      display: totalElapsed !== null ? formatTime(totalElapsed) : '',
      label: 'elapsed',
      colorClass: 'green',
    };
  }

  private _getStatusIconPath(): string | null {
    const remoteState = this._config.remote_control_entity
      ? this.hass.states[this._config.remote_control_entity]?.state
      : undefined;
    const connectedState = this._config.connected_entity
      ? this.hass.states[this._config.connected_entity]?.state
      : undefined;

    if (remoteState === 'on') {
      return `${this._resourcesPath}/images/remote-start-icon.svg`;
    }
    if (connectedState === 'off') {
      return `${this._resourcesPath}/images/not-connected-icon.svg`;
    }
    if (connectedState === 'on') {
      return `${this._resourcesPath}/images/connected-icon.svg`;
    }
    return null;
  }

  private _isChildLockOn(): boolean {
    if (!this._config.childlock_entity) return false;
    return this.hass.states[this._config.childlock_entity]?.state === 'on';
  }

  private _renderTopBar(opState: OperationState) {
    void this._tick; // Reference _tick so LitElement re-renders on interval
    const timer = this._getTimerInfo(opState);
    const statusIcon = this._getStatusIconPath();
    const active = opState !== 'inactive';
    const childLock = this._isChildLockOn();

    return html`
      <div class="top-bar ${active ? 'bar-active' : ''}">
        <div class="top-bar-left">
        </div>
        <div class="top-bar-right">
          ${childLock
            ? html`<img class="status-icon" src="${this._resourcesPath}/images/childlock-icon.svg" alt="child lock" />`
            : nothing}
          ${timer.display
            ? html`<span class="top-timer ${timer.colorClass}">${timer.display}</span>`
            : nothing}
          ${statusIcon
            ? html`<img class="status-icon" src="${statusIcon}" alt="status" />`
            : nothing}
        </div>
      </div>
    `;
  }

  private _renderSetpoint(opState: OperationState) {
    const isActive = opState === 'run' || opState === 'pause';
    if (!isActive) return html`<div class="zone-setpoint"></div>`;

    const setpointState = this.hass.states[this._config.setpoint_temp_entity]?.state;
    const setpoint =
      setpointState && setpointState !== 'unavailable' && setpointState !== 'unknown'
        ? setpointState
        : null;

    return html`
      <div class="zone-setpoint">
        ${setpoint ? html`<span class="setpoint-value">${setpoint}°C</span>` : nothing}
      </div>
    `;
  }

  private _renderDetails(opState: OperationState) {
    if (!showDetailsRow(opState)) return nothing;

    const cavityState = this.hass.states[this._config.cavity_temp_entity]?.state;
    const progress = getProgressPercent(this.hass, this._config);
    // door_entity is a binary_sensor: off=closed, on=open
    const doorState = this.hass.states[this._config.door_entity]?.state;

    const cavity =
      cavityState && cavityState !== 'unavailable' && cavityState !== 'unknown'
        ? cavityState
        : null;
    const doorLabel =
      doorState === 'on' ? 'open' : doorState === 'off' ? 'closed' : null;

    return html`
      <div class="details-row">
        ${cavity ? html`<span class="detail-item">${cavity}°C actual</span>` : nothing}
        ${progress !== null ? html`<span class="detail-item">${progress}%</span>` : nothing}
        ${doorLabel ? html`<span class="detail-item">door ${doorLabel}</span>` : nothing}
      </div>
    `;
  }

  private _renderProgressBar(opState: OperationState) {
    if (!showProgressBar(this.hass, this._config, opState)) {
      return nothing;
    }

    const progress = getProgressPercent(this.hass, this._config)!;
    const barClass = opState === 'pause' ? 'bar-run bar-paused' : 'bar-run';

    return html`
      <div
        class="progress-bar ${barClass}"
        style="width: ${progress}%"
        role="progressbar"
        aria-valuenow="${progress}"
        aria-valuemin="0"
        aria-valuemax="100"
      ></div>
    `;
  }

  connectedCallback(): void {
    super.connectedCallback();
    // Refresh every second so mm:ss timer stays accurate
    this._tickInterval = setInterval(() => { this._tick++; }, 1_000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    clearInterval(this._tickInterval);
  }

  render() {
    if (!this._config || !this.hass) return nothing;

    // Inject BoschSerif font dynamically to respect resources_path
    if (!this.shadowRoot!.querySelector('style[data-font]')) {
      const s = document.createElement('style');
      s.setAttribute('data-font', '');
      s.textContent = `@font-face { font-family: 'BoschSerif'; src: url('${this._resourcesPath}/fonts/BoschSerif-Regular.woff') format('woff'); }`;
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
            ${this._renderTopBar(opState)}
            <div class="main-row">
              ${this._renderZone2(opState)}
              ${this._renderSetpoint(opState)}
            </div>
            <div class="bottom-bar ${opState !== 'inactive' ? 'bar-active' : ''}">
              ${this._renderProgressBar(opState)}
            </div>
          </div>
        </div>
        ${this._renderDetails(opState)}
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

    /* ── Main card area ── */

    .card-main {
      position: relative;
      height: 180px;
    }

    .zone-image {
      position: absolute;
      inset: 0;
    }

    .zone-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .right-panel {
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 55%;
      display: flex;
      flex-direction: column;
    }

    /* ── Top bar ── */

    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 14px;
      height: 30px;
      flex-shrink: 0;
    }

    .top-bar.bar-active {
      border-bottom: 2px solid #009fe3;
    }

    .top-bar-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .top-bar-right {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .top-timer {
      font-family: 'BoschSerif', sans-serif;
      font-size: 22px;
      letter-spacing: 0.5px;
    }

    .top-timer.green { color: #fff; filter: drop-shadow(0 0 6px rgba(0, 159, 227, 0.6)); }
    .top-timer.amber { color: #f4a427; filter: drop-shadow(0 0 6px rgba(244, 164, 39, 0.6)); }
    .top-timer.dim   { color: #555; }

    .status-icon {
      height: 18px;
      width: auto;
      display: block;
      filter: drop-shadow(0 0 6px rgba(0, 159, 227, 0.6));
    }

    /* ── Main content row ── */

    .main-row {
      display: flex;
      flex: 1;
      align-items: center;
    }

    .zone-icon {
      flex: 0 0 55%;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 10px;
      padding: 0 14px;
      overflow: hidden;
    }

    .program-icon {
      width: 84px;
      height: 84px;
      flex-shrink: 0;
      image-rendering: crisp-edges;
    }

    .program-icon.tint-green {
      filter: drop-shadow(0 0 6px rgba(0, 159, 227, 0.6));
    }

    .program-icon.tint-amber {
      filter: drop-shadow(0 0 6px rgba(244, 164, 39, 0.6));
    }

    .program-label {
      font-family: 'BoschSerif', sans-serif;
      font-size: 22px;
      color: #fff;
      line-height: 1.3;
      filter: drop-shadow(0 0 6px rgba(0, 159, 227, 0.6));
    }

    .warning-icon {
      font-size: 28px;
      color: #f44;
      filter: drop-shadow(0 0 6px rgba(255, 68, 68, 0.6));
    }

    .zone-setpoint {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      padding-left: 8px;
    }

    .setpoint-value {
      font-family: 'BoschSerif', sans-serif;
      font-size: 34px;
      color: #fff;
      letter-spacing: 0.5px;
      filter: drop-shadow(0 0 6px rgba(0, 159, 227, 0.6));
    }

    /* ── Bottom bar ── */

    .bottom-bar {
      position: relative;
      height: 20px;
      flex-shrink: 0;
      overflow: hidden;
    }

    .bottom-bar.bar-active {
      border-bottom: 2px solid #009fe3;
    }

    .progress-bar {
      position: absolute;
      inset: 0;
      transition: width 0.5s ease;
    }

    .bar-run {
      background: rgba(0, 159, 227, 0.2);
    }

    .bar-paused {
      opacity: 0.5;
    }

    /* ── Details row ── */

    .details-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px 20px;
      padding: 8px 16px;
      background: #111;
      border-top: 1px solid #1a1a1a;
    }

    .detail-item {
      font-family: 'BoschSerif', sans-serif;
      font-size: 12px;
      color: #aaa;
      filter: drop-shadow(0 0 4px rgba(0, 159, 227, 0.5));
    }
  `;
}
