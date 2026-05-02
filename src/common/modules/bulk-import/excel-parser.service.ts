import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { plainToInstance } from 'class-transformer';
import { unflatten } from '@common/utils/flatten';
import { normalizeBooleanStrings } from './utils/normalize';

@Injectable()
export class ExcelParserService {
  parse(buffer: Buffer): Record<string, any>[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    // Get the range of the sheet
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');

    // Read database column names from row 2 (skip row 1 - Persian labels)
    const dbHeaders: string[] = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 1, c: col });
      const cell = sheet[cellAddress];
      dbHeaders[col] = cell ? cell.v : '';
    }

    // Read data starting from row 3
    const dataRows: Record<string, any>[] = [];
    for (let row = 2; row <= range.e.r; row++) {
      const rowData: Record<string, any> = {};
      let hasData = false;

      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = sheet[cellAddress];
        const value = cell ? cell.v : null;

        if (value !== null && value !== undefined && value !== '') {
          hasData = true;
        }

        // Use database column name as key
        const dbHeader = dbHeaders[col];
        if (dbHeader) {
          rowData[dbHeader] = value;
        }
      }

      // Only add row if it has some data
      if (hasData) {
        dataRows.push(rowData);
      }
    }

    return dataRows;
  }

  prepareDto<T>(row: Record<string, any>, dtoClass: new () => T): T {
    const nested = unflatten(row);
    const cleaned = normalizeBooleanStrings(nested);
    return plainToInstance(dtoClass, cleaned);
  }
}
