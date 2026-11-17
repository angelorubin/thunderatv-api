import { IsString } from 'class-validator';

export class StreamAccessDto {
  @IsString()
  contentId: string;
}
