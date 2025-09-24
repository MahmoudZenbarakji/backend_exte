import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    // Note: reset method may not be available in all cache implementations
    // This is a placeholder for cache clearing functionality
    console.log('Cache reset requested - implementation depends on cache store');
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

  static getSubcategoriesKey(categoryId: string): string {
    return `subcategories:${categoryId}`;
  }

  static getUserKey(id: number): string {
    return `user:${id}`;
  }

  static getOrderKey(id: string): string {
    return `order:${id}`;
  }

  static getUserOrdersKey(userId: number): string {
    return `orders:user:${userId}`;
  }
}
