import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { File } from '../entities/file.entity';

export class CreateFileDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  mimeType: string;

  @Type(() => File)
  relationType: File;

  @IsString()
  @IsUUID()
  relatedId: string;
}
