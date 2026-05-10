import { User } from '@app/auth/entities/user.entity';
import { RankPointSourceEnum } from '@app/leaderboard/constants/rank-point-source.enum';
import { RankPointsService } from '@app/leaderboard/rank-points.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import { DataSource, In, Repository } from 'typeorm';
import {
  PredictionBetStatusEnum,
  PredictionMatchStatusEnum,
} from './constants/prediction.enums';
import { AdminImportWorldcupMatchesDto } from './dto/admin-import-worldcup-matches.dto';
import { AdminSetPredictionResultDto } from './dto/admin-set-prediction-result.dto';
import { AdminUpsertPredictionMatchDto } from './dto/admin-upsert-prediction-match.dto';
import { AdminUpsertPredictionOptionDto } from './dto/admin-upsert-prediction-option.dto';
import { GetPredictionMatchesQueryDto } from './dto/get-prediction-matches-query.dto';
import { PlacePredictionDto } from './dto/place-prediction.dto';
import { PredictionBet } from './entities/prediction-bet.entity';
import { PredictionMatch } from './entities/prediction-match.entity';
import { PredictionOption } from './entities/prediction-option.entity';
import { PredictionSettlementLog } from './entities/prediction-settlement-log.entity';

const MIN_ODDS = 1.3;
const MAX_ODDS = 10;
const LOCK_MINUTES_BEFORE_START = 30;
const USER_PER_MATCH_MAX_STAKE = 20000;

