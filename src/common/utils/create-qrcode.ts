import * as QRCode from 'qrcode';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { BASE_UPLOAD_PATH, IMAGES_DIRECTORY } from './constants.utils';
import * as fs from 'fs';
import { QRCodeOptions } from '@common/interfaces/qr-code-options.interface';

export async function createQRCode(
  data: string,
  filename?: string,
  options?: QRCodeOptions,
): Promise<Express.Multer.File> {
  if (!options) {
    options = {
      errorCorrectionLevel: 'H',
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    };
  }

  try {
    // Generate unique filename if not provided
    if (!filename) {
      filename = `qrcode-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
    }

    // Ensure filename has .png extension
    const pngFilename = filename.endsWith('.png')
      ? filename
      : `${filename}.png`;

    // Generate QR code as buffer
    const buffer = await QRCode.toBuffer(data, options);

    // Create file directory
    const fileDirectory = join(BASE_UPLOAD_PATH, IMAGES_DIRECTORY, 'qrcodes');

    // Ensure directory exists
    if (!fs.existsSync(fileDirectory)) {
      fs.mkdirSync(fileDirectory, { recursive: true }); // i added recursive: true to create the directory if it doesn't exist
    }

    const fullPath = join(fileDirectory, pngFilename);

    // Save buffer to file
    const writeStream = createWriteStream(fullPath);
    writeStream.write(buffer);
    writeStream.end();

    // Create a mock Express.Multer.File object for the FileService
    const qrCodeFile: Express.Multer.File = {
      fieldname: 'qrCode',
      originalname: filename,
      encoding: '7bit',
      mimetype: 'image/png',
      buffer: buffer,
      size: buffer.length,
      destination: '',
      filename: filename,
      path: fullPath,
      stream: null,
    };

    return qrCodeFile;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
}
