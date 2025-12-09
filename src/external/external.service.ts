// src/external/external.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { CacheService } from '../cache/cache.service';
import { RequestContextService } from 'src/logging/request-context.service';

type BreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitState {
  state: BreakerState;
  failureCount: number;
  openedAt?: number;
}

@Injectable()
export class ExternalService {
  private readonly logger = new Logger(ExternalService.name);

  private readonly coffeeUrl = 'https://api.sampleapis.com/coffee/hot';
  private readonly beerUrl = 'https://api.sampleapis.com/beers/ale';
  private readonly charactersUrl = 'https://api.sampleapis.com/futurama/characters';

  // Resiliencia
  private readonly TIMEOUT_MS = 2_000;
  private readonly MAX_RETRIES = 2;
  private readonly BASE_BACKOFF_MS = 300;

  // Circuit breaker
  private readonly FAILURE_THRESHOLD = 3;
  private readonly OPEN_STATE_DURATION_MS = 10_000;

  private readonly breakerStates = new Map<string, CircuitState>();

  // TTLs de cache (en ms)
  private readonly COFFEES_TTL_MS = 60_000;
  private readonly BEERS_TTL_MS = 60_000;
  private readonly CHARACTERS_TTL_MS = 60_000;

  constructor(
    private readonly cache: CacheService,
    private readonly requestContext: RequestContextService,
  ) {}

