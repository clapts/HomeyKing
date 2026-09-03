import type { BedroomEvent, BedroomObservedLight } from './BedroomEvent';
import {
  BedroomLightingPolicy,
  type BedroomLightingSnapshot,
  type LightingDecision,
} from './BedroomLightingPolicy';
import { arbitrateLightingIntents } from './LightingArbiter';
import { BedroomLights, type LightingIntent } from './LightingIntent';

export interface BedroomEngineState extends BedroomLightingSnapshot {
  readonly nightLightOn: boolean;
}

export interface BedroomEngineResult {
  readonly state: Readonly<BedroomEngineState>;
  readonly intents: readonly LightingIntent[];
}

const defaultState: BedroomEngineState = {
  nightMode: false,
  mainLightOn: false,
  nightLightOn: false,
  closetLightOn: false,
  entryMotion: false,
  internalMotion: false,
};

export class BedroomAutomationEngine {
  private state: BedroomEngineState;

  constructor(
    initialState: Partial<BedroomEngineState> = {},
    private readonly policy = new BedroomLightingPolicy(),
  ) {
    this.state = { ...defaultState, ...initialState };
  }

  getState(): Readonly<BedroomEngineState> {
    return { ...this.state };
  }

  handle(event: BedroomEvent): BedroomEngineResult {
    if (event.type === 'LIGHT_STATE_OBSERVED') {
      this.reconcileObservedLight(event.target, event.on);
      return this.result([]);
    }

    const snapshot = this.getPolicySnapshot();
    const decision = this.decide(event, snapshot);
    const intents = arbitrateLightingIntents(decision.intents);

    this.state = {
      ...this.state,
      nightMode: decision.nextNightMode,
    };

    if (event.type === 'CLOSET_MOTION_CHANGED') {
      this.state = {
        ...this.state,
        entryMotion:
          event.sensor === 'entry' ? event.active : this.state.entryMotion,
        internalMotion:
          event.sensor === 'internal' ? event.active : this.state.internalMotion,
      };
    }

    for (const intent of intents) {
      this.applyIntent(intent);
    }

    return this.result(intents);
  }

  private decide(
    event: Exclude<BedroomEvent, { type: 'LIGHT_STATE_OBSERVED' }>,
    snapshot: BedroomLightingSnapshot,
  ): LightingDecision {
    switch (event.type) {
      case 'NIGHT_TOGGLE_REQUESTED':
        return this.policy.toggleNight(snapshot);
      case 'CLOSET_SWITCH_ON':
        return this.policy.closetSwitchOn(snapshot);
      case 'MAIN_LIGHT_TOGGLE_REQUESTED':
        return this.policy.mainLightToggle(snapshot);
      case 'BEDROOM_DOOR_OPENED':
        return this.policy.bedroomDoorOpened(snapshot);
      case 'CLOSET_MOTION_CHANGED':
        return this.policy.closetMotionChanged(
          snapshot,
          event.sensor,
          event.active,
        );
      case 'SCENE_UP_REQUESTED':
        return this.policy.sceneUp(snapshot);
    }
  }

  private getPolicySnapshot(): BedroomLightingSnapshot {
    return {
      nightMode: this.state.nightMode,
      mainLightOn: this.state.mainLightOn,
      closetLightOn: this.state.closetLightOn,
      entryMotion: this.state.entryMotion,
      internalMotion: this.state.internalMotion,
    };
  }

  private applyIntent(intent: LightingIntent): void {
    if (intent.state.on === undefined) return;

    if (intent.target === BedroomLights.MAIN) {
      this.state = { ...this.state, mainLightOn: intent.state.on };
      return;
    }

    if (intent.target === BedroomLights.NIGHT) {
      this.state = { ...this.state, nightLightOn: intent.state.on };
      return;
    }

    if (intent.target === BedroomLights.CLOSET) {
      this.state = { ...this.state, closetLightOn: intent.state.on };
    }
  }

  private reconcileObservedLight(target: BedroomObservedLight, on: boolean): void {
    switch (target) {
      case 'main':
        this.state = { ...this.state, mainLightOn: on };
        return;
      case 'night':
        this.state = { ...this.state, nightLightOn: on };
        return;
      case 'closet':
        this.state = { ...this.state, closetLightOn: on };
    }
  }

  private result(intents: readonly LightingIntent[]): BedroomEngineResult {
    return {
      state: this.getState(),
      intents: [...intents],
    };
  }
}
