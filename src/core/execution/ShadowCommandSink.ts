import type { CommandSink } from './CommandSink';

export interface ShadowCommandRecord<TCommand> {
  readonly receivedAt: Date;
  readonly command: TCommand;
}

export class ShadowCommandSink<TCommand>
  implements CommandSink<TCommand>
{
  readonly mode = 'SHADOW' as const;
  private readonly records: ShadowCommandRecord<TCommand>[] = [];

  async send(command: TCommand): Promise<void> {
    this.records.push({
      receivedAt: new Date(),
      command,
    });
  }

  getRecords(): readonly ShadowCommandRecord<TCommand>[] {
    return this.records.map((record) => ({
      receivedAt: new Date(record.receivedAt),
      command: record.command,
    }));
  }

  clear(): void {
    this.records.length = 0;
  }
}
