import Homey from 'homey';
import { HomeyAPI } from 'homey-api';
import { BedroomHomeyInputMapper } from './src/adapters/homey/BedroomHomeyInputMapper';
import type { BedroomHomeyInput } from './src/adapters/homey/BedroomHomeyInput';
import { ShadowCommandSink } from './src/core/execution/ShadowCommandSink';
import { BedroomRuntime } from './src/domains/lighting/BedroomRuntime';
import type { LightingIntent } from './src/domains/lighting/LightingIntent';

class HomeyKingApp extends Homey.App {
  private apiClient?: Awaited<ReturnType<typeof HomeyAPI.createAppAPI>>;
  private readonly mapper = new BedroomHomeyInputMapper();
  private readonly shadowSink = new ShadowCommandSink<LightingIntent>();
  private readonly bedroomRuntime = new BedroomRuntime(this.shadowSink);

  async onInit(): Promise<void> {
    this.log('HomeyKing 0.1.0 starting in SHADOW mode');

    this.apiClient = await HomeyAPI.createAppAPI({
      homey: this.homey,
    });

    this.log('Homey Web API client initialized');
    this.log('HomeyKing ready: physical writes are disabled');
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
}

module.exports = HomeyKingApp;
