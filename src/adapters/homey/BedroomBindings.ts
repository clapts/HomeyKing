import { BedroomHomeyDevices, type BedroomHomeyDevice } from './BedroomHomeyInput';

export interface BedroomDeviceBinding {
  readonly semanticDevice: BedroomHomeyDevice;
  readonly physicalDeviceId: string;
  readonly capabilities: readonly string[];
}

export interface BedroomBindingsConfig {
  readonly devices: readonly BedroomDeviceBinding[];
}

const allowedCapabilities: Readonly<Record<BedroomHomeyDevice, readonly string[]>> = {
  [BedroomHomeyDevices.DOOR]: ['alarm_contact'],
  [BedroomHomeyDevices.MOTION_ENTRY]: ['alarm_motion'],
  [BedroomHomeyDevices.MOTION_INTERNAL]: ['alarm_motion'],
  [BedroomHomeyDevices.CLOSET_SWITCH]: [],
  [BedroomHomeyDevices.EXTERNAL_SWITCH]: [],
  [BedroomHomeyDevices.BED_REMOTE]: [],
  [BedroomHomeyDevices.MAIN_LIGHT]: ['onoff', 'dim'],
  [BedroomHomeyDevices.NIGHT_LIGHT]: ['onoff', 'dim'],
  [BedroomHomeyDevices.CLOSET_LIGHT]: ['onoff', 'dim'],
};

export function parseBedroomBindings(value: unknown): BedroomBindingsConfig | null {
  if (typeof value !== 'object' || value === null || !('devices' in value)) {
    return null;
  }

  const devices = (value as { devices?: unknown }).devices;
  if (!Array.isArray(devices)) {
    return null;
  }

  const parsed: BedroomDeviceBinding[] = [];
  const seenSemantic = new Set<string>();
  const seenPhysical = new Set<string>();

  for (const item of devices) {
    if (typeof item !== 'object' || item === null) {
      return null;
    }

    const candidate = item as {
      semanticDevice?: unknown;
      physicalDeviceId?: unknown;
      capabilities?: unknown;
    };

    if (
      typeof candidate.semanticDevice !== 'string' ||
      typeof candidate.physicalDeviceId !== 'string' ||
      candidate.physicalDeviceId.length === 0 ||
      !Array.isArray(candidate.capabilities)
    ) {
      return null;
    }

    const semanticDevice = candidate.semanticDevice as BedroomHomeyDevice;
    const allowed = allowedCapabilities[semanticDevice];
    if (!allowed) {
      return null;
    }

    if (seenSemantic.has(semanticDevice) || seenPhysical.has(candidate.physicalDeviceId)) {
      return null;
    }

    const capabilities = candidate.capabilities;
    if (
      capabilities.some(
        capability =>
          typeof capability !== 'string' || !allowed.includes(capability),
      )
    ) {
      return null;
    }

    seenSemantic.add(semanticDevice);
    seenPhysical.add(candidate.physicalDeviceId);
    parsed.push({
      semanticDevice,
      physicalDeviceId: candidate.physicalDeviceId,
      capabilities: [...capabilities] as string[],
    });
  }

  return { devices: parsed };
}
