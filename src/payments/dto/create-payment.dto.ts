import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  provider: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  subscriptionId?: string;

  @IsOptional()
  @IsString()
  externalReference?: string;
}

export class PaymentWebhookDto {
  @IsString()
  externalReference: string;

  @IsEnum(['PENDING', 'PAID', 'FAILED', 'REFUNDED'])
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

  @IsOptional()
  @IsString()
  provider?: string;
}
