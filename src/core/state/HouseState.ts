export type HouseMode = 'HOME' | 'AWAY' | 'NIGHT' | 'SLEEP' | 'VACATION' | 'GUEST';

export interface RoomState {
  occupied: boolean;
  manualOverride: boolean;
  lightingMode: 'AUTO' | 'MANUAL' | 'NIGHT';
}

export interface HouseStateSnapshot {
  mode: HouseMode;
  rooms: Record<string, RoomState>;
  updatedAt: Date;
}

export class HouseState {
  private snapshot: HouseStateSnapshot;

  constructor(initial?: Partial<HouseStateSnapshot>) {
    this.snapshot = {
      mode: initial?.mode ?? 'HOME',
      rooms: initial?.rooms ?? {},
      updatedAt: initial?.updatedAt ?? new Date(),
    };
  }

  getSnapshot(): Readonly<HouseStateSnapshot> {
    return structuredClone(this.snapshot);
  }

  setMode(mode: HouseMode): void {
    this.snapshot = { ...this.snapshot, mode, updatedAt: new Date() };
  }

  setRoomState(roomId: string, state: RoomState): void {
    this.snapshot = {
      ...this.snapshot,
      rooms: { ...this.snapshot.rooms, [roomId]: state },
      updatedAt: new Date(),
    };
  }
}
