import { describe, expect, it } from 'vitest';
import { NightModePolicy } from '../../../src/domains/lighting/NightModePolicy';

describe('NightModePolicy', () => {
  const policy = new NightModePolicy();

  it('reproduces the current legacy night scene', () => {
    expect(policy.enable()).toEqual({
      mainLight: { on: false, dim: 0 },
      nightLight: { on: true, dim: 0.35 },
      closetLight: { on: true, dim: 0.51 },
    });
  });

  it('reproduces the current legacy exit-from-night scene', () => {
    expect(policy.disable()).toEqual({
      mainLight: { on: true, dim: 1 },
      nightLight: { on: false, dim: 0 },
      closetLight: { on: false, dim: 0 },
    });
  });
});
