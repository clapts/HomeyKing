import { describe, expect, it } from 'vitest';
import { DeviceRegistry } from '../../src/core/registry/DeviceRegistry';

describe('DeviceRegistry', () => {
  it('resolves a logical device without exposing the provider id to business logic', () => {
    const registry = new DeviceRegistry();
    registry.register({
      logicalId: 'bedroom.claudio.light.main',
      role: 'LIGHT',
      provider: 'homey',
      providerDeviceId: 'test-device-id',
    });

    expect(registry.resolve('bedroom.claudio.light.main').role).toBe('LIGHT');
  });

  it('rejects duplicate logical ids', () => {
    const registry = new DeviceRegistry();
    const binding = {
      logicalId: 'bedroom.claudio.light.main',
      role: 'LIGHT' as const,
      provider: 'homey' as const,
      providerDeviceId: 'test-device-id',
    };

    registry.register(binding);
    expect(() => registry.register(binding)).toThrow(/Duplicate logical device id/);
  });
});
