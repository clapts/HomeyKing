export const LightingPriority = {
  AUTOMATION: 40,
  MODE: 60,
  MANUAL: 80,
  SAFETY: 100,
} as const;

export type LightingPriorityValue =
  (typeof LightingPriority)[keyof typeof LightingPriority];

export const BedroomLights = {
  MAIN: 'bedroom.claudio.light.main',
  NIGHT: 'bedroom.claudio.light.night',
  CLOSET: 'bedroom.claudio.closet.light',
} as const;

export type BedroomLightTarget =
  (typeof BedroomLights)[keyof typeof BedroomLights];

export interface LightStatePatch {
  readonly on?: boolean;
  readonly dim?: number;
  readonly temperature?: number;
}

export interface LightingIntent {
  readonly target: string;
  readonly state: LightStatePatch;
  readonly priority: LightingPriorityValue;
  readonly reason: string;
}
