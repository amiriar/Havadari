import {
  BASE_UPLOAD_PATH,
  EXCEL_DIRECTORY,
  excelExtenstions,
} from '@common/utils/constants.utils';
import { Injectable } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
//import * as fs from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 } from 'uuid';
import { UploadConfig } from './upload.config';

@Injectable()
export class UploadExcelConfig extends UploadConfig implements MulterOptions {
  constructor() {
    super();
    this.allowedMimetypes = excelExtenstions;
    this.setLimits();
    this.setStorage();
  }

  setStorage() {
    // Create upload directory if it doesn't exist
    const uploadDir = join(BASE_UPLOAD_PATH, EXCEL_DIRECTORY);
    // if (!fs.existsSync(uploadDir)) {
    //   fs.mkdirSync(uploadDir, { recursive: true });
    // }

    this.storage = diskStorage({
      destination: (request, file, callback) => {
        callback(null, uploadDir);
      },
      filename: (request, file, callback) => {
        const extension = extname(file.originalname);
        const name = v4() + extension;
        callback(null, name);
      },
    });
  }

  /**
   * @override
   */
  setLimits() {
    this.limits = {
      fileSize: 1024 * 1024 * 20, //20MB
    };
  }
}
