import type { CapabilitySubscription, ReadonlyCapabilitySource } from './ReadonlyCapabilitySource';

interface HomeyApiLike {
  devices: {
    getDevice(options: { id: string; $skipCache?: boolean }): Promise<{
      capabilitiesObj?: Record<string, { value?: unknown }>;
      makeCapabilityInstance(
        capabilityId: string,
        listener: (value: unknown) => void | Promise<void>,
      ): CapabilitySubscription;
    }>;
  };
}

export class HomeyApiReadonlyCapabilitySource implements ReadonlyCapabilitySource {
  constructor(private readonly api: HomeyApiLike) {}

  async readCapability(deviceId: string, capabilityId: string): Promise<unknown> {
    const device = await this.api.devices.getDevice({ id: deviceId, $skipCache: true });
    return device.capabilitiesObj?.[capabilityId]?.value;
  }

  async subscribe(
    deviceId: string,
    capabilityId: string,
    listener: (value: unknown) => void | Promise<void>,
  ): Promise<CapabilitySubscription> {
    const device = await this.api.devices.getDevice({ id: deviceId });
    return device.makeCapabilityInstance(capabilityId, listener);
  }
}
