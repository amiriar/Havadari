import { Injectable, UnsupportedMediaTypeException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import multer from 'multer';

@Injectable()
export abstract class UploadConfig implements MulterOptions {
  public storage?: multer.StorageEngine;
  public limits?: {
    fieldNameSize?: number;
    fieldSize?: number;
    fields?: number;
    fileSize?: number;
    files?: number;
    parts?: number;
    headerPairs?: number;
  };
  protected allowedMimetypes: Array<string>;

  fileFilter = (request, file, callback) => {
    if (this.allowedMimetypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new UnsupportedMediaTypeException(
          `Supported mediatypes: ${this.allowedMimetypes.toString()}`,
        ),
        false,
      );
    }
  };

  abstract setStorage(fileCategory: string, owner: string): void;

  setLimits(): void {
    this.limits = {
      fileSize: 1024 * 1024 * 10, // 10MB in Bytes.
    };
  }
}
