import { IFileOwner } from '@common/interfaces/file-owner.interface';
import { notFoundTemplate } from '@common/messages/en/templates/errors/not-found.template';
import {
  BASE_UPLOAD_PATH,
  UPLOADS_PUBLIC_PREFIX,
} from '@common/utils/constants.utils';
import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import { Repository } from 'typeorm';
import { File } from '../entities/file.entity';
import { User } from '@app/auth/entities/user.entity';
import { FindFileDto } from '../dto/find-file.dto';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { PaginationQuery } from '@common/dto/pagination-input-query';
import { extension_mimetype } from '../maps/extention-mimetype.map';
import { FileControllerCode } from '../constants/controller-codes';
import * as pathLib from 'path';
@Injectable()
export class FileService {
  constructor(
    @InjectRepository(File)
    private readonly repository: Repository<File>,
    private readonly configService: ConfigService,
  ) {}

  /**
   *
   * @param files Array<Express.Multer.File>
   * @param owner IFileOwner
   * @description save's many files uploaded in different fileds
   */
  async saveMany(files: Array<Express.Multer.File>, owner: IFileOwner) {
    const savedFiles = [];
    let temp: File;
    for (const key of Object.keys(files)) {
      temp = await this.save(files[key][0], owner);
      savedFiles.push(temp);
    }
    return savedFiles;
  }

  /**
   *
   * @param files Array<Express.Multer.File>
   * @param owner IFileOwner
   * @description save's many files uploaded in one filed
   */
  async saveManyInField(
    files: Array<Express.Multer.File>,
    owner: IFileOwner,
    title?: string,
    uploader?: User,
    relationType?: string,
  ) {
    const savedFiles = [];
    let tempFile;
    for (const key of Object.keys(files)) {
      tempFile = await this.save(
        files[key],
        owner,
        title,
        uploader,
        relationType,
      );
      savedFiles.push(tempFile);
    }

    return savedFiles;
  }

  async save(
    file: Express.Multer.File,
    owner: IFileOwner,
    title?: string,
    uploader?: User,
    relationType?: string,
  ) {
    if (!file) return;
    const fileTosave: File = this.repository.create();
    fileTosave.relatedEntity = owner.getName();
    fileTosave.url = this.generateUrl(file.path);
    fileTosave.path = file.path;
    fileTosave.relatedId = owner.getId();
    fileTosave.relationType = relationType ? relationType : file.fieldname;
    fileTosave.title = title ?? '';
    fileTosave.mimeType = file.mimetype;
    if (uploader) fileTosave.uploaderId = uploader.id;
    return await this.repository.save(fileTosave);
  }

  async find(owner: IFileOwner, relationType: string): Promise<Array<File>> {
    return await this.repository.find({
      where: {
        relatedEntity: owner.getName(),
        relatedId: owner.getId(),
        relationType: relationType,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Find files with advanced filtering at database level
   */
  async findWithFilters(
    owner: IFileOwner,
    dto: PaginationQuery<FindFileDto>,
    url: string,
  ): Promise<Pagination<File>> {
    dto.data.mimeType = extension_mimetype.get(dto.data.extension);

    delete dto.data.extension;

    return await paginate(
      this.repository,
      { ...dto.paginationOptions, route: url },
      {
        where: {
          relatedEntity: owner.getName(),
          relatedId: owner.getId(),
          ...dto.data,
        },
      },
    );
  }

  async findOne(fileId: string): Promise<File> {
    const file: File = await this.repository.findOneBy({ id: fileId });
    if (!file)
      throw new NotFoundException({
        code: `${FileControllerCode}01`,
        statusCode: HttpStatus.NOT_FOUND,
        message: notFoundTemplate({ entity: 'File' }),
      });
    return file;
  }

  async getUrl(fileId: string): Promise<string> {
    const file = await this.findOne(fileId);
    return file.url;
  }

  async replace(
    file: Express.Multer.File,
    oldFileId: string,
    owner: IFileOwner,
  ) {
    await this.remove(oldFileId);
    return await this.save(file, owner);
  }

  async remove(fileId: string) {
    const file: File = await this.findOne(fileId);
    fs.unlink(file.path, (error) => {
      if (error) throw error;
    });
    return await this.repository.delete({ id: fileId });
  }

  generateUrl(filePath: string): string {
    const relativePath = pathLib
      .relative(BASE_UPLOAD_PATH, filePath)
      .replace(/\\/g, '/');
    const assetOrigin = this.configService.get<string>('STATIC_ASSET_ORIGIN');
    return `${assetOrigin}${UPLOADS_PUBLIC_PREFIX}/${relativePath}`;
  }
}
