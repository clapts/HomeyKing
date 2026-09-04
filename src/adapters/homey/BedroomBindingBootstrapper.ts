import type { BedroomBindingsConfig } from './BedroomBindings';
import type { BedroomBindingBootstrapEntry } from './BedroomBindingBootstrap';
import type { ReadonlyDeviceCatalog } from './ReadonlyDeviceCatalog';

export class BedroomBindingBootstrapError extends Error {}

export class BedroomBindingBootstrapper {
  constructor(
    private readonly catalog: ReadonlyDeviceCatalog,
    private readonly spec: readonly BedroomBindingBootstrapEntry[],
  ) {}

  async discover(): Promise<BedroomBindingsConfig> {
    const devices = await this.catalog.listDevices();
    const bindings: BedroomBindingsConfig['devices'][number][] = [];

    for (const entry of this.spec) {
      const matches = devices.filter(device => device.name === entry.expectedName);

      if (matches.length === 0) {
        throw new BedroomBindingBootstrapError(
          `Missing Homey device for ${entry.semanticDevice}: expected exact name "${entry.expectedName}"`,
        );
      }

      if (matches.length > 1) {
        throw new BedroomBindingBootstrapError(
          `Ambiguous Homey device for ${entry.semanticDevice}: ${matches.length} devices are named "${entry.expectedName}"`,
        );
      }

      const [device] = matches;
      const missingCapabilities = entry.capabilities.filter(
        capability => !device.capabilities.includes(capability),
      );

      if (missingCapabilities.length > 0) {
        throw new BedroomBindingBootstrapError(
          `Device "${entry.expectedName}" is missing required capabilities: ${missingCapabilities.join(', ')}`,
        );
      }

      bindings.push({
        semanticDevice: entry.semanticDevice,
        physicalDeviceId: device.id,
        capabilities: [...entry.capabilities],
      });
    }

    const physicalIds = new Set(bindings.map(binding => binding.physicalDeviceId));
    if (physicalIds.size !== bindings.length) {
      throw new BedroomBindingBootstrapError(
        'Bootstrap resolved the same physical Homey device for multiple semantic devices',
      );
    }

    return { devices: bindings };
  }
}
