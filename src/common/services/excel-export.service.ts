import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { FileService } from '@app/file/services/file.service';
import { IFileOwner } from '@common/interfaces/file-owner.interface';
import { BASE_UPLOAD_PATH } from '@common/utils/constants.utils';

@Injectable()
export class ExcelExportService {
  constructor(private readonly fileService: FileService) {}

  async exportToExcel<T>(
    data: T[],
    filename: string,
    sheetName: string = 'Sheet1',
    owner?: IFileOwner,
    title?: string,
    headerRows?: string[][],
    columnOrder?: string[],
    numericColumns?: string[],
    militaryTimeColumns?: string[],
  ): Promise<{ filePath: string; fileRecord?: any }> {
    const workbook = XLSX.utils.book_new();

    const aoa: any[][] = [];

    headerRows.forEach((row) => aoa.push(row));

    for (const item of data as any[]) {
      const row = columnOrder.map((key) => {
        const value = this.getNestedProperty(item, key);
        if (militaryTimeColumns.includes(key)) return this.toHHmm(value);
        if (numericColumns.includes(key)) {
          return Number(value);
        }

        return value;
      });
      aoa.push(row);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(aoa);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Ensure uploads/excels directory exists
    const uploadsDir = path.join(BASE_UPLOAD_PATH, 'excels');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(uploadsDir, `${filename}_${timestamp}.xlsx`);

    // Write file
    XLSX.writeFile(workbook, filePath);

    let fileRecord = null;

    // If owner is provided, save to file service
    if (owner) {
      const fileBuffer = XLSX.write(workbook, { type: 'buffer' });
      const tempFilePath = filePath;

      // Create a mock Multer file object
      const mockFile: Express.Multer.File = {
        fieldname: 'excel',
        originalname: `${filename}.xlsx`,
        encoding: '7bit',
        mimetype:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: fileBuffer.length,
        destination: path.dirname(tempFilePath),
        filename: path.basename(tempFilePath),
        path: tempFilePath,
        buffer: fileBuffer,
        stream: null as any,
      };

      fileRecord = await this.fileService.save(mockFile, owner, title);
    }

    return { filePath, fileRecord };
  }

  private toHHmm(t?: any): string | undefined {
    if (t == null) return t;

    if (t instanceof Date) {
      const hh = String(t.getHours()).padStart(2, '0');
      const mm = String(t.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    }

    const s = String(t).trim();

    const m = /^(\d{1,2}):([0-5]\d)(?::([0-5]\d))?/.exec(s);
    if (m) {
      const hh = m[1].padStart(2, '0');
      const mm = m[2];
      return `${hh}:${mm}`;
    }

    const m2 = /(\d{2}:\d{2})/.exec(s);
    if (m2) return m2[1];

    return s;
  }
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
