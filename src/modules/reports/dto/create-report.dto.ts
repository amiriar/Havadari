import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}

