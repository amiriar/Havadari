import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import { Repository } from 'typeorm';
import { CreateReportDto } from './dto/create-report.dto';
import { Report } from './entities/report.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
  ) {}

  async create(
    userId: string,
    dto: CreateReportDto,
    photoFile?: Express.Multer.File,
  ) {
    const report = this.reportRepo.create({
      userId,
      content: dto.content,
      photoUrl: photoFile ? photoFile.path.replace(/\\/g, '/') : null,
      creatorId: userId,
    });

    const saved = await this.reportRepo.save(report);
    return {
      id: saved.id,
      content: saved.content,
      photoUrl: saved.photoUrl,
      createdAt: saved.createdAt,
    };
  }

  async adminList(page = 1, limit = 20, url?: string) {
    return paginate(
      this.reportRepo,
      {
        page,
        limit: Math.min(limit, 200),
        route: url,
      },
      {
        relations: ['user'],
        order: { createdAt: 'DESC' },
      },
    );
  }

  async adminGetById(id: string) {
    const report = await this.reportRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!report) {
      throw new NotFoundException('Report not found.');
    }

    return report;
  }
}
