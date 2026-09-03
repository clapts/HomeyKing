import { describe, expect, it } from 'vitest';
import { BedroomHomeyInputMapper } from '../../../src/adapters/homey/BedroomHomeyInputMapper';
import { BedroomHomeyDevices } from '../../../src/adapters/homey/BedroomHomeyInput';

describe('BedroomHomeyInputMapper', () => {
  const mapper = new BedroomHomeyInputMapper();

  it('maps the bedroom door opening', () => {
    expect(
      mapper.map({
        type: 'CAPABILITY_CHANGED',
        device: BedroomHomeyDevices.DOOR,
        capability: 'alarm_contact',
        value: true,
      }),
    ).toEqual({ type: 'BEDROOM_DOOR_OPENED' });
  });

  it.each([
    [BedroomHomeyDevices.MOTION_ENTRY, 'entry'],
    [BedroomHomeyDevices.MOTION_INTERNAL, 'internal'],
  ] as const)('maps motion state for %s', (device, sensor) => {
    expect(
      mapper.map({
        type: 'CAPABILITY_CHANGED',
        device,
        capability: 'alarm_motion',
        value: true,
      }),
    ).toEqual({
      type: 'CLOSET_MOTION_CHANGED',
      sensor,
      active: true,
    });

    expect(
      mapper.map({
        type: 'CAPABILITY_CHANGED',
        device,
        capability: 'alarm_motion',
        value: false,
      }),
    ).toEqual({
      type: 'CLOSET_MOTION_CHANGED',
      sensor,
      active: false,
    });
  });

  it.each([
    [BedroomHomeyDevices.MAIN_LIGHT, 'main'],
    [BedroomHomeyDevices.NIGHT_LIGHT, 'night'],
    [BedroomHomeyDevices.CLOSET_LIGHT, 'closet'],
  ] as const)('maps observed on/off state for %s', (device, target) => {
    expect(
      mapper.map({
        type: 'CAPABILITY_CHANGED',
        device,
        capability: 'onoff',
        value: true,
      }),
    ).toEqual({
      type: 'LIGHT_STATE_OBSERVED',
      target,
      on: true,
    });
  });

  it('maps bed-remote transient triggers', () => {
    expect(
      mapper.map({
        type: 'TRANSIENT_TRIGGER',
        device: BedroomHomeyDevices.BED_REMOTE,
        trigger: 'scene_down',
      }),
    ).toEqual({ type: 'NIGHT_TOGGLE_REQUESTED' });

    expect(
      mapper.map({
        type: 'TRANSIENT_TRIGGER',
        device: BedroomHomeyDevices.BED_REMOTE,
        trigger: 'on',
      }),
    ).toEqual({
      type: 'MAIN_LIGHT_TOGGLE_REQUESTED',
      source: 'bed-remote-on',
    });

    expect(
      mapper.map({
        type: 'TRANSIENT_TRIGGER',
        device: BedroomHomeyDevices.BED_REMOTE,
        trigger: 'scene_up',
      }),
    ).toEqual({ type: 'SCENE_UP_REQUESTED' });
  });

  it('maps closet-switch transient triggers', () => {
    expect(
      mapper.map({
        type: 'TRANSIENT_TRIGGER',
        device: BedroomHomeyDevices.CLOSET_SWITCH,
        trigger: 'on',
      }),
    ).toEqual({ type: 'CLOSET_SWITCH_ON' });

    expect(
      mapper.map({
        type: 'TRANSIENT_TRIGGER',
        device: BedroomHomeyDevices.CLOSET_SWITCH,
        trigger: 'off',
      }),
    ).toEqual({
      type: 'MAIN_LIGHT_TOGGLE_REQUESTED',
      source: 'closet-switch-off',
    });
  });

  it('maps the external room switch', () => {
    expect(
      mapper.map({
        type: 'TRANSIENT_TRIGGER',
        device: BedroomHomeyDevices.EXTERNAL_SWITCH,
        trigger: 'on',
      }),
    ).toEqual({
      type: 'MAIN_LIGHT_TOGGLE_REQUESTED',
      source: 'external-switch',
    });
  });

  it('ignores capabilities and transient triggers that do not belong to the contract', () => {
    expect(
      mapper.map({
        type: 'CAPABILITY_CHANGED',
        device: 'unknown.device',
        capability: 'onoff',
        value: true,
      }),
    ).toBeNull();

    expect(
      mapper.map({
        type: 'TRANSIENT_TRIGGER',
        device: BedroomHomeyDevices.BED_REMOTE,
        trigger: 'unknown',
      }),
    ).toBeNull();
  });
});
