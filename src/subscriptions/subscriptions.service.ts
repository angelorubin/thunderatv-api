import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) { }

  async findMy(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, planId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });

    if (!plan) {
      throw new NotFoundException('Plano não encontrado.');
    }

    const existing = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'PENDING'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    const subscription = existing
      ? await this.prisma.subscription.update({
        where: { id: existing.id },
        data: {
          planId,
          status: 'ACTIVE',
          startedAt: new Date(),
          expiresAt: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
          autoRenew: true,
        },
      })
      : await this.prisma.subscription.create({
        data: {
          userId,
          planId,
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
          autoRenew: true,
        },
      });

    await this.prisma.payment.create({
      data: {
        userId,
        subscriptionId: subscription.id,
        provider: 'internal',
        amount: plan.price,
        status: 'PAID',
        externalReference: `internal-${subscription.id}`,
      },
    });

    return subscription;
  }

  async isAccessAllowed(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
      include: { plan: true },
      orderBy: { startedAt: 'desc' },
    });

    return {
      allowed: Boolean(subscription),
      subscription,
    };
  }
}
