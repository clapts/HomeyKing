export type HomeEventType =
  | 'SYSTEM_STARTED'
  | 'DEVICE_STATE_CHANGED'
  | 'DEVICE_UNAVAILABLE'
  | 'BEDROOM_DOOR_OPENED'
  | 'BEDROOM_DOOR_CLOSED'
  | 'MOTION_DETECTED'
  | 'MOTION_ENDED'
  | 'WALL_SWITCH_PRESSED'
  | 'NIGHT_MODE_REQUESTED'
  | 'NIGHT_MODE_ACTIVATED'
  | 'NIGHT_MODE_DEACTIVATED'
  | 'PC_WAKE_REQUESTED'
  | 'PC_SHUTDOWN_REQUESTED';

export interface HomeEvent<TPayload = unknown> {
  readonly id: string;
  readonly type: HomeEventType;
  readonly occurredAt: Date;
  readonly source: string;
  readonly payload: TPayload;
}
