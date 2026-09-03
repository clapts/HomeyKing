import type { ClosetMotionSensor } from './BedroomLightingPolicy';

export type MainLightToggleSource =
  | 'closet-switch-off'
  | 'bed-remote-on'
  | 'external-switch';

export type BedroomObservedLight = 'main' | 'night' | 'closet';

export type BedroomEvent =
  | { readonly type: 'NIGHT_TOGGLE_REQUESTED' }
  | { readonly type: 'CLOSET_SWITCH_ON' }
  | {
      readonly type: 'MAIN_LIGHT_TOGGLE_REQUESTED';
      readonly source: MainLightToggleSource;
    }
  | { readonly type: 'BEDROOM_DOOR_OPENED' }
  | {
      readonly type: 'CLOSET_MOTION_CHANGED';
      readonly sensor: ClosetMotionSensor;
      readonly active: boolean;
    }
  | { readonly type: 'SCENE_UP_REQUESTED' }
  | {
      readonly type: 'LIGHT_STATE_OBSERVED';
      readonly target: BedroomObservedLight;
      readonly on: boolean;
    };
