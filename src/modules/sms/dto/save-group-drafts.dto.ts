import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { SaveDraftDto } from './save-draf.dto';

export class SaveGroupDrafts {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveDraftDto)
  messages: SaveDraftDto[];
}
