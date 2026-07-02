import type { RouteUnit, Unit } from "../types";
import type { EventSourceLike } from "./client";

export interface UnitEvent {
  ok: boolean;
  routeId: number;
  routeName: string;
  payload: RouteUnit;
  timestamp: string;
}

// ── Event map ────────────────────────────────────────────────────────────────

type UnitSSEEvents = {
  /** Fired for every parsed SSE event, whether it carries units or not */
  data: (event: UnitEvent) => void;
  /** Fired only when the payload contains at least one unit (full or delta) */
  units: (units: Unit[], meta: RouteUnit) => void;
  /** Fired when a delta event carries removed unit IDs */
  removed: (unitIds: string[], meta: RouteUnit) => void;
  /** Stream closed cleanly */
  end: () => void;
  /** Parse or network error */
  error: (err: Error) => void;
};

type Listener<T extends unknown[]> = (...args: T) => void;

type ListenerMap = {
  [K in keyof UnitSSEEvents]?: Listener<Parameters<UnitSSEEvents[K]>>[];
};

export class UnitSSE {
  private listeners: ListenerMap = {};
  private es: EventSource;

  constructor(
    url: string | URL,
    EventSourceCtor: EventSourceLike = EventSource,
  ) {
    this.es = new EventSourceCtor(url);
    // @ts-ignore
    this.es.addEventListener("units", (e: MessageEvent) => {
      try {
        const event = JSON.parse((e as MessageEvent).data) as UnitEvent;
        this.emit("data", event);

        if (event.payload.units.length > 0) {
          this.emit("units", event.payload.units, event.payload);
        }

        if (event.payload.removed?.length) {
          this.emit("removed", event.payload.removed, event.payload);
        }
      } catch (err) {
        this.emit(
          "error",
          new Error(`Failed to parse SSE payload: ${(err as Error).message}`),
        );
      }
    });

    this.es.onerror = () =>
      this.emit("error", new Error("EventSource connection error"));
  }

  on<K extends keyof UnitSSEEvents>(
    event: K,
    listener: UnitSSEEvents[K],
  ): this {
    (this.listeners[event] ??= [] as never[]).push(listener as never);
    return this;
  }

  off<K extends keyof UnitSSEEvents>(
    event: K,
    listener: UnitSSEEvents[K],
  ): this {
    const arr = this.listeners[event];
    if (arr) {
      const idx = arr.indexOf(listener as never);
      if (idx !== -1) arr.splice(idx, 1);
    }
    return this;
  }

  destroy(): void {
    this.es.close();
    this.emit("end");
  }

  private emit<K extends keyof UnitSSEEvents>(
    event: K,
    ...args: Parameters<UnitSSEEvents[K]>
  ): void {
    for (const fn of [...(this.listeners[event] ?? [])]) {
      (fn as Listener<Parameters<UnitSSEEvents[K]>>)(...args);
    }
  }
}
