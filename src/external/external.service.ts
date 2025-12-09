// src/external/external.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';

@Injectable()
export class ExternalService {
  private readonly logger = new Logger(ExternalService.name);

  private readonly coffeeUrl = 'https://api.sampleapis.com/coffee/broken';
  private readonly beerUrl = 'https://api.sampleapis.com/beers/ale';
  // private readonly beerUrl = 'https://does-not-exist-12345.example.com/beers';
  private readonly charactersUrl = 'https://api.sampleapis.com/futurama/characters';

  // Config de resiliencia
  private readonly TIMEOUT_MS = 2_000; // 2s por llamada
  private readonly MAX_RETRIES = 2;    // total = 1 intento + 2 reintentos
  private readonly BASE_BACKOFF_MS = 300; // backoff base

  /**
   * Pequeño helper de sleep (para backoff).
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cliente HTTP con timeout + retries + logs.
   *
   * - timeout configurable
   * - reintentos con backoff exponencial
   * - logs por intento (éxito / error / retry)
   */
  private async getWithRetry<T>(label: string, url: string): Promise<T> {
    let attempt = 0;

    while (true) {
      const started = Date.now();
      this.logger.debug(
        `➡️ [${label}] attempt ${attempt + 1}/${this.MAX_RETRIES + 1} GET ${url}`,
      );

      try {
        const response = await axios.get<T>(url, {
          timeout: this.TIMEOUT_MS,
        });

        const duration = Date.now() - started;
        this.logger.log(
          `✅ [${label}] OK ${response.status} (${duration}ms) – url=${url}`,
        );

        return response.data;
      } catch (err) {
        const duration = Date.now() - started;
        const error = err as AxiosError;
        const status = error.response?.status;
        const code = error.code;
        const msg = error.message;

        this.logger.warn(
          `⚠️ [${label}] FAIL attempt ${attempt + 1}/${this.MAX_RETRIES + 1} ` +
            `(${duration}ms) – status=${status}, code=${code}, msg=${msg}`,
        );

        // ¿Debemos reintentar?
        const isTimeout = code === 'ECONNABORTED';
        const is5xx = !!status && status >= 500 && status < 600;
        const retryable = isTimeout || is5xx || !status; // sin status → network error

        if (!retryable || attempt >= this.MAX_RETRIES) {
          this.logger.error(
            `❌ [${label}] giving up after ${attempt + 1} attempts – url=${url}`,
          );
          throw error;
        }

        // calculamos backoff exponencial simple
        const backoff =
          this.BASE_BACKOFF_MS * Math.pow(2, attempt); // 300, 600, 1200...

        this.logger.debug(
          `⏱️ [${label}] scheduling retry in ${backoff}ms (reason=${isTimeout ? 'timeout' : '5xx/network'})`,
        );

        attempt++;
        await this.sleep(backoff);
      }
    }
  }

  /**
   * Cafés para el dashboard externo.
   */
  async fetchCoffees() {
    const raw = await this.getWithRetry<any[]>('coffees', this.coffeeUrl);

    const mapped = raw.slice(0, 5).map((c, idx) => ({
      id: String(c.id ?? c.title ?? idx),
      title: c.title ?? c.name ?? 'Unknown coffee',
    }));

    this.logger.debug(
      `ℹ️ [coffees] mapped ${mapped.length} items for dashboard`,
    );

    return mapped;
  }

  /**
   * Cervezas para el dashboard externo.
   */
  async fetchBeers() {
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
  }

  /**
   * Personajes (ej. Futurama) para el dashboard externo.
   */
  async fetchCharacters() {
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
  }
}
