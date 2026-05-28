import { IsString, MinLength } from 'class-validator';

export class PaymentIntentActionDto {
  @IsString()
  @MinLength(1)
  paymentIntentId: string;
}