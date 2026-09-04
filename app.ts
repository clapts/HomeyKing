import Homey from 'homey';
import { HomeyAPI } from 'homey-api';
import { BedroomHomeyInputMapper } from './src/adapters/homey/BedroomHomeyInputMapper';
import type { BedroomHomeyInput } from './src/adapters/homey/BedroomHomeyInput';
import {
  parseBedroomBindings,
  type BedroomBindingsConfig,
} from './src/adapters/homey/BedroomBindings';
import { BedroomPilotBootstrapSpec } from './src/adapters/homey/BedroomBindingBootstrap';
import {
  BedroomBindingBootstrapper,
  BedroomBindingBootstrapError,
} from './src/adapters/homey/BedroomBindingBootstrapper';
import { BedroomReadonlyObserver } from './src/adapters/homey/BedroomReadonlyObserver';
import { HomeyApiReadonlyCapabilitySource } from './src/adapters/homey/HomeyApiReadonlyCapabilitySource';
import { HomeyApiReadonlyDeviceCatalog } from './src/adapters/homey/HomeyApiReadonlyDeviceCatalog';
import { ShadowCommandSink } from './src/core/execution/ShadowCommandSink';
import { BedroomRuntime } from './src/domains/lighting/BedroomRuntime';
import type { LightingIntent } from './src/domains/lighting/LightingIntent';

class HomeyKingApp extends Homey.App {
  private apiClient?: Awaited<ReturnType<typeof HomeyAPI.createAppAPI>>;
  private bedroomObserver?: BedroomReadonlyObserver;
  private readonly mapper = new BedroomHomeyInputMapper();
  private readonly shadowSink = new ShadowCommandSink<LightingIntent>();
  private readonly bedroomRuntime = new BedroomRuntime(this.shadowSink);

  async onInit(): Promise<void> {
    this.log('HomeyKing 0.1.0 starting in SHADOW mode');

    this.apiClient = await HomeyAPI.createAppAPI({
      homey: this.homey,
    });

    this.log('Homey Web API client initialized');

    const bindings = await this.resolveBedroomBindings();

    if (bindings === null || bindings.devices.length === 0) {
      this.log(
        'Bedroom readonly observer disabled: no validated local bindings are available',
      );
    } else {
      const source = new HomeyApiReadonlyCapabilitySource(this.apiClient);
      this.bedroomObserver = new BedroomReadonlyObserver(
        source,
        bindings,
        input => this.handleBedroomInput(input),
      );

      await this.bedroomObserver.start();
      this.log('Bedroom readonly observer started', {
        devices: bindings.devices.map(binding => binding.semanticDevice),
      });
    }

    this.log('HomeyKing ready: physical writes are disabled');
  }

  async onUninit(): Promise<void> {
    this.bedroomObserver?.stop();
    this.log('HomeyKing readonly observers stopped');
  }

  async handleBedroomInput(input: BedroomHomeyInput): Promise<void> {
    const event = this.mapper.map(input);
    if (event === null) {
      this.log('Ignoring unmapped bedroom input', input);
      return;
    }

    const result = await this.bedroomRuntime.handle(event);

    this.log('SHADOW bedroom decision', {
      event,
      state: result.state,
      intents: result.intents,
    });
  }

  getShadowIntentCount(): number {
    return this.shadowSink.getRecords().length;
  }

  getApiClientInitialized(): boolean {
    return this.apiClient !== undefined;
  }

  private async resolveBedroomBindings(): Promise<BedroomBindingsConfig | null> {
    const storedBindings = parseBedroomBindings(
      this.homey.settings.get('bedroomBindings'),
    );

    if (storedBindings !== null && storedBindings.devices.length > 0) {
      this.log('Using validated bedroom bindings from local Homey settings');
      return storedBindings;
    }

    if (this.apiClient === undefined) {
      return null;
    }

    this.log('No valid bedroom bindings found; starting safe one-time discovery');

    try {
      const catalog = new HomeyApiReadonlyDeviceCatalog(this.apiClient);
      const bootstrapper = new BedroomBindingBootstrapper(
        catalog,
        BedroomPilotBootstrapSpec,
      );
      const discoveredBindings = await bootstrapper.discover();

      await this.homey.settings.set('bedroomBindings', discoveredBindings);
      this.log('Bedroom bindings discovered and stored locally');

      return discoveredBindings;
    } catch (error) {
      if (error instanceof BedroomBindingBootstrapError) {
        this.error('Bedroom binding discovery rejected', error.message);
      } else {
        this.error('Bedroom binding discovery failed', error);
      }

      return null;
    }
  }
}

module.exports = HomeyKingApp;
