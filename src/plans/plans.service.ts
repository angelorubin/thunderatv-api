import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll() {
    return this.prisma.plan.findMany({
      where: { active: true },
      orderBy: { price: 'asc' },
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });

    if (!plan) {
      throw new NotFoundException('Plano não encontrado.');
    }

    return plan;
  }

  async create(data: { name: string; description?: string; price: number; durationDays: number }) {
    return this.prisma.plan.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        durationDays: data.durationDays,
      },
    });
  }
}
