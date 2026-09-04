export interface CapabilitySubscription {
  destroy(): void;
}

export interface ReadonlyCapabilitySource {
  readCapability(deviceId: string, capabilityId: string): Promise<unknown>;

  subscribe(
    deviceId: string,
    capabilityId: string,
    listener: (value: unknown) => void | Promise<void>,
  ): Promise<CapabilitySubscription>;
}
