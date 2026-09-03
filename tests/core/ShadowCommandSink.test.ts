import { describe, expect, it } from 'vitest';
import { ShadowCommandSink } from '../../src/core/execution/ShadowCommandSink';

describe('ShadowCommandSink', () => {
  it('records commands in SHADOW mode', async () => {
    const sink = new ShadowCommandSink<{ action: string }>();

    await sink.send({ action: 'turn-on' });

    expect(sink.mode).toBe('SHADOW');
    expect(sink.getRecords()).toHaveLength(1);
    expect(sink.getRecords()[0].command).toEqual({ action: 'turn-on' });
  });

  it('can clear the shadow journal without executing anything', async () => {
    const sink = new ShadowCommandSink<string>();

    await sink.send('command-a');
    await sink.send('command-b');
    sink.clear();

    expect(sink.getRecords()).toEqual([]);
  });
});
