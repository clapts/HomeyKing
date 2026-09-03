export type DeviceRole =
  | 'LIGHT'
  | 'MOTION_SENSOR'
  | 'CONTACT_SENSOR'
  | 'SWITCH'
  | 'POWER_SOCKET'
  | 'COMPUTER_CONTROL'
  | 'SPEAKER'
  | 'ENVIRONMENT_SENSOR'
  | 'OTHER';

export interface DeviceBinding {
  readonly logicalId: string;
  readonly role: DeviceRole;
  readonly provider: 'homey';
  readonly providerDeviceId: string;
  readonly capabilities?: readonly string[];
}

export class DeviceRegistry {
  private readonly bindings = new Map<string, DeviceBinding>();

  register(binding: DeviceBinding): void {
    if (this.bindings.has(binding.logicalId)) {
      throw new Error(`Duplicate logical device id: ${binding.logicalId}`);
    }
    this.bindings.set(binding.logicalId, binding);
  }

  resolve(logicalId: string): DeviceBinding {
    const binding = this.bindings.get(logicalId);
    if (!binding) {
      throw new Error(`Unknown logical device: ${logicalId}`);
    }
    return binding;
  }

  has(logicalId: string): boolean {
    return this.bindings.has(logicalId);
  }
}
