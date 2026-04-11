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
