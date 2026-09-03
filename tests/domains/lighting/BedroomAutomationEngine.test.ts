import { describe, expect, it } from 'vitest';
import { BedroomAutomationEngine } from '../../../src/domains/lighting/BedroomAutomationEngine';
import { BedroomLights } from '../../../src/domains/lighting/LightingIntent';

describe('BedroomAutomationEngine', () => {
  it('runs the full night-mode transition and updates simulated state', () => {
    const engine = new BedroomAutomationEngine({ mainLightOn: true });

    const result = engine.handle({ type: 'NIGHT_TOGGLE_REQUESTED' });

    expect(result.state).toMatchObject({
      nightMode: true,
      mainLightOn: false,
      nightLightOn: true,
      closetLightOn: true,
    });
    expect(result.intents.map((intent) => intent.target)).toEqual([
      BedroomLights.MAIN,
      BedroomLights.NIGHT,
      BedroomLights.CLOSET,
    ]);
  });

  it('exits night atomically from the closet switch and leaves the closet on', () => {
    const engine = new BedroomAutomationEngine({
      nightMode: true,
      mainLightOn: false,
      nightLightOn: true,
      closetLightOn: true,
    });

    const result = engine.handle({ type: 'CLOSET_SWITCH_ON' });

    expect(result.state).toMatchObject({
      nightMode: false,
      mainLightOn: false,
      nightLightOn: false,
      closetLightOn: true,
    });
    expect(result.intents).toEqual([
      expect.objectContaining({
        target: BedroomLights.NIGHT,
        state: { on: false },
      }),
      expect.objectContaining({
        target: BedroomLights.CLOSET,
        state: { on: true, dim: 1 },
      }),
    ]);
  });

  it('tracks both closet motion sensors and turns the light off only after both clear', () => {
    const engine = new BedroomAutomationEngine();

    const entryOn = engine.handle({
      type: 'CLOSET_MOTION_CHANGED',
      sensor: 'entry',
      active: true,
    });
    expect(entryOn.state).toMatchObject({
      entryMotion: true,
      internalMotion: false,
      closetLightOn: true,
    });

    const internalOn = engine.handle({
      type: 'CLOSET_MOTION_CHANGED',
      sensor: 'internal',
      active: true,
    });
    expect(internalOn.state).toMatchObject({
      entryMotion: true,
      internalMotion: true,
      closetLightOn: true,
    });

    const entryOff = engine.handle({
      type: 'CLOSET_MOTION_CHANGED',
      sensor: 'entry',
      active: false,
    });
    expect(entryOff.intents).toEqual([]);
    expect(entryOff.state).toMatchObject({
      entryMotion: false,
      internalMotion: true,
      closetLightOn: true,
    });

    const internalOff = engine.handle({
      type: 'CLOSET_MOTION_CHANGED',
      sensor: 'internal',
      active: false,
    });
    expect(internalOff.state).toMatchObject({
      entryMotion: false,
      internalMotion: false,
      closetLightOn: false,
    });
    expect(internalOff.intents).toEqual([
      expect.objectContaining({
        target: BedroomLights.CLOSET,
        state: { on: false },
      }),
    ]);
  });

  it('records motion during night without changing the night lighting scene', () => {
    const engine = new BedroomAutomationEngine({
      nightMode: true,
      nightLightOn: true,
      closetLightOn: true,
    });

    const result = engine.handle({
      type: 'CLOSET_MOTION_CHANGED',
      sensor: 'entry',
      active: true,
    });

    expect(result.intents).toEqual([]);
    expect(result.state).toMatchObject({
      nightMode: true,
      entryMotion: true,
      nightLightOn: true,
      closetLightOn: true,
    });
  });

  it('exits night from a main-light manual control and toggles the main light', () => {
    const engine = new BedroomAutomationEngine({
      nightMode: true,
      mainLightOn: false,
      nightLightOn: true,
      closetLightOn: true,
    });

    const result = engine.handle({
      type: 'MAIN_LIGHT_TOGGLE_REQUESTED',
      source: 'external-switch',
    });

    expect(result.state).toMatchObject({
      nightMode: false,
      mainLightOn: true,
      nightLightOn: false,
      closetLightOn: false,
    });
  });

  it('turns the main light on when the bedroom door opens outside night mode', () => {
    const engine = new BedroomAutomationEngine();

    const result = engine.handle({ type: 'BEDROOM_DOOR_OPENED' });

    expect(result.state.mainLightOn).toBe(true);
    expect(result.intents).toEqual([
      expect.objectContaining({
        target: BedroomLights.MAIN,
        state: { on: true },
      }),
    ]);
  });

  it('does nothing when the bedroom door opens during night mode', () => {
    const engine = new BedroomAutomationEngine({ nightMode: true });

    const result = engine.handle({ type: 'BEDROOM_DOOR_OPENED' });

    expect(result.intents).toEqual([]);
    expect(result.state.nightMode).toBe(true);
  });

  it('reconciles an observed physical light state without emitting a command', () => {
    const engine = new BedroomAutomationEngine({ mainLightOn: false });

    const result = engine.handle({
      type: 'LIGHT_STATE_OBSERVED',
      target: 'main',
      on: true,
    });

    expect(result.state.mainLightOn).toBe(true);
    expect(result.intents).toEqual([]);
  });

  it('applies scene-up outside night mode without inferring on/off from temperature alone', () => {
    const engine = new BedroomAutomationEngine({
      mainLightOn: true,
      nightLightOn: true,
      closetLightOn: true,
    });

    const result = engine.handle({ type: 'SCENE_UP_REQUESTED' });

    expect(result.state).toMatchObject({
      mainLightOn: true,
      nightLightOn: false,
      closetLightOn: false,
    });
    expect(result.intents).toEqual([
      expect.objectContaining({ target: BedroomLights.CLOSET }),
      expect.objectContaining({
        target: BedroomLights.MAIN,
        state: { temperature: 0.9 },
      }),
      expect.objectContaining({
        target: BedroomLights.NIGHT,
        state: { on: false, temperature: 0.9 },
      }),
    ]);
  });

  it('is deterministic for the same initial state and event sequence', () => {
    const run = () => {
      const engine = new BedroomAutomationEngine();
      return [
        engine.handle({
          type: 'CLOSET_MOTION_CHANGED',
          sensor: 'entry',
          active: true,
        }),
        engine.handle({
          type: 'CLOSET_MOTION_CHANGED',
          sensor: 'entry',
          active: false,
        }),
        engine.handle({ type: 'NIGHT_TOGGLE_REQUESTED' }),
      ];
    };

    expect(run()).toEqual(run());
  });
});
