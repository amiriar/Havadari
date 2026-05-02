import { PartialType } from '@nestjs/mapped-types';
import { CreateFileDto } from './create-file.dto';

export class updateFileDto extends PartialType(CreateFileDto) {}
