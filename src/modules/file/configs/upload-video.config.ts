import { Injectable } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import {
  BASE_UPLOAD_PATH,
  videoExtentions,
  VIDEOS_DIRECTORY,
} from '@common/utils/constants.utils';
import { UploadConfig } from './upload.config';
import { v4 } from 'uuid';
import * as fs from 'fs';

@Injectable()
export class UploadVideoConfig extends UploadConfig implements MulterOptions {
  constructor() {
    super();
    this.allowedMimetypes = videoExtentions;
    this.setLimits();
    this.setStorage();
  }

  setStorage(): void {
    this.storage = diskStorage({
      destination: (request, file, callback) => {
        const destinationPath = join(
          BASE_UPLOAD_PATH,
          VIDEOS_DIRECTORY,
          file.fieldname + 's',
        );

        // Create directory if it doesn't exist
        if (!fs.existsSync(destinationPath)) {
          fs.mkdirSync(destinationPath, { recursive: true });
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
}
