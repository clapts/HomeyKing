import {
  type LightStatePatch,
  type LightingIntent,
} from './LightingIntent';

export class LightingConflictError extends Error {
  constructor(target: string, field: keyof LightStatePatch) {
    super(`Conflicting lighting intents for ${target}.${field}`);
    this.name = 'LightingConflictError';
  }
}

function resolveField<K extends keyof LightStatePatch>(
  intents: readonly LightingIntent[],
  key: K,
): LightStatePatch[K] | undefined {
  let assigned = false;
  let resolved: LightStatePatch[K] | undefined;

  for (const intent of intents) {
    if (!(key in intent.state)) continue;

    const value = intent.state[key];
    if (!assigned) {
      resolved = value;
      assigned = true;
      continue;
    }

    if (resolved !== value) {
      throw new LightingConflictError(intent.target, key);
    }
  }

  return resolved;
}

/**
 * Resolves multiple desired states for the same light.
 *
 * Only the highest priority level for each target survives. Intents at the
 * same priority may merge different fields, but contradictory values are
 * rejected instead of being resolved by timing/order.
 */
export function arbitrateLightingIntents(
  intents: readonly LightingIntent[],
): LightingIntent[] {
  const grouped = new Map<string, LightingIntent[]>();

  for (const intent of intents) {
    const current = grouped.get(intent.target) ?? [];
    current.push(intent);
    grouped.set(intent.target, current);
  }

  return [...grouped.entries()].map(([target, targetIntents]) => {
    const maxPriority = Math.max(...targetIntents.map((item) => item.priority));
    const winners = targetIntents.filter((item) => item.priority === maxPriority);

    const state: {
      on?: boolean;
      dim?: number;
      temperature?: number;
    } = {};

    const on = resolveField(winners, 'on');
    const dim = resolveField(winners, 'dim');
    const temperature = resolveField(winners, 'temperature');

    if (on !== undefined) state.on = on;
    if (dim !== undefined) state.dim = dim;
    if (temperature !== undefined) state.temperature = temperature;

    return {
      target,
      state,
      priority: winners[0].priority,
      reason: [...new Set(winners.map((item) => item.reason))].join(' + '),
    };
  });
}
