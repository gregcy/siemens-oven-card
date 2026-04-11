# Siemens Oven Card

A Home Assistant Lovelace card for Siemens ovens connected via the [home-connect-hass](https://github.com/ekutner/home-connect-hass) alternative integration.

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
