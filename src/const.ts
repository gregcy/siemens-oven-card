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

// Human-readable label shown beside each program icon — matches oven display text
export const PROGRAM_LABEL_MAP: Record<string, string> = {
  'Cooking.Oven.Program.HeatingMode.HotAir': '4D Hot air',
  'Cooking.Oven.Program.HeatingMode.TopBottomHeating': 'Top and bottom heat',
  'Cooking.Oven.Program.HeatingMode.HotAirEco': 'Hot air eco',
  'Cooking.Oven.Program.HeatingMode.TopBottomHeatingEco': 'Top and bottom heat eco',
  'Cooking.Oven.Program.HeatingMode.HotAirGrilling': 'Hot air grilling',
  'Cooking.Oven.Program.HeatingMode.PizzaSetting': 'Pizza setting',
  'Cooking.Oven.Program.HeatingMode.SlowCook': 'Low-temperature cooking',
  'Cooking.Oven.Program.HeatingMode.BottomHeating': 'Bottom heat',
  'Cooking.Oven.Program.HeatingMode.KeepWarm': 'Keep warm',
  'Cooking.Oven.Program.HeatingMode.PreheatOvenware': 'Plate warming',
  'Cooking.Oven.Program.HeatingMode.FrozenHeatupSpecial': 'coolStart function',
  'Cooking.Oven.Program.HeatingMode.GrillLargeArea': 'Grill, large area',
  'Cooking.Oven.Program.HeatingMode.GrillSmallArea': 'Grill, small area',
};
