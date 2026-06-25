import type { RouteUnit, Unit } from "../types";

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

// ── UnitSSE class ────────────────────────────────────────────────────────────

export class UnitSSE {
  private listeners: {
    [K in keyof UnitSSEEvents]?: Listener<Parameters<UnitSSEEvents[K]>>[];
  } = {};
  private abortController = new AbortController();

  constructor(body: ReadableStream<Uint8Array>) {
    this.consume(body);
  }

  // ── Typed EventEmitter surface ──────────────────────────────────────────

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

  once<K extends keyof UnitSSEEvents>(
    event: K,
    listener: UnitSSEEvents[K],
  ): this {
    const wrapper = ((...args: Parameters<UnitSSEEvents[K]>) => {
      this.off(event, wrapper as UnitSSEEvents[K]);
      (listener as Listener<Parameters<UnitSSEEvents[K]>>)(...args);
    }) as UnitSSEEvents[K];
    return this.on(event, wrapper);
  }

  /** Stop consuming the stream */
  destroy(): void {
    this.abortController.abort();
  }

  // ── Internal ────────────────────────────────────────────────────────────

  private emit<K extends keyof UnitSSEEvents>(
    event: K,
    ...args: Parameters<UnitSSEEvents[K]>
  ): void {
    const arr = this.listeners[event];
    if (arr) {
      for (const fn of [...arr]) {
        (fn as Listener<Parameters<UnitSSEEvents[K]>>)(...args);
      }
    }
  }

  private async consume(body: ReadableStream<Uint8Array>): Promise<void> {
    const decoder = new TextDecoder();
    const reader = body.getReader();

    // SSE fields accumulate per-message block
    let eventType = "message";
    let dataLines: string[] = [];

    const flush = () => {
      if (dataLines.length === 0) return;
      const raw = dataLines.join("\n");
      dataLines = [];

      try {
        const event = JSON.parse(raw) as UnitEvent;
        this.emit("data", event);

        if (event.payload.units.length > 0) {
          this.emit("units", event.payload.units, event.payload);
        }

        const removed = event.payload.removed;
        if (removed && removed.length > 0) {
          this.emit("removed", removed, event.payload);
        }
      } catch (err) {
        this.emit(
          "error",
          new Error(
            `Failed to parse SSE data: ${(err as Error).message}\nRaw: ${raw}`,
          ),
        );
      } finally {
        eventType = "message"; // reset for next block
      }
    };

    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split("\n");
        // Keep the last (potentially incomplete) line in the buffer
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line === "" || line === "\r") {
            // Blank line → dispatch current message
            flush();
          } else if (line.startsWith("event:")) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).trim());
          } else if (line.startsWith(":")) {
            // SSE comment — ignore (e.g. keep-alive pings)
          } else if (line.startsWith("retry:")) {
            // Could be stored and surfaced if needed
          }
        }
      }

      // Flush any trailing data without a final blank line
      flush();
      this.emit("end");
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        this.emit("error", err as Error);
      }
    } finally {
      reader.releaseLock();
    }
  }
}
