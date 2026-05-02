import { IsUUID } from 'class-validator';

export class SendDraftDto {
  @IsUUID()
  id: string;
}
