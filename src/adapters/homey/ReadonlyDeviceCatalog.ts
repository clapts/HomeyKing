export interface ReadonlyDeviceDescriptor {
  readonly id: string;
  readonly name: string;
  readonly capabilities: readonly string[];
}

export interface ReadonlyDeviceCatalog {
  listDevices(): Promise<readonly ReadonlyDeviceDescriptor[]>;
}
