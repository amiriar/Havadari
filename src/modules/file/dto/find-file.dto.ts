import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiHideProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentMimeType } from '@app/file/enum/ducument-mime-type.enum';
import { PaginationDto } from '@common/dto';
import { IsDateOnly } from '@common/validators';
import { ApiProperty } from '@nestjs/swagger';

export class FindFileDto extends PaginationDto {
  @IsOptional()
  @IsEnum(DocumentMimeType)
  extension?: DocumentMimeType;

  @ApiPropertyOptional({
    description: 'Search term to filter files by title',
    example: 'medical report',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiHideProperty()
  mimeType?: string;

  @IsOptional()
  @IsDateOnly()
  @ApiProperty({ example: '2025-11-29' })
  fromDate?: Date;

  @IsOptional()
  @IsDateOnly()
  @ApiProperty({ example: '2025-11-30' })
  toDate?: Date;
}
