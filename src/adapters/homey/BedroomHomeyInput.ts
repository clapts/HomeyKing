export const BedroomHomeyDevices = {
  DOOR: 'bedroom.claudio.door',
  MOTION_ENTRY: 'bedroom.claudio.closet.motion.entry',
  MOTION_INTERNAL: 'bedroom.claudio.closet.motion.internal',
  CLOSET_SWITCH: 'bedroom.claudio.closet.switch',
  EXTERNAL_SWITCH: 'bedroom.claudio.switch.external',
  BED_REMOTE: 'bedroom.claudio.remote.bed',
  MAIN_LIGHT: 'bedroom.claudio.light.main',
  NIGHT_LIGHT: 'bedroom.claudio.light.night',
  CLOSET_LIGHT: 'bedroom.claudio.closet.light',
} as const;

export type BedroomHomeyDevice =
  (typeof BedroomHomeyDevices)[keyof typeof BedroomHomeyDevices];

export type HomeyCapabilityInput = {
  readonly type: 'CAPABILITY_CHANGED';
  readonly device: string;
  readonly capability: string;
  readonly value: unknown;
};

export type HomeyTransientInput = {
  readonly type: 'TRANSIENT_TRIGGER';
  readonly device: string;
  readonly trigger: string;
};

export type BedroomHomeyInput = HomeyCapabilityInput | HomeyTransientInput;
