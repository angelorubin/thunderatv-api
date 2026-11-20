import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: adminUserSelect,
    });
  }

  async getSubscriptions() {
    return this.prisma.subscription.findMany({
      include: { user: { select: adminUserSelect }, plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPayments() {
    return this.prisma.payment.findMany({
      include: {
        user: { select: adminUserSelect },
        subscription: { include: { plan: true } },
      },
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
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!existingUser) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (existingUser.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'O status de um SUPER_ADMIN não pode ser alterado por esta rota.',
      );
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { status },
      select: adminUserSelect,
    });
  }

  async updateUserRole(
    userId: string,
    role: Exclude<UserRole, 'SUPER_ADMIN'>,
    actorUserId: string,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const existingUser = await transaction.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!existingUser) {
        throw new NotFoundException('Usuário não encontrado.');
      }

      if (existingUser.role === UserRole.SUPER_ADMIN) {
        throw new ForbiddenException(
          'O papel de um SUPER_ADMIN não pode ser alterado por esta rota.',
        );
      }

      const updatedUser = await transaction.user.update({
        where: { id: userId },
        data: { role },
        select: adminUserSelect,
      });

      await transaction.accessLog.create({
        data: {
          userId: actorUserId,
          action: `USER_ROLE_UPDATED:${userId}:${existingUser.role}->${role}`,
        },
      });

      return updatedUser;
    });
  }
}
