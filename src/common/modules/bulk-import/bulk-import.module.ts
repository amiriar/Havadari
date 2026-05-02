import { Module } from '@nestjs/common';
import { BulkImportService } from './bulk-import.service';
import { DtoValidationService } from './dto-validation.service';
import { ExcelParserService } from './excel-parser.service';

@Module({
  providers: [BulkImportService, DtoValidationService, ExcelParserService],
  exports: [BulkImportService],
})
export class BulkImportModule {}
