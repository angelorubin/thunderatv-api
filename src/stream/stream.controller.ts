import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StreamAccessDto } from './dto/stream-access.dto';
import { StreamService } from './stream.service';

@Controller('stream')
@UseGuards(JwtAuthGuard)
export class StreamController {
  constructor(private readonly streamService: StreamService) { }

  @Post('check')
  checkAccess(
    @CurrentUser() user: { sub: string },
    @Body() dto: StreamAccessDto,
  ) {
    return this.streamService.checkAccess(user.sub, dto.contentId);
  }
}
