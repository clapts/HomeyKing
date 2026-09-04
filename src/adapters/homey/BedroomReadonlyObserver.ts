import type { BedroomBindingsConfig } from './BedroomBindings';
import type { BedroomHomeyInput } from './BedroomHomeyInput';
import type { CapabilitySubscription, ReadonlyCapabilitySource } from './ReadonlyCapabilitySource';

export class BedroomReadonlyObserver {
  private readonly subscriptions: CapabilitySubscription[] = [];
  private readonly lastValues = new Map<string, unknown>();
  private started = false;

  constructor(
    private readonly source: ReadonlyCapabilitySource,
    private readonly bindings: BedroomBindingsConfig,
    private readonly onInput: (input: BedroomHomeyInput) => void | Promise<void>,
  ) {}

  async start(): Promise<void> {
    if (this.started) {
      return;
    }

    this.started = true;

    for (const binding of this.bindings.devices) {
      for (const capability of binding.capabilities) {
        const key = this.key(binding.physicalDeviceId, capability);
        const initialValue = await this.source.readCapability(
          binding.physicalDeviceId,
          capability,
        );

        this.lastValues.set(key, initialValue);
        await this.emit(binding.semanticDevice, capability, initialValue);

        const subscription = await this.source.subscribe(
          binding.physicalDeviceId,
          capability,
          async value => {
            if (Object.is(this.lastValues.get(key), value)) {
              return;
            }

            this.lastValues.set(key, value);
            await this.emit(binding.semanticDevice, capability, value);
          },
        );

        this.subscriptions.push(subscription);
      }
    }
  }

  stop(): void {
    for (const subscription of this.subscriptions.splice(0)) {
      subscription.destroy();
    }

    this.lastValues.clear();
    this.started = false;
  }

  private async emit(
    semanticDevice: string,
    capability: string,
    value: unknown,
  ): Promise<void> {
    await this.onInput({
      type: 'CAPABILITY_CHANGED',
      device: semanticDevice,
      capability,
      value,
    });
  }

  private key(deviceId: string, capability: string): string {
    return `${deviceId}:${capability}`;
  }
}
