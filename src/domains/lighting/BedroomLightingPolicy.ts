import {
  BedroomLights,
  type LightingIntent,
  LightingPriority,
} from './LightingIntent';

export type ClosetMotionSensor = 'entry' | 'internal';

export interface BedroomLightingSnapshot {
  readonly nightMode: boolean;
  readonly mainLightOn: boolean;
  readonly closetLightOn: boolean;
  readonly entryMotion: boolean;
  readonly internalMotion: boolean;
}

export interface LightingDecision {
  readonly nextNightMode: boolean;
  readonly intents: readonly LightingIntent[];
}

export class BedroomLightingPolicy {
  toggleNight(snapshot: BedroomLightingSnapshot): LightingDecision {
    if (!snapshot.nightMode) {
      return {
        nextNightMode: true,
        intents: [
          {
            target: BedroomLights.MAIN,
            state: { on: false },
            priority: LightingPriority.MODE,
            reason: 'night-mode-enabled',
          },
          {
            target: BedroomLights.NIGHT,
            state: { on: true, dim: 0.35 },
            priority: LightingPriority.MODE,
            reason: 'night-mode-enabled',
          },
          {
            target: BedroomLights.CLOSET,
            state: { on: true, dim: 0.51 },
            priority: LightingPriority.MODE,
            reason: 'night-mode-enabled',
          },
        ],
      };
    }

    return {
      nextNightMode: false,
      intents: [
        {
          target: BedroomLights.MAIN,
          state: { on: true, dim: 1 },
          priority: LightingPriority.MODE,
          reason: 'night-mode-disabled',
        },
        {
          target: BedroomLights.NIGHT,
          state: { on: false },
          priority: LightingPriority.MODE,
          reason: 'night-mode-disabled',
        },
        {
          target: BedroomLights.CLOSET,
          state: { on: false },
          priority: LightingPriority.MODE,
          reason: 'night-mode-disabled',
        },
      ],
    };
  }

  closetSwitchOn(snapshot: BedroomLightingSnapshot): LightingDecision {
    if (snapshot.nightMode) {
      return {
        nextNightMode: false,
        intents: [
          {
            target: BedroomLights.NIGHT,
            state: { on: false },
            priority: LightingPriority.MODE,
            reason: 'exit-night-from-closet-switch',
          },
          {
            target: BedroomLights.CLOSET,
            state: { on: true, dim: 1 },
            priority: LightingPriority.MANUAL,
            reason: 'closet-switch-pressed-during-night',
          },
        ],
      };
    }

    return {
      nextNightMode: false,
      intents: [
        {
          target: BedroomLights.CLOSET,
          state: snapshot.closetLightOn
            ? { on: false }
            : { on: true, dim: 1 },
          priority: LightingPriority.MANUAL,
          reason: 'closet-switch-toggle',
        },
      ],
    };
  }

  mainLightToggle(snapshot: BedroomLightingSnapshot): LightingDecision {
    const intents: LightingIntent[] = [];

    if (snapshot.nightMode) {
      intents.push(
        {
          target: BedroomLights.NIGHT,
          state: { on: false },
          priority: LightingPriority.MODE,
          reason: 'exit-night-from-main-light-control',
        },
        {
          target: BedroomLights.CLOSET,
          state: { on: false },
          priority: LightingPriority.MODE,
          reason: 'exit-night-from-main-light-control',
        },
      );
    }

    intents.push({
      target: BedroomLights.MAIN,
      state: snapshot.mainLightOn ? { on: false } : { on: true, dim: 1 },
      priority: LightingPriority.MANUAL,
      reason: 'main-light-manual-toggle',
    });

    return {
      nextNightMode: false,
      intents,
    };
  }

  bedroomDoorOpened(snapshot: BedroomLightingSnapshot): LightingDecision {
    if (snapshot.nightMode) {
      return { nextNightMode: true, intents: [] };
    }

    return {
      nextNightMode: false,
      intents: [
        {
          target: BedroomLights.MAIN,
          state: { on: true },
          priority: LightingPriority.AUTOMATION,
          reason: 'bedroom-door-opened',
        },
      ],
    };
  }

  closetMotionChanged(
    snapshot: BedroomLightingSnapshot,
    sensor: ClosetMotionSensor,
    active: boolean,
  ): LightingDecision {
    if (snapshot.nightMode) {
      return { nextNightMode: true, intents: [] };
    }

    const entryMotion = sensor === 'entry' ? active : snapshot.entryMotion;
    const internalMotion = sensor === 'internal' ? active : snapshot.internalMotion;

    if (active) {
      return {
        nextNightMode: false,
        intents: [
          {
            target: BedroomLights.CLOSET,
            state: { on: true, dim: 1 },
            priority: LightingPriority.AUTOMATION,
            reason: `closet-motion-${sensor}-detected`,
          },
        ],
      };
    }

    if (!entryMotion && !internalMotion) {
      return {
        nextNightMode: false,
        intents: [
          {
            target: BedroomLights.CLOSET,
            state: { on: false },
            priority: LightingPriority.AUTOMATION,
            reason: 'closet-both-motion-sensors-clear',
          },
        ],
      };
    }

    return { nextNightMode: false, intents: [] };
  }

  sceneUp(snapshot: BedroomLightingSnapshot): LightingDecision {
    if (snapshot.nightMode) {
      return { nextNightMode: true, intents: [] };
    }

    return {
      nextNightMode: false,
      intents: [
        {
          target: BedroomLights.CLOSET,
          state: { on: false },
          priority: LightingPriority.MANUAL,
          reason: 'bed-remote-scene-up',
        },
        {
          target: BedroomLights.MAIN,
          state: { temperature: 0.9 },
          priority: LightingPriority.MANUAL,
          reason: 'bed-remote-scene-up',
        },
        {
          target: BedroomLights.NIGHT,
          state: { on: false, temperature: 0.9 },
          priority: LightingPriority.MANUAL,
          reason: 'bed-remote-scene-up',
        },
      ],
    };
  }
}
