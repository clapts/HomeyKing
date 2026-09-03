import type { CommandSink } from '../../core/execution/CommandSink';
import {
  BedroomAutomationEngine,
  type BedroomEngineResult,
} from './BedroomAutomationEngine';
import type { BedroomEvent } from './BedroomEvent';
import type { LightingIntent } from './LightingIntent';

export class BedroomRuntime {
  constructor(
    private readonly sink: CommandSink<LightingIntent>,
    private readonly engine = new BedroomAutomationEngine(),
  ) {}

  get executionMode() {
    return this.sink.mode;
  }

  getState() {
    return this.engine.getState();
  }

  async handle(event: BedroomEvent): Promise<BedroomEngineResult> {
    const result = this.engine.handle(event);

    for (const intent of result.intents) {
      await this.sink.send(intent);
    }

    return result;
  }
}
