import { describe, expect, it } from 'vitest';
import {
  BedroomBindingBootstrapError,
  BedroomBindingBootstrapper,
} from '../../../src/adapters/homey/BedroomBindingBootstrapper';
import { BedroomHomeyDevices } from '../../../src/adapters/homey/BedroomHomeyInput';
import type { ReadonlyDeviceCatalog } from '../../../src/adapters/homey/ReadonlyDeviceCatalog';

const spec = [
  {
    semanticDevice: BedroomHomeyDevices.DOOR,
    expectedName: 'Door',
    capabilities: ['alarm_contact'],
  },
  {
    semanticDevice: BedroomHomeyDevices.MOTION_ENTRY,
    expectedName: 'Motion',
    capabilities: ['alarm_motion'],
  },
] as const;

function catalog(
  devices: Awaited<ReturnType<ReadonlyDeviceCatalog['listDevices']>>,
): ReadonlyDeviceCatalog {
  return {
    async listDevices() {
      return devices;
    },
  };
}

describe('BedroomBindingBootstrapper', () => {
  it('discovers exact unique devices and returns semantic bindings', async () => {
    const bootstrapper = new BedroomBindingBootstrapper(
      catalog([
        { id: 'door-id', name: 'Door', capabilities: ['alarm_contact'] },
        { id: 'motion-id', name: 'Motion', capabilities: ['alarm_motion'] },
      ]),
      spec,
    );

    await expect(bootstrapper.discover()).resolves.toEqual({
      devices: [
        {
          semanticDevice: BedroomHomeyDevices.DOOR,
          physicalDeviceId: 'door-id',
          capabilities: ['alarm_contact'],
        },
        {
          semanticDevice: BedroomHomeyDevices.MOTION_ENTRY,
          physicalDeviceId: 'motion-id',
          capabilities: ['alarm_motion'],
        },
      ],
    });
  });

  it('fails when an expected device is missing', async () => {
    const bootstrapper = new BedroomBindingBootstrapper(
      catalog([{ id: 'door-id', name: 'Door', capabilities: ['alarm_contact'] }]),
      spec,
    );

    await expect(bootstrapper.discover()).rejects.toBeInstanceOf(
      BedroomBindingBootstrapError,
    );
  });

  it('fails when an exact device name is ambiguous', async () => {
    const bootstrapper = new BedroomBindingBootstrapper(
      catalog([
        { id: 'door-a', name: 'Door', capabilities: ['alarm_contact'] },
        { id: 'door-b', name: 'Door', capabilities: ['alarm_contact'] },
        { id: 'motion-id', name: 'Motion', capabilities: ['alarm_motion'] },
      ]),
      spec,
    );

    await expect(bootstrapper.discover()).rejects.toThrow(/Ambiguous/);
  });

  it('fails when a matched device lacks a required capability', async () => {
    const bootstrapper = new BedroomBindingBootstrapper(
      catalog([
        { id: 'door-id', name: 'Door', capabilities: [] },
        { id: 'motion-id', name: 'Motion', capabilities: ['alarm_motion'] },
      ]),
      spec,
    );

    await expect(bootstrapper.discover()).rejects.toThrow(/alarm_contact/);
  });
});
