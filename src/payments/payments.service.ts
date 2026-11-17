import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentWebhookDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) { }

  async findMy(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      include: { subscription: { include: { plan: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async recordSubscriptionPayment(input: {
    userId: string;
    subscriptionId?: string;
    provider: string;
    amount: number;
    externalReference?: string;
  }) {
    return this.prisma.payment.create({
      data: {
        userId: input.userId,
        subscriptionId: input.subscriptionId ?? null,
        provider: input.provider,
        amount: input.amount,
        status: 'PAID',
        externalReference: input.externalReference ?? `payment-${Date.now()}`,
      },
    });
  }

  async handleWebhook(dto: PaymentWebhookDto) {
    const payment = await this.prisma.payment.findFirst({
      where: { externalReference: dto.externalReference },
    });

    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado para esse webhook.');
    }

    return this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: dto.status,
      },
    });
  }
}
