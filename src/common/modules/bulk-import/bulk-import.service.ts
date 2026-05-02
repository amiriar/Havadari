import { Injectable } from '@nestjs/common';
import { BulkImportOptions } from './bulk-import.intrface';
import { DtoValidationService } from './dto-validation.service';
import { ExcelParserService } from './excel-parser.service';
import { BulkImportResult } from './types/bulk-import-result';
import { FailedRow } from './types/failed-row';

@Injectable()
export class BulkImportService {
  constructor(
    private readonly parser: ExcelParserService,
    private readonly validator: DtoValidationService,
  ) {}

  async importFromExcel<TDto, TEntity>(
    buffer: Buffer,
    options: BulkImportOptions<TDto, TEntity>,
  ): Promise<BulkImportResult> {
    const rows = this.parser.parse(buffer);
    const validEntities: TEntity[] = [];
    const failed: FailedRow[] = [];

    for (const flatRow of rows) {
      const dto = this.parser.prepareDto(flatRow, options.dtoClass);
      const errors = await this.validator.validate(dto);

      if (errors.length > 0) {
        failed.push({ row: flatRow, errors });
        continue;
      }

      const entity = await options.mapDtoToEntity(dto);
      validEntities.push(entity);
    }

    if (validEntities.length) {
      await options.saveEntities(validEntities);
    }

    return {
      successCount: validEntities.length,
      failed,
    };
  }
}
