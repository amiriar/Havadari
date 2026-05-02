import {
  Controller,
  Delete,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { FileService } from '../services/file.service';
import { Get, Param } from '@nestjs/common';
import { Res } from '@nestjs/common';
import { Response } from 'express';
import { File } from '../entities/file.entity';
import * as fs from 'fs';
import { FileControllerCode } from '../constants/controller-codes';
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get(':id')
  async downloadFile(@Param('id') fileId: string, @Res() res: Response) {
    //find file
    const file: File = await this.fileService.findOne(fileId);

    // Check if file exists and stream it
    if (!fs.existsSync(file.path)) {
      throw new NotFoundException({
        code: `${FileControllerCode}02`,
        statusCode: HttpStatus.NOT_FOUND,
        message: 'File not found on disk',
      });
    }

    // Set appropriate headers for file download
    res.setHeader('Content-Type', file.mimeType);

    const fileStream = fs.createReadStream(file.path);
    fileStream.pipe(res);
  }

  @Delete(':id')
  async deleteFile(@Param('id') fileId: string) {
    return this.fileService.remove(fileId);
  }
}
