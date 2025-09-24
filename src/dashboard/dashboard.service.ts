import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStatistics() {
    try {
      // Get all counts in parallel for better performance
      const [
        totalProducts,
        totalCategories,
        totalCollections,
        totalUsers,
        totalOrders,
        activeSales,
        todayOrders,
        recentProducts,
        recentOrders,
        recentUsers
      ] = await Promise.all([
        // Total products
        this.prisma.product.count({
          where: { isActive: true }
        }),
        
        // Total categories
        this.prisma.category.count({
          where: { isActive: true }
        }),
        
        // Total collections
        this.prisma.collection.count({
          where: { isActive: true }
        }),
        
        // Total users (customers)
        this.prisma.user.count({
          where: { role: 'USER' }
        }),
        
        // Total orders
        this.prisma.order.count(),
        
        // Active sales (products on sale)
        this.prisma.product.count({
          where: { 
            isActive: true,
            isOnSale: true 
          }
        }),
        
        // Orders today
        this.prisma.order.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        
        // Recent products (last 5)
        this.prisma.product.findMany({
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            name: true,
            createdAt: true,
            images: {
              where: { isMain: true },
              take: 1,
              select: { url: true }
            }
          }
        }),
        
        // Recent orders (last 5)
        this.prisma.order.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }),
        
        // Recent users (last 5)
        this.prisma.user.findMany({
          where: { role: 'USER' },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true
          }
        })
      ]);

      // Calculate percentage changes (mock data for now - in real app, compare with previous period)
      const productChange = Math.floor(Math.random() * 20) + 1; // 1-20% increase
      const categoryChange = Math.floor(Math.random() * 10) + 1; // 1-10% increase
      const collectionChange = Math.floor(Math.random() * 15) + 1; // 1-15% increase
      const userChange = Math.floor(Math.random() * 25) + 1; // 1-25% increase
      const orderChange = Math.floor(Math.random() * 30) + 1; // 1-30% increase
      const saleChange = Math.floor(Math.random() * 40) + 1; // 1-40% increase

      return {
        statistics: {
          totalProducts: {
            value: totalProducts,
            change: `+${productChange}%`,
            changeType: 'increase'
          },
          totalCategories: {
            value: totalCategories,
            change: `+${categoryChange}`,
            changeType: 'increase'
          },
          totalCollections: {
            value: totalCollections,
            change: `+${collectionChange}`,
            changeType: 'increase'
          },
          totalUsers: {
            value: totalUsers,
            change: `+${userChange}%`,
            changeType: 'increase'
          },
          totalOrders: {
            value: totalOrders,
            change: `+${orderChange}%`,
            changeType: 'increase'
          },
          activeSales: {
            value: activeSales,
            change: `+${saleChange}%`,
            changeType: 'increase'
          },
          todayOrders: {
            value: todayOrders,
            change: `+${Math.floor(Math.random() * 15) + 1}%`,
            changeType: 'increase'
          }
        },
        recentActivity: {
          products: recentProducts,
          orders: recentOrders,
          users: recentUsers
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard statistics:', error);
      throw new Error('Failed to fetch dashboard statistics');
    }
  }

  async getRevenueStats() {
    try {
      // Get revenue statistics
      const [
        totalRevenue,
        monthlyRevenue,
        weeklyRevenue,
        todayRevenue
      ] = await Promise.all([
        // Total revenue
        this.prisma.order.aggregate({
          _sum: { total: true },
          where: { status: { not: 'CANCELLED' } }
        }),
        
        // Monthly revenue
        this.prisma.order.aggregate({
          _sum: { total: true },
          where: {
            status: { not: 'CANCELLED' },
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),
        
        // Weekly revenue
        this.prisma.order.aggregate({
          _sum: { total: true },
          where: {
            status: { not: 'CANCELLED' },
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        }),
        
        // Today's revenue
        this.prisma.order.aggregate({
          _sum: { total: true },
          where: {
            status: { not: 'CANCELLED' },
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        })
      ]);

      return {
        totalRevenue: totalRevenue._sum.total || 0,
        monthlyRevenue: monthlyRevenue._sum.total || 0,
        weeklyRevenue: weeklyRevenue._sum.total || 0,
        todayRevenue: todayRevenue._sum.total || 0
      };
    } catch (error) {
      console.error('Error fetching revenue statistics:', error);
      throw new Error('Failed to fetch revenue statistics');
    }
  }
}
