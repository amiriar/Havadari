import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { createHash } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { MatchSyncRun } from './entities/match-sync-run.entity';
import { WorldCupMatch } from './entities/world-cup-match.entity';
import { ApiFootballProvider } from './providers/api-football.provider';
import { FootballDataProvider } from './providers/football-data.provider';
import { MatchProvider, ProviderMatch } from './providers/match-provider.interface';

@Injectable()
export class MatchService {
  private readonly logger = new Logger(MatchService.name);

  constructor(
    @InjectRepository(WorldCupMatch)
    private readonly matchRepo: Repository<WorldCupMatch>,
    @InjectRepository(MatchSyncRun)
    private readonly runRepo: Repository<MatchSyncRun>,
    private readonly footballDataProvider: FootballDataProvider,
    private readonly apiFootballProvider: ApiFootballProvider,
  ) {}

  @Cron('0 0 */12 * * *')
  async syncEvery12Hours() {
    await this.syncNow();
  }

  async syncNow(season: number = 2026) {
    const providers: MatchProvider[] = [
      this.footballDataProvider,
      this.apiFootballProvider,
    ];

    let lastError: unknown = null;
    for (const provider of providers) {
      try {
        return await this.runSyncWithProvider(provider, season);
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Provider ${provider.name} failed. Trying fallback. ${String(error)}`,
        );
      }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  async getUpcoming(limit: number = 25) {
    return this.matchRepo.find({
      where: { matchDateUtc: MoreThan(new Date()) },
      order: { matchDateUtc: 'ASC' },
      take: limit,
    });
  }

  async getLatestSyncRuns(limit: number = 20) {
    return this.runRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findBestMatchForNow() {
    const now = new Date();
    const upcoming = await this.matchRepo.find({
      where: { matchDateUtc: MoreThan(now) },
      order: { matchDateUtc: 'ASC' },
      take: 1,
    });
    return upcoming[0] || null;
  }

  private async runSyncWithProvider(provider: MatchProvider, season: number) {
    const run = this.runRepo.create({
      provider: provider.name,
      status: 'SUCCESS',
      startedAt: new Date(),
      fetchedCount: 0,
      insertedCount: 0,
      updatedCount: 0,
      message: null,
      finishedAt: null,
    });
    await this.runRepo.save(run);

    try {
      const matches = await provider.fetchWorldCupMatches(season);
      run.fetchedCount = matches.length;
      const result = await this.upsertMatches(matches);
      run.insertedCount = result.inserted;
      run.updatedCount = result.updated;
      run.finishedAt = new Date();
      await this.runRepo.save(run);

      return {
        provider: provider.name,
        fetched: run.fetchedCount,
        inserted: run.insertedCount,
        updated: run.updatedCount,
      };
    } catch (error) {
      run.status = 'FAILED';
      run.message = error instanceof Error ? error.message : String(error);
      run.finishedAt = new Date();
      await this.runRepo.save(run);
      throw error;
    }
  }

  private async upsertMatches(matches: ProviderMatch[]) {
    let inserted = 0;
    let updated = 0;
    for (const data of matches) {
      const checksum = this.generateChecksum(data);
      const existing = await this.matchRepo.findOne({
        where: {
          provider: data.provider,
          providerMatchId: data.providerMatchId,
        },
      });

      if (!existing) {
        const entity = this.matchRepo.create({
          ...data,
          checksum,
          lastSyncedAt: new Date(),
        });
        await this.matchRepo.save(entity);
        inserted += 1;
        continue;
      }

      if (existing.checksum !== checksum) {
        existing.homeTeam = data.homeTeam;
        existing.awayTeam = data.awayTeam;
        existing.matchDateUtc = data.matchDateUtc;
        existing.venue = data.venue;
        existing.stage = data.stage;
        existing.status = data.status;
        existing.groupName = data.groupName;
        existing.winner = data.winner;
        existing.rawPayload = data.rawPayload;
        existing.checksum = checksum;
        existing.lastSyncedAt = new Date();
        await this.matchRepo.save(existing);
        updated += 1;
      } else {
        existing.lastSyncedAt = new Date();
        await this.matchRepo.save(existing);
      }
    }

    return { inserted, updated };
  }

  private generateChecksum(data: ProviderMatch): string {
    return createHash('sha256')
      .update(
        [
          data.homeTeam,
          data.awayTeam,
          data.matchDateUtc.toISOString(),
          data.venue || '',
          data.stage || '',
          data.status || '',
          data.groupName || '',
          data.winner || '',
        ].join('|'),
      )
      .digest('hex');
  }
}
