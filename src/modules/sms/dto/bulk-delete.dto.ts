import { IsArray, IsUUID } from 'class-validator';

export class BulkDeleteDto {
  @IsArray()
  @IsUUID('all', { each: true })
  ids: string[];
}
