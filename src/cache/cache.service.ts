// src/cache/cache.service.ts
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis, { Redis as RedisClient } from 'ioredis';

interface CacheEntry {
  value: any;
  expiresAt: number;
}

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly store = new Map<string, CacheEntry>(); // fallback in-memory
  private redis?: RedisClient;
  private readonly prefix = 'collab-cache:'; // para no mezclar claves

  constructor() {
    const url = process.env.REDIS_URL;

    if (url) {
      this.logger.log(`🔌 [cache] Initializing Redis client: ${url}`);
      this.redis = new Redis(url);

      this.redis.on('connect', () => {
        this.logger.log('✅ [cache] Connected to Redis');
      });

      this.redis.on('error', (err) => {
        this.logger.error(`❌ [cache] Redis error: ${err.message}`);
      });
    } else {
      this.logger.warn(
        '⚠️ [cache] REDIS_URL not set – using in-memory cache only',
      );
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      this.logger.log('🔌 [cache] Closing Redis connection');
      await this.redis.quit();
    }
  }

  private key(k: string): string {
    return `${this.prefix}${k}`;
  }

  // ---------- API pública ----------

  async get<T>(key: string): Promise<T | null> {
    // Preferimos Redis si está disponible
    if (this.redis) {
      const fullKey = this.key(key);
      const payload = await this.redis.get(fullKey);

      if (!payload) {
        this.logger.debug(`💨 [cache:redis] MISS key=${fullKey}`);
        return null;
      }

      try {
        const value = JSON.parse(payload) as T;
        this.logger.debug(`✅ [cache:redis] HIT key=${fullKey}`);
        return value;
      } catch (e: any) {
        this.logger.error(
          `❌ [cache:redis] Failed to parse JSON for key=${fullKey}: ${e.message}`,
        );
        await this.redis.del(fullKey);
        return null;
      }
    }

    // Fallback in-memory
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry) {
      this.logger.debug(`💨 [cache:mem] MISS key=${key}`);
      return null;
    }

    if (entry.expiresAt <= now) {
      this.logger.debug(`⌛ [cache:mem] EXPIRED key=${key}`);
      this.store.delete(key);
      return null;
    }

    this.logger.debug(`✅ [cache:mem] HIT key=${key}`);
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    if (this.redis) {
      const fullKey = this.key(key);
      const payload = JSON.stringify(value);
      await this.redis.set(fullKey, payload, 'PX', ttlMs);
      this.logger.debug(
        `💾 [cache:redis] SET key=${fullKey} ttlMs=${ttlMs}`,
      );
      return;
    }

    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { value, expiresAt });
    this.logger.debug(`💾 [cache:mem] SET key=${key} ttlMs=${ttlMs}`);
  }

  async delete(key: string): Promise<void> {
    if (this.redis) {
      const fullKey = this.key(key);
      await this.redis.del(fullKey);
      this.logger.debug(`🗑️ [cache:redis] DEL key=${fullKey}`);
      return;
    }

    this.store.delete(key);
    this.logger.debug(`🗑️ [cache:mem] DEL key=${key}`);
  }

  async clear(): Promise<void> {
    if (this.redis) {
      // Para dev está bien FLUSHDB; en prod deberías usar un prefix + SCAN
      await this.redis.flushdb();
      this.logger.warn(`🧹 [cache:redis] FLUSHDB`);
      return;
    }

    this.store.clear();
    this.logger.warn(`🧹 [cache:mem] CLEAR all entries`);
  }
}
