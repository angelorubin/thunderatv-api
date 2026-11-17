import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) { }

  @Get('me')
  findMy(@CurrentUser() user: { sub: string }) {
    return this.subscriptionsService.findMy(user.sub);
  }

  @Post()
  create(
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.create(user.sub, dto.planId);
  }
}
