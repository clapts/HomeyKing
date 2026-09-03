export type ExecutionMode = 'SHADOW' | 'LIVE';

export interface CommandSink<TCommand> {
  readonly mode: ExecutionMode;
  send(command: TCommand): Promise<void>;
}
