import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) { }

  async getUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async getSubscriptions() {
    return this.prisma.subscription.findMany({
      include: { user: true, plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPayments() {
    return this.prisma.payment.findMany({
      include: { user: true, subscription: { include: { plan: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats() {
    const [users, activeSubscriptions, plans, payments] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.plan.count(),
      this.prisma.payment.count(),
    ]);

    return {
      users,
      activeSubscriptions,
      plans,
      payments,
    };
  }

  async updateUserStatus(userId: string, status: boolean) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }
}
