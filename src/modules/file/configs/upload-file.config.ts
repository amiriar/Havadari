import {
  audioExtensions,
  BASE_UPLOAD_PATH,
  documentExtentions,
  imageExtensions,
  PUBLIC_FILES_DIRECTORY,
  videoExtentions,
} from '@common/utils/constants.utils';
import { Injectable } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 } from 'uuid';
import { UploadConfig } from './upload.config';

@Injectable()
export class UploadFileConfig extends UploadConfig implements MulterOptions {
  constructor() {
    super();
    this.allowedMimetypes = documentExtentions
      .concat(videoExtentions)
      .concat(audioExtensions)
      .concat(imageExtensions)
      .concat(audioExtensions);
    this.setLimits();
    this.setStorage();
  }

  setStorage(): void {
    this.storage = diskStorage({
      destination: (request, file, callback) => {
        callback(null, join(BASE_UPLOAD_PATH, PUBLIC_FILES_DIRECTORY));
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
      fileSize: 1024 * 1024 * 40, // 40MB in Bytes.
    };
  }
}
