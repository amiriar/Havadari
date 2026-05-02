import { IsArray } from 'class-validator';

export class SendGroupDraftDto {
  @IsArray()
  draftIds: string[];
}
