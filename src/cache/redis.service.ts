import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private client: ReturnType<typeof createClient>;

  constructor(private configService: ConfigService) {
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      // Check if Redis is enabled
      const redisEnabled = this.configService.get('REDIS_ENABLED', 'false') === 'true';
      
      if (!redisEnabled) {
        this.logger.log('Redis is disabled for development');
        return;
      }

      this.client = createClient({
        url: this.configService.get('REDIS_URL') || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 500),
        },
      });

      this.client.on('error', (err) => {
        this.logger.error('Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        this.logger.log('Redis Client Connected');
      });

      await this.client.connect();
    } catch (error) {
      this.logger.error('Failed to initialize Redis:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.client) {
        this.logger.log(`Redis disabled - returning null for key ${key}`);
        return null;
      }
      const value = await this.client.get(key);
      return value ? JSON.parse(value as string) : null;
    } catch (error) {
      this.logger.error(`Error getting key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      if (!this.client) {
        this.logger.log(`Redis disabled - skipping set for key ${key}`);
        return true;
      }
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      return true;
    } catch (error) {
      this.logger.error(`Error setting key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (!this.client) {
        this.logger.log(`Redis disabled - skipping delete for key ${key}`);
        return true;
      }
      await this.client.del(key);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting key ${key}:`, error);
      return false;
    }
  }

  async delPattern(pattern: string): Promise<boolean> {
    try {
      if (!this.client) {
        this.logger.log(`Redis disabled - skipping delete pattern ${pattern}`);
        return true;
      }
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      this.logger.error(`Error deleting pattern ${pattern}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.client) {
        this.logger.log(`Redis disabled - returning false for exists ${key}`);
        return false;
      }
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking existence of key ${key}:`, error);
      return false;
    }
  }

  async flushAll(): Promise<boolean> {
    try {
      if (!this.client) {
        this.logger.log('Redis disabled - skipping flushAll');
        return true;
      }
      await this.client.flushAll();
      return true;
    } catch (error) {
      this.logger.error('Error flushing Redis:', error);
      return false;
    }
  }

  // Cache key generators
  static getProductKey(id: string): string {
    return `product:${id}`;
  }

  static getProductsKey(filters: any): string {
    const filterString = JSON.stringify(filters);
    return `products:${Buffer.from(filterString).toString('base64')}`;
  }

  static getCategoryKey(id: string): string {
    return `category:${id}`;
  }

  static getCategoriesKey(): string {
    return 'categories:all';
  }

  static getCartKey(userId: number): string {
    return `cart:${userId}`;
  }

  static getFavoritesKey(userId: number): string {
    return `favorites:${userId}`;
  }

  static getOrderKey(id: string): string {
    return `order:${id}`;
  }

  static getOrdersKey(userId: number): string {
    return `orders:${userId}`;
  }

  // Cache TTL constants (in seconds)
  static readonly TTL = {
    PRODUCT: 300, // 5 minutes
    PRODUCTS: 180, // 3 minutes
    CATEGORY: 600, // 10 minutes
    CATEGORIES: 900, // 15 minutes
    CART: 60, // 1 minute
    FAVORITES: 300, // 5 minutes
    ORDER: 1800, // 30 minutes
    ORDERS: 300, // 5 minutes
  };
}
