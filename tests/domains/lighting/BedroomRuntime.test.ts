import { describe, expect, it } from 'vitest';
import { ShadowCommandSink } from '../../../src/core/execution/ShadowCommandSink';
import { BedroomRuntime } from '../../../src/domains/lighting/BedroomRuntime';
import { BedroomLights, type LightingIntent } from '../../../src/domains/lighting/LightingIntent';

describe('BedroomRuntime in shadow mode', () => {
  it('records the night scene instead of executing it', async () => {
    const sink = new ShadowCommandSink<LightingIntent>();
    const runtime = new BedroomRuntime(sink);

    const result = await runtime.handle({ type: 'NIGHT_TOGGLE_REQUESTED' });

    expect(runtime.executionMode).toBe('SHADOW');
    expect(result.state.nightMode).toBe(true);
    expect(sink.getRecords().map((record) => record.command.target)).toEqual([
      BedroomLights.MAIN,
      BedroomLights.NIGHT,
      BedroomLights.CLOSET,
    ]);
  });

  it('does not create an outgoing command when reconciling an observed Homey state', async () => {
    const sink = new ShadowCommandSink<LightingIntent>();
    const runtime = new BedroomRuntime(sink);

    const result = await runtime.handle({
      type: 'LIGHT_STATE_OBSERVED',
      target: 'main',
      on: true,
    });

    expect(result.state.mainLightOn).toBe(true);
    expect(sink.getRecords()).toEqual([]);
  });

  it('records an atomic closet-switch exit from night with the manual closet command preserved', async () => {
    const sink = new ShadowCommandSink<LightingIntent>();
    const runtime = new BedroomRuntime(
      sink,
      undefined,
    );

    await runtime.handle({ type: 'NIGHT_TOGGLE_REQUESTED' });
    sink.clear();

    const result = await runtime.handle({ type: 'CLOSET_SWITCH_ON' });

    expect(result.state).toMatchObject({
      nightMode: false,
      nightLightOn: false,
      closetLightOn: true,
    });
    expect(sink.getRecords().map((record) => record.command)).toEqual([
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
});
