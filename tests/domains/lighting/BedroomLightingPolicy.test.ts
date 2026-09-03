import { describe, expect, it } from 'vitest';
import { BedroomLightingPolicy } from '../../../src/domains/lighting/BedroomLightingPolicy';
import { BedroomLights } from '../../../src/domains/lighting/LightingIntent';

const baseSnapshot = {
  nightMode: false,
  mainLightOn: false,
  closetLightOn: false,
  entryMotion: false,
  internalMotion: false,
} as const;

describe('BedroomLightingPolicy', () => {
  const policy = new BedroomLightingPolicy();

  it('enables the legacy night scene', () => {
    const decision = policy.toggleNight(baseSnapshot);

    expect(decision.nextNightMode).toBe(true);
    expect(decision.intents).toEqual([
      expect.objectContaining({ target: BedroomLights.MAIN, state: { on: false } }),
      expect.objectContaining({ target: BedroomLights.NIGHT, state: { on: true, dim: 0.35 } }),
      expect.objectContaining({ target: BedroomLights.CLOSET, state: { on: true, dim: 0.51 } }),
    ]);
  });

  it('disables night mode and restores the legacy normal scene', () => {
    const decision = policy.toggleNight({ ...baseSnapshot, nightMode: true });

    expect(decision.nextNightMode).toBe(false);
    expect(decision.intents).toEqual([
      expect.objectContaining({ target: BedroomLights.MAIN, state: { on: true, dim: 1 } }),
      expect.objectContaining({ target: BedroomLights.NIGHT, state: { on: false } }),
      expect.objectContaining({ target: BedroomLights.CLOSET, state: { on: false } }),
    ]);
  });

  it('ignores closet motion while night mode is active', () => {
    const decision = policy.closetMotionChanged(
      { ...baseSnapshot, nightMode: true, closetLightOn: true },
      'entry',
      true,
    );

    expect(decision.nextNightMode).toBe(true);
    expect(decision.intents).toEqual([]);
  });

  it('turns the closet light fully on when either motion sensor activates outside night mode', () => {
    const decision = policy.closetMotionChanged(baseSnapshot, 'internal', true);

    expect(decision.intents).toEqual([
      expect.objectContaining({
        target: BedroomLights.CLOSET,
        state: { on: true, dim: 1 },
      }),
    ]);
  });

  it('does not turn the closet off while the other motion sensor remains active', () => {
    const decision = policy.closetMotionChanged(
      { ...baseSnapshot, entryMotion: true, internalMotion: true, closetLightOn: true },
      'entry',
      false,
    );

    expect(decision.intents).toEqual([]);
  });

  it('turns the closet off only when both motion sensors are clear', () => {
    const decision = policy.closetMotionChanged(
      { ...baseSnapshot, entryMotion: true, closetLightOn: true },
      'entry',
      false,
    );

    expect(decision.intents).toEqual([
      expect.objectContaining({ target: BedroomLights.CLOSET, state: { on: false } }),
    ]);
  });

  it('keeps the closet fully on when its switch is used during night mode and exits night', () => {
    const decision = policy.closetSwitchOn({
      ...baseSnapshot,
      nightMode: true,
      closetLightOn: true,
    });

    expect(decision.nextNightMode).toBe(false);
    expect(decision.intents).toEqual([
      expect.objectContaining({ target: BedroomLights.NIGHT, state: { on: false } }),
      expect.objectContaining({ target: BedroomLights.CLOSET, state: { on: true, dim: 1 } }),
    ]);
  });

  it('toggles the main light manually and exits night mode without a race', () => {
    const decision = policy.mainLightToggle({
      ...baseSnapshot,
      nightMode: true,
      mainLightOn: false,
      closetLightOn: true,
    });

    expect(decision.nextNightMode).toBe(false);
    expect(decision.intents).toEqual([
      expect.objectContaining({ target: BedroomLights.NIGHT, state: { on: false } }),
      expect.objectContaining({ target: BedroomLights.CLOSET, state: { on: false } }),
      expect.objectContaining({ target: BedroomLights.MAIN, state: { on: true, dim: 1 } }),
    ]);
  });

  it('opens the main light from the bedroom door only outside night mode', () => {
    expect(policy.bedroomDoorOpened(baseSnapshot).intents).toEqual([
      expect.objectContaining({ target: BedroomLights.MAIN, state: { on: true } }),
    ]);

    expect(
      policy.bedroomDoorOpened({ ...baseSnapshot, nightMode: true }).intents,
    ).toEqual([]);
  });

  it('applies the scene-up reset only outside night mode', () => {
    expect(policy.sceneUp(baseSnapshot).intents).toEqual([
      expect.objectContaining({ target: BedroomLights.CLOSET, state: { on: false } }),
      expect.objectContaining({ target: BedroomLights.MAIN, state: { temperature: 0.9 } }),
      expect.objectContaining({
        target: BedroomLights.NIGHT,
        state: { on: false, temperature: 0.9 },
      }),
    ]);

    expect(policy.sceneUp({ ...baseSnapshot, nightMode: true }).intents).toEqual([]);
  });
});
