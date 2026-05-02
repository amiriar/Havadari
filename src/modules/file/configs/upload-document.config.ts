import { Injectable } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import {
  BASE_UPLOAD_PATH,
  documentExtentions,
  DOCS_DIRECTORY,
} from '@common/utils/constants.utils';
import { UploadConfig } from './upload.config';
import { v4 } from 'uuid';
import { existsSync, mkdirSync } from 'fs';

@Injectable()
export class UploadDocumentConfig
  extends UploadConfig
  implements MulterOptions
{
  constructor() {
    super();
    this.allowedMimetypes = documentExtentions;
    this.setLimits();
    this.setStorage();
  }

  setStorage(): void {
    this.storage = diskStorage({
      destination: (request, file, callback) => {
        const destinationPath = join(
          BASE_UPLOAD_PATH,
          DOCS_DIRECTORY,
          file.fieldname + 's',
        );
        // Create directory if it doesn't exist
        if (!existsSync(destinationPath)) {
          mkdirSync(destinationPath, { recursive: true });
        }

        callback(null, destinationPath);
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
  setLimits(): void {
    this.limits = {
      fileSize: 1024 * 1024 * 10, // 10MB in Bytes.
    };
  }
}
