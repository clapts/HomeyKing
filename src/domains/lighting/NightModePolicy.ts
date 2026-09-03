export interface NightLightingState {
  mainLight: { on: boolean; dim: number };
  nightLight: { on: boolean; dim: number };
  closetLight: { on: boolean; dim: number };
}

export class NightModePolicy {
  enable(): NightLightingState {
    return {
      mainLight: { on: false, dim: 0 },
      nightLight: { on: true, dim: 0.35 },
      closetLight: { on: true, dim: 0.51 },
    };
  }

  disable(): NightLightingState {
    return {
      mainLight: { on: true, dim: 1 },
      nightLight: { on: false, dim: 0 },
      closetLight: { on: false, dim: 0 },
    };
  }
}
