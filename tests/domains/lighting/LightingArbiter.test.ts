import { describe, expect, it } from 'vitest';
import {
  arbitrateLightingIntents,
  LightingConflictError,
} from '../../../src/domains/lighting/LightingArbiter';
import {
  BedroomLights,
  LightingPriority,
} from '../../../src/domains/lighting/LightingIntent';

describe('LightingArbiter', () => {
  it('lets a manual command override a lower-priority mode command for the same light', () => {
    const result = arbitrateLightingIntents([
      {
        target: BedroomLights.CLOSET,
        state: { on: false },
        priority: LightingPriority.MODE,
        reason: 'night-mode-disabled',
      },
      {
        target: BedroomLights.CLOSET,
        state: { on: true, dim: 1 },
        priority: LightingPriority.MANUAL,
        reason: 'closet-switch-pressed',
      },
    ]);

    expect(result).toEqual([
      {
        target: BedroomLights.CLOSET,
        state: { on: true, dim: 1 },
        priority: LightingPriority.MANUAL,
        reason: 'closet-switch-pressed',
      },
    ]);
  });

  it('merges compatible intents at the same priority', () => {
    const result = arbitrateLightingIntents([
      {
        target: BedroomLights.NIGHT,
        state: { temperature: 0.9 },
        priority: LightingPriority.MANUAL,
        reason: 'scene-up-temperature',
      },
      {
        target: BedroomLights.NIGHT,
        state: { on: false },
        priority: LightingPriority.MANUAL,
        reason: 'scene-up-off',
      },
    ]);

    expect(result[0]).toEqual({
      target: BedroomLights.NIGHT,
      state: { on: false, temperature: 0.9 },
      priority: LightingPriority.MANUAL,
      reason: 'scene-up-temperature + scene-up-off',
    });
  });

  it('rejects contradictory commands at the same priority instead of relying on execution order', () => {
    expect(() =>
      arbitrateLightingIntents([
        {
          target: BedroomLights.CLOSET,
          state: { on: false },
          priority: LightingPriority.MODE,
          reason: 'rule-a',
        },
        {
          target: BedroomLights.CLOSET,
          state: { on: true },
          priority: LightingPriority.MODE,
          reason: 'rule-b',
        },
      ]),
    ).toThrow(LightingConflictError);
  });
});
