import type { ReadonlyDeviceCatalog, ReadonlyDeviceDescriptor } from './ReadonlyDeviceCatalog';

interface HomeyApiDeviceLike {
  readonly id: string;
  readonly name: string;
  readonly capabilities?: readonly string[];
  readonly capabilitiesObj?: Record<string, unknown>;
}

interface HomeyApiLike {
  devices: {
    getDevices(): Promise<Record<string, HomeyApiDeviceLike>>;
  };
}

export class HomeyApiReadonlyDeviceCatalog implements ReadonlyDeviceCatalog {
  constructor(private readonly api: HomeyApiLike) {}

  async listDevices(): Promise<readonly ReadonlyDeviceDescriptor[]> {
    const devices = await this.api.devices.getDevices();

    return Object.values(devices).map(device => ({
      id: device.id,
      name: device.name,
      capabilities:
        device.capabilities ?? Object.keys(device.capabilitiesObj ?? {}),
    }));
  }
}
