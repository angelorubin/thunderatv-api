import { Injectable } from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class StreamService {
  constructor(private readonly subscriptionsService: SubscriptionsService) { }

  async checkAccess(userId: string, contentId: string) {
    const { allowed, subscription } = await this.subscriptionsService.isAccessAllowed(userId);

    return {
      allowed,
      contentId,
      plan: subscription?.plan?.name ?? null,
      expiresAt: subscription?.expiresAt ?? null,
    };
  }
}