   private currentReqId(): string {
    return this.requestContext.getRequestId() ?? 'no-reqid';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ---------- Circuit Breaker helpers (igual que antes) ----------

  private getState(label: string): CircuitState {
    let state = this.breakerStates.get(label);
    if (!state) {
      state = { state: 'CLOSED', failureCount: 0 };
      this.breakerStates.set(label, state);
    }
    return state;
  }

  private canProceed(label: string): boolean {
    const state = this.getState(label);
    const now = Date.now();

    if (state.state === 'CLOSED') {
      return true;
    }

    if (state.state === 'OPEN') {
      if (!state.openedAt) {
        state.openedAt = now;
      }
      const elapsed = now - state.openedAt;
      if (elapsed >= this.OPEN_STATE_DURATION_MS) {
        state.state = 'HALF_OPEN';
        this.logger.warn(
          `🔁 [CB:${label}] moving from OPEN -> HALF_OPEN after ${elapsed}ms`,
        );
        return true;
      }

      this.logger.warn(
        `⛔ [CB:${label}] OPEN, blocking request (elapsed=${elapsed}ms)`,
      );
      return false;
    }

    if (state.state === 'HALF_OPEN') {
      this.logger.debug(`🔎 [CB:${label}] HALF_OPEN, allowing a trial request`);
      return true;
    }

    return true;
  }

  private recordSuccess(label: string) {
    const state = this.getState(label);
    if (state.state !== 'CLOSED') {
      this.logger.log(`✅ [CB:${label}] success, resetting to CLOSED`);
    }
    state.state = 'CLOSED';
    state.failureCount = 0;
    state.openedAt = undefined;
  }

  private recordFailure(label: string) {
    const state = this.getState(label);
    state.failureCount += 1;

    this.logger.warn(
      `⚠️ [CB:${label}] failureCount=${state.failureCount}/${this.FAILURE_THRESHOLD}`,
    );

    if (state.failureCount >= this.FAILURE_THRESHOLD) {
      state.state = 'OPEN';
      state.openedAt = Date.now();
      this.logger.error(
        `🚨 [CB:${label}] OPENING circuit after ${state.failureCount} consecutive failures`,
      );
    }
  }

  private async getWithRetry<T>(label: string, url: string): Promise<T> {
     const reqId = this.currentReqId();

    if (!this.canProceed(label)) {
      const error = new Error(
        `Circuit OPEN for '${label}', request blocked (reqId=${reqId})`,
      );
      throw error;
    }

    let attempt = 0;

    while (true) {
      const started = Date.now();
      this.logger.debug(
        `➡️ [${label}] reqId=${reqId} attempt ${attempt + 1}/${
          this.MAX_RETRIES + 1
        } GET ${url}`,
      );

      try {
        const response = await axios.get<T>(url, {
          timeout: this.TIMEOUT_MS,
        });

        const duration = Date.now() - started;
        this.logger.log(
          `✅ [${label}] reqId=${reqId} OK ${
            response.status
          } (${duration}ms) – url=${url}`,
        );;

        this.recordSuccess(label);
        return response.data;
      } catch (err) {
        const duration = Date.now() - started;
        const error = err as AxiosError;
        const status = error.response?.status;
        const code = error.code;
        const msg = error.message;

        this.logger.warn(
          `⚠️ [${label}] reqId=${reqId} FAIL attempt ${
            attempt + 1
          }/${this.MAX_RETRIES + 1} (${duration}ms) – status=${status}, code=${code}, msg=${msg}`,
        );

        const isTimeout = code === 'ECONNABORTED';
        const is5xx = !!status && status >= 500 && status < 600;
        const retryable = isTimeout || is5xx || !status;

        if (!retryable || attempt >= this.MAX_RETRIES) {
          this.recordFailure(label);

          this.logger.error(
            `❌ [${label}] giving up after ${
              attempt + 1
            } attempts – url=${url}`,
          );
          throw error;
        }

        const backoff =
          this.BASE_BACKOFF_MS * Math.pow(2, attempt); // 300, 600, 1200...
        this.logger.debug(
          `⏱️ [${label}] retrying in ${backoff}ms (reason=${
            isTimeout ? 'timeout' : '5xx/network'
          })`,
        );

        attempt++;
        await this.sleep(backoff);
      }
    }
  }

  // ---------- Helper de cache ----------

  private async cached<T>(
    label: string,
    key: string,
    ttlMs: number,
    fetchFn: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.cache.get<T>(key);
    if (cached !== null) {
      this.logger.debug(`📦 [${label}] served from cache key=${key}`);
      return cached;
    }

    this.logger.debug(`📭 [${label}] cache MISS, fetching fresh key=${key}`);
    const fresh = await fetchFn();
    await this.cache.set(key, fresh, ttlMs);
    return fresh;
  }

  // ---------- Métodos públicos ----------

  async fetchCoffees() {
    return this.cached(
      'coffees',
      'external:coffees',
      this.COFFEES_TTL_MS,
      async () => {
        const raw = await this.getWithRetry<any[]>('coffees', this.coffeeUrl);

        const mapped = raw.slice(0, 5).map((c, idx) => ({
          id: String(c.id ?? c.title ?? idx),
          title: c.title ?? c.name ?? 'Unknown coffee',
        }));

        this.logger.debug(
          `ℹ️ [coffees] mapped ${mapped.length} items for dashboard`,
        );
        return mapped;
      },
    );
  }

  async fetchBeers() {
    return this.cached(
      'beers',
      'external:beers',
      this.BEERS_TTL_MS,
      async () => {
        const raw = await this.getWithRetry<any[]>('beers', this.beerUrl);

        const mapped = raw.slice(0, 5).map((b, idx) => ({
          id: String(b.id ?? b.name ?? idx),
          name: b.name ?? 'Unknown beer',
          style: b.style ?? b.type ?? null,
        }));

        this.logger.debug(
          `ℹ️ [beers] mapped ${mapped.length} items for dashboard`,
        );
        return mapped;
      },
    );
  }

  async fetchCharacters() {
    return this.cached(
      'characters',
      'external:characters',
      this.CHARACTERS_TTL_MS,
      async () => {
        const raw = await this.getWithRetry<any[]>(
          'characters',
          this.charactersUrl,
        );

        const mapped = raw.slice(0, 5).map((ch, idx) => ({
          id: String(ch.id ?? ch.name ?? idx),
          name: ch.name ?? 'Unknown',
          species: ch.species ?? null,
        }));

        this.logger.debug(
          `ℹ️ [characters] mapped ${mapped.length} items for dashboard`,
        );
        return mapped;
      },
    );
  }
}
