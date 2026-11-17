import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  const prisma = {
    payment: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(() => {
    service = new PaymentsService(prisma as any);
    jest.clearAllMocks();
  });

  it('should create a paid payment record for an active subscription', async () => {
    const payment = {
      id: 'pay_123',
      userId: 'user_1',
      subscriptionId: 'sub_1',
      provider: 'mock',
      amount: 29.99,
      status: 'PAID',
      externalReference: 'ref_321',
    };

    prisma.payment.create.mockResolvedValue(payment);

    const result = await service.recordSubscriptionPayment({
      userId: 'user_1',
      subscriptionId: 'sub_1',
      provider: 'mock',
      amount: 29.99,
      externalReference: 'ref_321',
    });

    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: {
        userId: 'user_1',
        subscriptionId: 'sub_1',
        provider: 'mock',
        amount: 29.99,
        status: 'PAID',
        externalReference: 'ref_321',
      },
    });
    expect(result.status).toBe('PAID');
    expect(result.amount).toBe(29.99);
  });
});
