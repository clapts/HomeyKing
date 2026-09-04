import { describe, expect, it } from 'vitest';
import { BedroomReadonlyObserver } from '../../../src/adapters/homey/BedroomReadonlyObserver';
import { BedroomHomeyDevices } from '../../../src/adapters/homey/BedroomHomeyInput';
import type { CapabilitySubscription, ReadonlyCapabilitySource } from '../../../src/adapters/homey/ReadonlyCapabilitySource';

class FakeSource implements ReadonlyCapabilitySource {
  readonly values = new Map<string, unknown>();
  readonly listeners = new Map<string, (value: unknown) => void | Promise<void>>();
  destroyed = 0;

  async readCapability(deviceId: string, capabilityId: string): Promise<unknown> {
    return this.values.get(`${deviceId}:${capabilityId}`);
  }

  async subscribe(
    deviceId: string,
    capabilityId: string,
    listener: (value: unknown) => void | Promise<void>,
  ): Promise<CapabilitySubscription> {
    this.listeners.set(`${deviceId}:${capabilityId}`, listener);
    return {
      destroy: () => {
        this.destroyed += 1;
        this.listeners.delete(`${deviceId}:${capabilityId}`);
      },
    };
  }

  async emit(deviceId: string, capabilityId: string, value: unknown): Promise<void> {
    await this.listeners.get(`${deviceId}:${capabilityId}`)?.(value);
  }
}

describe('BedroomReadonlyObserver', () => {
  it('emits initial state, forwards changes and suppresses duplicate values', async () => {
    const source = new FakeSource();
    source.values.set('physical-door:alarm_contact', false);
    const received: unknown[] = [];

    const observer = new BedroomReadonlyObserver(
      source,
      {
        devices: [
          {
            semanticDevice: BedroomHomeyDevices.DOOR,
            physicalDeviceId: 'physical-door',
            capabilities: ['alarm_contact'],
          },
        ],
      },
      input => {
        received.push(input);
      },
    );

    await observer.start();

    expect(received).toEqual([
      {
        type: 'CAPABILITY_CHANGED',
        device: BedroomHomeyDevices.DOOR,
        capability: 'alarm_contact',
        value: false,
      },
    ]);

    await source.emit('physical-door', 'alarm_contact', false);
    expect(received).toHaveLength(1);

    await source.emit('physical-door', 'alarm_contact', true);
    expect(received).toHaveLength(2);
    expect(received[1]).toEqual({
      type: 'CAPABILITY_CHANGED',
      device: BedroomHomeyDevices.DOOR,
      capability: 'alarm_contact',
      value: true,
    });
  });

  it('destroys every realtime subscription when stopped', async () => {
    const source = new FakeSource();
    source.values.set('door:alarm_contact', false);
    source.values.set('motion:alarm_motion', false);

    const observer = new BedroomReadonlyObserver(
      source,
      {
        devices: [
          {
            semanticDevice: BedroomHomeyDevices.DOOR,
            physicalDeviceId: 'door',
            capabilities: ['alarm_contact'],
          },
          {
            semanticDevice: BedroomHomeyDevices.MOTION_ENTRY,
            physicalDeviceId: 'motion',
            capabilities: ['alarm_motion'],
          },
        ],
      },
      () => undefined,
    );

    await observer.start();
    observer.stop();

    expect(source.destroyed).toBe(2);
    expect(source.listeners.size).toBe(0);
  });

  it('is idempotent when start is called twice', async () => {
    const source = new FakeSource();
    source.values.set('door:alarm_contact', false);
    const received: unknown[] = [];

    const observer = new BedroomReadonlyObserver(
      source,
      {
        devices: [
          {
            semanticDevice: BedroomHomeyDevices.DOOR,
            physicalDeviceId: 'door',
            capabilities: ['alarm_contact'],
          },
        ],
      },
      input => received.push(input),
    );

    await observer.start();
    await observer.start();

    expect(received).toHaveLength(1);
    expect(source.listeners.size).toBe(1);
  });
});