@Injectable()
export class PredictionService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(PredictionMatch)
    private readonly matchRepo: Repository<PredictionMatch>,
    @InjectRepository(PredictionOption)
    private readonly optionRepo: Repository<PredictionOption>,
    @InjectRepository(PredictionBet)
    private readonly betRepo: Repository<PredictionBet>,
    @InjectRepository(PredictionSettlementLog)
    private readonly settlementRepo: Repository<PredictionSettlementLog>,
    private readonly rankPointsService: RankPointsService,
  ) {}

  async listMatches(query: GetPredictionMatchesQueryDto, url?: string) {
    const now = new Date();
    await this.lockExpiredMatches(now);
    const qb = this.matchRepo
      .createQueryBuilder('m')
      .where('m.status IN (:...statuses)', {
        statuses: [PredictionMatchStatusEnum.OPEN, PredictionMatchStatusEnum.LOCKED],
      })
      .orderBy('m.startsAt', 'ASC');
    return paginate(qb, {
      page: query.page ?? 1,
      limit: Math.min(query.limit ?? 20, 200),
      route: url,
    });
  }

  async getMatchOptions(matchId: string) {
    const match = await this.mustMatch(matchId);
    const options = await this.optionRepo.find({
      where: { match: { id: match.id }, isActive: true },
      order: { createdAt: 'ASC' },
    });
    const odds = await this.calculateOdds(match.id, options.map((o) => o.optionKey));
    return {
      matchId: match.id,
      status: match.status,
      startsAt: match.startsAt,
      lockAt: match.lockAt,
      options: options.map((o) => ({
        id: o.id,
        optionKey: o.optionKey,
        title: o.title,
        currentOdds: odds[o.optionKey] ?? MIN_ODDS,
      })),
    };
  }

  async place(userId: string, dto: PlacePredictionDto) {
    const user = await this.getUserByIdOrFail(userId);
    const now = new Date();
    const match = await this.mustMatch(dto.matchId);
    await this.lockExpiredMatches(now);
    if (![PredictionMatchStatusEnum.OPEN].includes(match.status)) {
      throw new BadRequestException('Prediction match is not open.');
    }
    if (now.getTime() >= match.lockAt.getTime()) {
      throw new BadRequestException('Prediction window is closed.');
    }
    const option = await this.optionRepo.findOne({
      where: {
        match: { id: match.id },
        optionKey: dto.optionKey,
        isActive: true,
      },
    });
    if (!option) throw new BadRequestException('Invalid prediction option.');
    if (user.fgc < dto.stakeFgc) {
      throw new BadRequestException('Not enough FGC.');
    }

    const existingStake = await this.betRepo
      .createQueryBuilder('b')
      .select('COALESCE(SUM(b.stakeFgc), 0)', 'sum')
      .where('b.userId = :userId', { userId: user.id })
      .andWhere('b.matchId = :matchId', { matchId: match.id })
      .getRawOne<{ sum: string }>();
    const sum = Number(existingStake?.sum || 0);
    if (sum + dto.stakeFgc > USER_PER_MATCH_MAX_STAKE) {
      throw new BadRequestException('Per-match stake limit exceeded.');
    }

    const oddsMap = await this.calculateOdds(match.id, [dto.optionKey]);
    const lockedOdds = oddsMap[dto.optionKey] ?? MIN_ODDS;

    return this.dataSource.transaction(async (manager) => {
      const lockedUser = await manager
        .getRepository(User)
        .createQueryBuilder('u')
        .setLock('pessimistic_write')
        .where('u.id = :id', { id: user.id })
        .getOne();
      if (!lockedUser) throw new UnauthorizedException('User not found.');
      if (lockedUser.fgc < dto.stakeFgc) {
        throw new BadRequestException('Not enough FGC.');
      }
      lockedUser.fgc -= dto.stakeFgc;
      await manager.getRepository(User).save(lockedUser);

      const bet = await manager.getRepository(PredictionBet).save(
        manager.getRepository(PredictionBet).create({
          user: lockedUser,
          match,
          optionKey: dto.optionKey,
          stakeFgc: dto.stakeFgc,
          lockedOdds: String(lockedOdds),
          status: PredictionBetStatusEnum.PENDING,
          payoutFgc: 0,
          settledAt: null,
        }),
      );
      return {
        placed: true,
        betId: bet.id,
        lockedOdds,
        stakeFgc: bet.stakeFgc,
        balanceFgc: lockedUser.fgc,
      };
    });
  }

  async myPredictions(userId: string, page = 1, limit = 20, url?: string) {
    await this.getUserByIdOrFail(userId);
    const qb = this.betRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.match', 'm')
      .where('b.userId = :userId', { userId })
      .orderBy('b.createdAt', 'DESC');
    return paginate(qb, {
      page,
      limit: Math.min(limit, 200),
      route: url,
    });
  }

  async adminUpsertMatch(dto: AdminUpsertPredictionMatchDto) {
    const startsAt = new Date(dto.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      throw new BadRequestException('Invalid startsAt.');
    }
    const lockAt = new Date(
      startsAt.getTime() - LOCK_MINUTES_BEFORE_START * 60 * 1000,
    );
    const existing = await this.matchRepo.findOne({
      where: { externalMatchId: dto.externalMatchId },
    });
    const row = existing || this.matchRepo.create();
    row.externalMatchId = dto.externalMatchId;
    row.homeTeam = dto.homeTeam;
    row.awayTeam = dto.awayTeam;
    row.startsAt = startsAt;
    row.lockAt = lockAt;
    row.status = dto.status ?? row.status ?? PredictionMatchStatusEnum.DRAFT;
    return this.matchRepo.save(row);
  }

  async adminImportWorldcupMatches(dto: AdminImportWorldcupMatchesDto) {
    const year = dto.year ?? 2026;
    const markOpen = dto.open ?? true;
    const url = `https://raw.githubusercontent.com/openfootball/worldcup.json/master/${year}/worldcup.json`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new BadRequestException(
        `Failed to fetch world cup source (${response.status}).`,
      );
    }
    const payload = (await response.json()) as {
      name?: string;
      matches?: Array<{
        round?: string;
        date?: string;
        time?: string;
        team1?: string;
        team2?: string;
        group?: string;
      }>;
    };

    const sourceMatches = Array.isArray(payload.matches) ? payload.matches : [];
    if (!sourceMatches.length) {
      throw new BadRequestException('No matches found in world cup source.');
    }

    let inserted = 0;
    let updated = 0;

    for (let idx = 0; idx < sourceMatches.length; idx += 1) {
      const m = sourceMatches[idx];
      const homeTeam = (m.team1 || '').trim();
      const awayTeam = (m.team2 || '').trim();
      const date = (m.date || '').trim();
      if (!homeTeam || !awayTeam || !date) continue;

      const startsAt = this.parseOpenfootballDateTime(date, m.time);
      const externalMatchId = `openfootball:${year}:${date}:${homeTeam}:vs:${awayTeam}`;

      const existing = await this.matchRepo.findOne({
        where: { externalMatchId },
      });

      const row = existing || this.matchRepo.create();
      row.externalMatchId = externalMatchId;
      row.homeTeam = homeTeam;
      row.awayTeam = awayTeam;
      row.startsAt = startsAt;
      row.lockAt = new Date(
        startsAt.getTime() - LOCK_MINUTES_BEFORE_START * 60 * 1000,
      );
      row.status =
        row.status === PredictionMatchStatusEnum.SETTLED
          ? PredictionMatchStatusEnum.SETTLED
          : markOpen
            ? PredictionMatchStatusEnum.OPEN
            : row.status || PredictionMatchStatusEnum.DRAFT;

      const saved = await this.matchRepo.save(row);
      if (existing) updated += 1;
      else inserted += 1;

      await this.ensureDefaultOptions(saved.id);
    }

    return {
      source: payload.name || `World Cup ${year}`,
      season: year,
      totalFetched: sourceMatches.length,
      inserted,
      updated,
    };
  }

  async adminUpsertOption(dto: AdminUpsertPredictionOptionDto) {
    const match = await this.mustMatch(dto.matchId);
    const existing = await this.optionRepo.findOne({
      where: { match: { id: match.id }, optionKey: dto.optionKey },
    });
    const row = existing || this.optionRepo.create();
    row.match = match;
    row.optionKey = dto.optionKey;
    row.title = dto.title;
    row.isActive = dto.isActive;
    return this.optionRepo.save(row);
  }

  async adminSetResult(dto: AdminSetPredictionResultDto) {
    const match = await this.mustMatch(dto.matchId);
    const option = await this.optionRepo.findOne({
      where: {
        match: { id: match.id },
        optionKey: dto.resultOptionKey,
      },
    });
    if (!option) throw new BadRequestException('Result option not found.');
    match.resultOptionKey = option.optionKey;
    if (match.status !== PredictionMatchStatusEnum.SETTLED) {
      match.status = PredictionMatchStatusEnum.LOCKED;
    }
    await this.matchRepo.save(match);
    return match;
  }

  async adminSetMatchStatus(matchId: string, status: PredictionMatchStatusEnum) {
    const match = await this.mustMatch(matchId);
    if (status === PredictionMatchStatusEnum.SETTLED) {
      throw new BadRequestException('Use settle endpoint for settled status.');
    }
    match.status = status;
    await this.matchRepo.save(match);
    return match;
  }

  async adminSettleMatch(matchId: string) {
    const match = await this.mustMatch(matchId);
    if (!match.resultOptionKey) {
      throw new BadRequestException('Result is not set.');
    }
    const existing = await this.settlementRepo.findOne({
      where: { match: { id: match.id } },
    });
    if (existing) {
      return {
        settled: false,
        reason: 'already_settled',
        matchId: match.id,
      };
    }

    return this.dataSource.transaction(async (manager) => {
      const bets = await manager.getRepository(PredictionBet).find({
        where: { match: { id: match.id }, status: PredictionBetStatusEnum.PENDING },
        relations: { user: true },
      });
      let totalPayoutFgc = 0;
      let winningBets = 0;

      for (const bet of bets) {
        const isWin = bet.optionKey === match.resultOptionKey;
        if (isWin) {
          const payout = Math.max(
            0,
            Math.floor(bet.stakeFgc * Number(bet.lockedOdds)),
          );
          bet.status = PredictionBetStatusEnum.WON;
          bet.payoutFgc = payout;
          totalPayoutFgc += payout;
          winningBets += 1;
          bet.user.fgc += payout;
          await manager.getRepository(User).save(bet.user);
          await this.rankPointsService.apply(
            bet.user.id,
            2,
            RankPointSourceEnum.REWARD,
            bet.id,
            { source: 'prediction_win', matchId: match.id },
          );
        } else {
          bet.status = PredictionBetStatusEnum.LOST;
          bet.payoutFgc = 0;
        }
        bet.settledAt = new Date();
        await manager.getRepository(PredictionBet).save(bet);
      }

      match.status = PredictionMatchStatusEnum.SETTLED;
      match.settledAt = new Date();
      await manager.getRepository(PredictionMatch).save(match);

      await manager.getRepository(PredictionSettlementLog).save(
        manager.getRepository(PredictionSettlementLog).create({
          match,
          totalBets: bets.length,
          winningBets,
          totalPayoutFgc,
          meta: {
            resultOptionKey: match.resultOptionKey,
          },
        }),
      );

      return {
        settled: true,
        matchId: match.id,
        totalBets: bets.length,
        winningBets,
        totalPayoutFgc,
      };
    });
  }

  async adminMatches(page = 1, limit = 20, url?: string) {
    const qb = this.matchRepo
      .createQueryBuilder('m')
      .orderBy('m.startsAt', 'DESC');
    return paginate(qb, {
      page,
      limit: Math.min(limit, 200),
      route: url,
    });
  }

  async adminBets(matchId?: string, page = 1, limit = 20, url?: string) {
    const qb = this.betRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.user', 'u')
      .leftJoinAndSelect('b.match', 'm')
      .orderBy('b.createdAt', 'DESC');
    if (matchId) {
      qb.andWhere('m.id = :matchId', { matchId });
    }
    return paginate(qb, {
      page,
      limit: Math.min(limit, 200),
      route: url,
    });
  }

  private async calculateOdds(matchId: string, optionKeys: string[]) {
    const rows = await this.betRepo
      .createQueryBuilder('b')
      .select('b.optionKey', 'optionKey')
      .addSelect('COALESCE(SUM(b.stakeFgc), 0)', 'stake')
      .where('b.matchId = :matchId', { matchId })
      .groupBy('b.optionKey')
      .getRawMany<{ optionKey: string; stake: string }>();

    const pools = new Map<string, number>();
    let total = 0;
    for (const row of rows) {
      const v = Number(row.stake || 0);
      pools.set(row.optionKey, v);
      total += v;
    }
    const baseline = Math.max(total, optionKeys.length * 1000);
    const out: Record<string, number> = {};
    for (const key of optionKeys) {
      const pool = pools.get(key) ?? 0;
      const p = Math.max(0.05, (pool + 1) / (baseline + optionKeys.length));
      const raw = 1 / p;
      out[key] = Math.max(MIN_ODDS, Math.min(MAX_ODDS, Number(raw.toFixed(3))));
    }
    return out;
  }

  private async lockExpiredMatches(now: Date) {
    const expired = await this.matchRepo.find({
      where: { status: PredictionMatchStatusEnum.OPEN },
    });
    const toLock = expired.filter((m) => m.lockAt.getTime() <= now.getTime());
    if (!toLock.length) return;
    for (const row of toLock) row.status = PredictionMatchStatusEnum.LOCKED;
    await this.matchRepo.save(toLock);
  }

  private parseOpenfootballDateTime(date: string, time?: string): Date {
    const normalizedDate = /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? date
      : new Date(date).toISOString().slice(0, 10);
    const timeRaw = (time || '').trim();
    const hhmmMatch = timeRaw.match(/^(\d{1,2}):(\d{2})/);
    const offsetMatch = timeRaw.match(/UTC([+-]\d{1,2})/i);

    const hh = hhmmMatch ? hhmmMatch[1].padStart(2, '0') : '12';
    const mm = hhmmMatch ? hhmmMatch[2] : '00';
    const offset = offsetMatch
      ? `${offsetMatch[1].startsWith('-') ? '-' : '+'}${offsetMatch[1]
          .replace(/[+-]/g, '')
          .padStart(2, '0')}`
      : '+00';

    return new Date(`${normalizedDate}T${hh}:${mm}:00${offset}:00`);
  }

  private async ensureDefaultOptions(matchId: string) {
    const defaults = [
      { optionKey: 'HOME_WIN', title: 'Home Win' },
      { optionKey: 'DRAW', title: 'Draw' },
      { optionKey: 'AWAY_WIN', title: 'Away Win' },
    ];

    for (const item of defaults) {
      const exists = await this.optionRepo.findOne({
        where: { match: { id: matchId }, optionKey: item.optionKey },
      });
      if (exists) continue;
      await this.optionRepo.save(
        this.optionRepo.create({
          match: { id: matchId } as PredictionMatch,
          optionKey: item.optionKey,
          title: item.title,
          isActive: true,
        }),
      );
    }
  }

  private async mustMatch(matchId: string) {
    const match = await this.matchRepo.findOne({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Prediction match not found.');
    return match;
  }

  private async getUserByIdOrFail(userId?: string) {
    if (!userId) throw new UnauthorizedException('Authentication required.');
    const found = await this.userRepo.findOne({ where: { id: userId } });
    if (!found) throw new UnauthorizedException('User not found.');
    return found;
  }
}
