import { User } from '@app/auth/entities/user.entity';
import { UserCard } from '@app/cards/entities/user-card.entity';
import { Card } from '@app/cards/entities/card.entity';
import { UserChestInventory } from '@app/chests/entities/user-chest-inventory.entity';
import { ChestTypeEnum } from '@app/chests/constants/chest.types';
import { ProgressionService } from '@app/progression/progression.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource, In, Repository } from 'typeorm';
import {
  BattleModeEnum,
  BattleOpponentTypeEnum,
  BattleRegionEnum,
  BattleStatCategoryEnum,
  BattleStatusEnum,
  BattleWinnerEnum,
} from './constants/battle.enums';
import { BattleHistoryQueryDto } from './dto/battle-history-query.dto';
import { FindMatchDto } from './dto/find-match.dto';
import { StartBattleDto } from './dto/start-battle.dto';
import { BattleRound } from './entities/battle-round.entity';
import { Battle } from './entities/battle.entity';
import { RankedSeason } from './entities/ranked-season.entity';
import { RankedSeasonSnapshot } from './entities/ranked-season-snapshot.entity';
import {
  RANKED_SOFT_RESET_KEEP_RATIO,
  RANKED_TIERS,
  RankedTierConfig,
} from './constants/ranked.constants';
import { ChampionsTournament } from './entities/champions-tournament.entity';
import { ChampionsParticipant } from './entities/champions-participant.entity';
import { ChampionsMatch } from './entities/champions-match.entity';
import {
  TournamentEntryTypeEnum,
  TournamentParticipantStatusEnum,
  TournamentStatusEnum,
} from './constants/tournament.enums';
import {
  TournamentMatchStageEnum,
  TournamentMatchStatusEnum,
} from './constants/tournament-match.enums';
import { ResolveTournamentMatchDto } from './dto/resolve-tournament-match.dto';

type PendingMatch = {
  userId: string;
  mode: BattleModeEnum;
  region: BattleRegionEnum;
  createdAt: number;
  timeoutSeconds: number;
  token: string;
};

@Injectable()
export class BattleService {
  private readonly pending = new Map<string, PendingMatch>();

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserCard)
    private readonly userCardRepo: Repository<UserCard>,
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
    @InjectRepository(Battle)
    private readonly battleRepo: Repository<Battle>,
    @InjectRepository(BattleRound)
    private readonly roundRepo: Repository<BattleRound>,
    @InjectRepository(RankedSeason)
    private readonly rankedSeasonRepo: Repository<RankedSeason>,
    @InjectRepository(RankedSeasonSnapshot)
    private readonly rankedSnapshotRepo: Repository<RankedSeasonSnapshot>,
    @InjectRepository(ChampionsTournament)
    private readonly tournamentRepo: Repository<ChampionsTournament>,
    @InjectRepository(ChampionsParticipant)
    private readonly tournamentParticipantRepo: Repository<ChampionsParticipant>,
    @InjectRepository(ChampionsMatch)
    private readonly tournamentMatchRepo: Repository<ChampionsMatch>,
    @InjectRepository(UserChestInventory)
    private readonly chestInventoryRepo: Repository<UserChestInventory>,
    private readonly dataSource: DataSource,
    private readonly progressionService: ProgressionService,
  ) {}

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async resetRankedSeasonMonthly() {
    const season = await this.getOrCreateActiveSeason();
    if (!season) return { reset: false };

    const users = await this.userRepo.find();
    for (const user of users) {
      const before = Number(user.rankPoints || 0);
      const after = Math.floor(before * RANKED_SOFT_RESET_KEEP_RATIO);
      const tier = this.resolveTier(before);
      await this.rankedSnapshotRepo.save(
        this.rankedSnapshotRepo.create({
          season,
          user,
          rankPointsBeforeReset: before,
          rankPointsAfterReset: after,
          tierKey: tier.key,
          rewardSnapshot: tier.rewards,
          rewardClaimedAt: null,
        }),
      );
      user.rankPoints = after;
      await this.userRepo.save(user);
    }

    season.isActive = false;
    season.rewardsDistributedAt = new Date();
    await this.rankedSeasonRepo.save(season);
    await this.getOrCreateActiveSeason();
    return { reset: true };
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async tournamentLifecycleCron() {
    const now = new Date();
    const tournament = await this.getOrCreateCurrentTournament();

    if (
      tournament.status === TournamentStatusEnum.REGISTRATION &&
      tournament.registrationEndsAt.getTime() <= now.getTime()
    ) {
      tournament.status = TournamentStatusEnum.IN_PROGRESS;
      tournament.phase = 'group';
      await this.tournamentRepo.save(tournament);
      await this.ensureGroupFixtures(tournament.id);
    }

    if (
      tournament.status === TournamentStatusEnum.IN_PROGRESS &&
      tournament.endsAt.getTime() <= now.getTime()
    ) {
      await this.tournamentSettleDemo(tournament.seasonKey);
      const closed = await this.tournamentRepo.findOne({
        where: { id: tournament.id },
      });
      if (closed) {
        closed.status = TournamentStatusEnum.FINISHED;
        closed.phase = 'final';
        await this.tournamentRepo.save(closed);
      }
      await this.getOrCreateCurrentTournament();
    }
  }

  async distributeSeasonRewards(seasonKey?: string) {
    const season = seasonKey
      ? await this.rankedSeasonRepo.findOne({ where: { seasonKey } })
      : await this.rankedSeasonRepo.findOne({
          where: { isActive: false },
          order: { endsAt: 'DESC' },
        });
    if (!season) throw new NotFoundException('Closed ranked season not found.');
    if (season.isActive) {
      throw new BadRequestException(
        'Cannot distribute rewards for active season.',
      );
    }
    if (season.rewardsDistributedAt) {
      return {
        seasonKey: season.seasonKey,
        distributed: false,
        reason: 'already_distributed',
      };
    }
    season.rewardsDistributedAt = new Date();
    await this.rankedSeasonRepo.save(season);
    const eligible = await this.rankedSnapshotRepo.count({
      where: { season: { id: season.id } },
    });
    return {
      seasonKey: season.seasonKey,
      distributed: true,
      eligibleSnapshots: eligible,
    };
  }

  async claimSeasonReward(userId: string, seasonKey?: string) {
    const me = await this.getUserByIdOrFail(userId);
    const season = seasonKey
      ? await this.rankedSeasonRepo.findOne({ where: { seasonKey } })
      : await this.rankedSeasonRepo.findOne({
          where: { isActive: false },
          order: { endsAt: 'DESC' },
        });
    if (!season) throw new NotFoundException('Closed ranked season not found.');
    if (season.isActive)
      throw new BadRequestException('Season is still active.');
    if (!season.rewardsDistributedAt) {
      throw new BadRequestException('Season rewards are not distributed yet.');
    }

    const snapshot = await this.rankedSnapshotRepo.findOne({
      where: { season: { id: season.id }, user: { id: me.id } },
    });
    if (!snapshot)
      throw new NotFoundException('No season reward snapshot found for user.');
    if (snapshot.rewardClaimedAt) {
      throw new BadRequestException('Season reward already claimed.');
    }

    const reward = (snapshot.rewardSnapshot || {}) as Record<string, unknown>;
    const fgc = Number(reward.fgc || 0);
    const gems = Number(reward.gems || 0);
    const chest = (reward.chest as string | undefined) || null;

    me.fgc = Number(me.fgc || 0) + Math.max(0, Math.floor(fgc));
    me.gems = Number(me.gems || 0) + Math.max(0, Math.floor(gems));
    await this.userRepo.save(me);

    snapshot.rewardClaimedAt = new Date();
    await this.rankedSnapshotRepo.save(snapshot);

    return {
      seasonKey: season.seasonKey,
      claimed: true,
      reward: { fgc, gems, chest },
      balances: { fgc: me.fgc, gems: me.gems },
      note: chest
        ? 'Chest reward is pending chest-inventory integration.'
        : null,
    };
  }

  async findMatch(userId: string, dto: FindMatchDto) {
    await this.getUserByIdOrFail(userId);
    const mode = dto.mode ?? BattleModeEnum.CLASSIC;
    const region = dto.region ?? BattleRegionEnum.GLOBAL;
    const timeoutSeconds = Math.min(60, Math.max(5, dto.timeoutSeconds ?? 30));
    const now = Date.now();

    this.cleanupPending(now);

    const other = [...this.pending.values()]
      .filter(
        (x) =>
          x.userId !== userId &&
          x.mode === mode &&
          x.region === region &&
          now - x.createdAt < x.timeoutSeconds * 1000,
      )
      .sort((a, b) => a.createdAt - b.createdAt)[0];

    if (other) {
      this.pending.delete(other.userId);
      this.pending.delete(userId);
      return {
        status: 'MATCHED',
        mode,
        region,
        opponentType: BattleOpponentTypeEnum.PVP,
        opponentUserId: other.userId,
        matchToken: `${other.token}:${this.makeToken()}`,
      };
    }

    const mine = this.pending.get(userId);
    if (mine) {
      const elapsed = now - mine.createdAt;
      if (elapsed >= mine.timeoutSeconds * 1000) {
        this.pending.delete(userId);
        return {
          status: 'BOT_READY',
          mode: mine.mode,
          region: mine.region,
          opponentType: BattleOpponentTypeEnum.BOT,
          matchToken: mine.token,
        };
      }
      return {
        status: 'SEARCHING',
        mode: mine.mode,
        region: mine.region,
        secondsLeft: Math.max(
          0,
          Math.ceil(mine.timeoutSeconds - elapsed / 1000),
        ),
      };
    }

    const created: PendingMatch = {
      userId,
      mode,
      region,
      createdAt: now,
      timeoutSeconds,
      token: this.makeToken(),
    };
    this.pending.set(userId, created);
    return {
      status: 'SEARCHING',
      mode,
      region,
      secondsLeft: timeoutSeconds,
    };
  }

  async start(userId: string, dto: StartBattleDto) {
    const player1 = await this.getUserByIdOrFail(userId);
    const mode = dto.mode ?? BattleModeEnum.CLASSIC;
    if (![BattleModeEnum.CLASSIC, BattleModeEnum.RANKED].includes(mode)) {
      throw new BadRequestException(
        'Only classic and ranked modes are enabled right now.',
      );
    }

    const opponentType = dto.opponentType ?? BattleOpponentTypeEnum.BOT;
    const region = dto.region ?? BattleRegionEnum.GLOBAL;
    const entryFee = mode === BattleModeEnum.RANKED ? 500 : 0;

    const player1Squad = await this.getValidatedSquad(userId, dto.userCardIds);
    if (mode === BattleModeEnum.RANKED) {
      this.validateRankedSquad(player1Squad);
      if (Number(player1.fgc || 0) < entryFee) {
        throw new BadRequestException('Not enough FGC for ranked entry fee.');
      }
      player1.fgc = Number(player1.fgc || 0) - entryFee;
      await this.userRepo.save(player1);
    }
    let player2: User | null = null;
    let player2Squad: Array<Record<string, unknown>>;

    if (opponentType === BattleOpponentTypeEnum.PVP) {
      if (!dto.opponentUserId) {
        throw new BadRequestException(
          'opponentUserId is required for pvp battle.',
        );
      }
      if (dto.opponentUserId === userId) {
        throw new BadRequestException('You cannot battle yourself.');
      }
      player2 = await this.getUserByIdOrFail(dto.opponentUserId);
      const p2Cards = await this.userCardRepo.find({
        where: { user: { id: player2.id }, isInDeck: true },
        relations: { card: true },
        order: { createdAt: 'ASC' },
      });
      if (p2Cards.length !== 5) {
        throw new BadRequestException('Opponent active squad is not ready.');
      }
      this.validateClassicPositions(p2Cards);
      player2Squad = p2Cards.map((x) => this.toSnapshot(x));
      if (mode === BattleModeEnum.RANKED) {
        this.validateRankedSquad(player2Squad);
        if (Number(player2.fgc || 0) < entryFee) {
          throw new BadRequestException(
            'Opponent has not enough FGC for ranked entry fee.',
          );
        }
        player2.fgc = Number(player2.fgc || 0) - entryFee;
        await this.userRepo.save(player2);
      }
    } else {
      player2Squad = await this.makeBotSquad(player1Squad);
    }

    const categories = this.shuffleCategories();
    const battle = await this.battleRepo.save(
      this.battleRepo.create({
        mode,
        status: BattleStatusEnum.IN_PROGRESS,
        opponentType,
        region,
        player1,
        player2,
        player1Squad,
        player2Squad,
        categories,
        currentRound: 0,
        player1RoundWins: 0,
        player2RoundWins: 0,
        entryFee,
        winner: null,
        rewards: null,
      }),
    );

    return {
      battleId: battle.id,
      status: battle.status,
      opponentType: battle.opponentType,
      mode: battle.mode,
      currentRound: 0,
      totalRounds: 5,
    };
  }

  async playRound(userId: string, battleId: string) {
    const battle = await this.battleRepo.findOne({
      where: { id: battleId },
      relations: { player1: true, player2: true },
    });
    if (!battle) throw new NotFoundException('Battle not found.');
    if (battle.player1.id !== userId) {
      throw new UnauthorizedException(
        'Only battle owner can play rounds in API mode.',
      );
    }
    if (battle.status !== BattleStatusEnum.IN_PROGRESS) {
      throw new BadRequestException('Battle is not in progress.');
    }
    if (battle.currentRound >= 5) {
      throw new BadRequestException('All rounds are already played.');
    }

    const roundNumber = battle.currentRound + 1;
    const category = battle.categories[roundNumber - 1];
    const player1Card = battle.player1Squad[roundNumber - 1];
    const player2Card = battle.player2Squad[roundNumber - 1];
    const player1Stat = Number(player1Card[category] || 0);
    const player2Stat = Number(player2Card[category] || 0);

    let winner = BattleWinnerEnum.DRAW;
    if (player1Stat > player2Stat) {
      winner = BattleWinnerEnum.PLAYER1;
      battle.player1RoundWins += 1;
    } else if (player2Stat > player1Stat) {
      winner = BattleWinnerEnum.PLAYER2;
      battle.player2RoundWins += 1;
    }

    battle.currentRound = roundNumber;
    await this.battleRepo.save(battle);
    await this.roundRepo.save(
      this.roundRepo.create({
        battle,
        roundNumber,
        category,
        player1CardIndex: roundNumber - 1,
        player2CardIndex: roundNumber - 1,
        player1Stat,
        player2Stat,
        winner,
      }),
    );

    return {
      battleId: battle.id,
      roundNumber,
      category,
      player1Stat,
      player2Stat,
      roundWinner: winner,
      scoreboard: {
        player1RoundWins: battle.player1RoundWins,
        player2RoundWins: battle.player2RoundWins,
      },
      canEnd: battle.currentRound === 5,
    };
  }

  async end(userId: string, battleId: string) {
    const battle = await this.battleRepo.findOne({
      where: { id: battleId },
      relations: {
        player1: true,
        player2: true,
        tournamentMatch: {
          participantA: { user: true },
          participantB: { user: true },
        },
      },
    });
    if (!battle) throw new NotFoundException('Battle not found.');
    if (battle.player1.id !== userId) {
      throw new UnauthorizedException('Only battle owner can end this battle.');
    }
    if (battle.status !== BattleStatusEnum.IN_PROGRESS) {
      throw new BadRequestException('Battle is already settled.');
    }
    if (battle.currentRound < 5) {
      throw new BadRequestException('Battle is not finished yet.');
    }

    let winner = this.resolveWinner(battle);
    battle.winner = winner;
    battle.status = BattleStatusEnum.COMPLETED;

    const p1Reward = this.rewardByMode(
      this.resolveResult(winner, BattleWinnerEnum.PLAYER1),
      battle.mode,
    );
    const p2Reward = this.rewardByMode(
      this.resolveResult(winner, BattleWinnerEnum.PLAYER2),
      battle.mode,
    );

    const p1 = await this.getUserByIdOrFail(battle.player1.id);
    p1.fgc = Number(p1.fgc || 0) + p1Reward.fgc;
    await this.userRepo.save(p1);
    await this.progressionService.addExp(p1.id, p1Reward.exp);
    await this.progressionService.addTrophies(p1.id, p1Reward.trophies);

    if (
      battle.opponentType === BattleOpponentTypeEnum.PVP &&
      battle.player2?.id
    ) {
      const p2 = await this.getUserByIdOrFail(battle.player2.id);
      p2.fgc = Number(p2.fgc || 0) + p2Reward.fgc;
      await this.userRepo.save(p2);
      await this.progressionService.addExp(p2.id, p2Reward.exp);
      await this.progressionService.addTrophies(p2.id, p2Reward.trophies);
    }

    battle.rewards = {
      player1: p1Reward,
      player2:
        battle.opponentType === BattleOpponentTypeEnum.PVP && battle.player2?.id
          ? p2Reward
          : null,
    };
    await this.battleRepo.save(battle);

    if (
      battle.tournamentMatch &&
      battle.opponentType === BattleOpponentTypeEnum.PVP &&
      battle.player2?.id
    ) {
      const winnerParticipantId =
        battle.winner === BattleWinnerEnum.PLAYER1
          ? battle.tournamentMatch.participantA.user.id === battle.player1.id
            ? battle.tournamentMatch.participantA.id
            : battle.tournamentMatch.participantB.id
          : battle.winner === BattleWinnerEnum.PLAYER2
            ? battle.tournamentMatch.participantA.user.id === battle.player2.id
              ? battle.tournamentMatch.participantA.id
              : battle.tournamentMatch.participantB.id
            : null;
      if (winnerParticipantId) {
        await this.resolveTournamentMatchInternal(battle.tournamentMatch.id, {
          winnerParticipantId,
          scoreA: battle.player1RoundWins,
          scoreB: battle.player2RoundWins,
        });
      }
    }

    return {
      battleId: battle.id,
      winner: battle.winner,
      rounds: {
        player1RoundWins: battle.player1RoundWins,
        player2RoundWins: battle.player2RoundWins,
      },
      rewards: battle.rewards,
      ranked:
        battle.mode === BattleModeEnum.RANKED
          ? {
              player1RankPoints: (
                await this.getUserByIdOrFail(battle.player1.id)
              ).rankPoints,
              player1Tier: this.resolveTier(
                (await this.getUserByIdOrFail(battle.player1.id)).rankPoints ||
                  0,
              ),
            }
          : null,
    };
  }

  async rankedSeasonMeta(userId: string) {
    const me = await this.getUserByIdOrFail(userId);
    const season = await this.getOrCreateActiveSeason();
    const tier = this.resolveTier(Number(me.rankPoints || 0));
    return {
      season: {
        key: season.seasonKey,
        startedAt: season.startedAt,
        endsAt: season.endsAt,
        isActive: season.isActive,
        rewardsDistributedAt: season.rewardsDistributedAt,
      },
      rankPoints: Number(me.rankPoints || 0),
      softResetKeepRatio: RANKED_SOFT_RESET_KEEP_RATIO,
      tier,
      tiers: RANKED_TIERS,
    };
  }

  async tournamentCurrent(userId: string) {
    await this.getUserByIdOrFail(userId);
    return this.getOrCreateCurrentTournament();
  }

  async tournamentJoin(userId: string, entryType: TournamentEntryTypeEnum) {
    const user = await this.getUserByIdOrFail(userId);
    const tournament = await this.getOrCreateCurrentTournament();
    if (tournament.status !== TournamentStatusEnum.REGISTRATION) {
      throw new BadRequestException('Tournament registration is closed.');
    }
    const already = await this.tournamentParticipantRepo.findOne({
      where: { tournament: { id: tournament.id }, user: { id: user.id } },
    });
    if (already)
      throw new BadRequestException('Already joined current tournament.');

    const count = await this.tournamentParticipantRepo.count({
      where: { tournament: { id: tournament.id } },
    });
    if (count >= tournament.maxParticipants) {
      throw new BadRequestException('Tournament is full.');
    }

    const squad = await this.getValidatedSquad(user.id);
    this.validateTournamentSquad(squad);

    const seasonEntriesByType = await this.tournamentParticipantRepo.count({
      where: {
        tournament: { seasonKey: tournament.seasonKey },
        user: { id: user.id },
        entryType,
      },
    });
    if (
      entryType === TournamentEntryTypeEnum.FREE &&
      seasonEntriesByType >= 1
    ) {
      throw new BadRequestException('Free entry already used this season.');
    }
    if (entryType === TournamentEntryTypeEnum.FGC && seasonEntriesByType >= 3) {
      throw new BadRequestException('FGC entry limit reached for this season.');
    }

    if (entryType === TournamentEntryTypeEnum.PREMIUM) {
      if (Number(user.gems || 0) < 150) {
        throw new BadRequestException('Not enough gems.');
      }
      user.gems -= 150;
      await this.userRepo.save(user);
    } else if (entryType === TournamentEntryTypeEnum.FGC) {
      if (Number(user.fgc || 0) < 2000) {
        throw new BadRequestException('Not enough FGC.');
      }
      user.fgc -= 2000;
      await this.userRepo.save(user);
    }

    const participant = await this.tournamentParticipantRepo.save(
      this.tournamentParticipantRepo.create({
        tournament,
        user,
        entryType,
        status: TournamentParticipantStatusEnum.REGISTERED,
        groupPoints: 0,
      }),
    );
    return {
      joined: true,
      tournamentId: tournament.id,
      seasonKey: tournament.seasonKey,
      participantId: participant.id,
      entryType,
      balances: { fgc: user.fgc, gems: user.gems },
    };
  }

  async tournamentMyStatus(userId: string) {
    const user = await this.getUserByIdOrFail(userId);
    const tournament = await this.getOrCreateCurrentTournament();
    const participant = await this.tournamentParticipantRepo.findOne({
      where: { tournament: { id: tournament.id }, user: { id: user.id } },
    });
    return {
      tournamentId: tournament.id,
      seasonKey: tournament.seasonKey,
      tournamentStatus: tournament.status,
      phase: tournament.phase,
      participant: participant || null,
    };
  }

  async tournamentMyNextMatch(userId: string) {
    const user = await this.getUserByIdOrFail(userId);
    const tournament = await this.getOrCreateCurrentTournament();
    if (tournament.status !== TournamentStatusEnum.IN_PROGRESS) {
      return { tournamentStatus: tournament.status, match: null };
    }
    const participant = await this.tournamentParticipantRepo.findOne({
      where: { tournament: { id: tournament.id }, user: { id: user.id } },
    });
    if (!participant) {
      return { tournamentStatus: tournament.status, match: null };
    }
    const match = await this.tournamentMatchRepo.findOne({
      where: [
        { tournament: { id: tournament.id }, status: TournamentMatchStatusEnum.PENDING, participantA: { id: participant.id } },
        { tournament: { id: tournament.id }, status: TournamentMatchStatusEnum.PENDING, participantB: { id: participant.id } },
      ],
      relations: { participantA: { user: true }, participantB: { user: true } },
      order: { createdAt: 'ASC' },
    });
    return { tournamentStatus: tournament.status, match: match || null };
  }

  async tournamentFixtures(userId: string) {
    await this.getUserByIdOrFail(userId);
    const tournament = await this.getOrCreateCurrentTournament();
    const matches = await this.tournamentMatchRepo.find({
      where: { tournament: { id: tournament.id } },
      relations: {
        participantA: { user: true },
        participantB: { user: true },
        winner: { user: true },
      },
      order: { createdAt: 'ASC' },
    });
    return {
      tournamentId: tournament.id,
      seasonKey: tournament.seasonKey,
      phase: tournament.phase,
      status: tournament.status,
      fixtures: matches,
    };
  }

  async tournamentStandings(userId: string) {
    await this.getUserByIdOrFail(userId);
    const tournament = await this.getOrCreateCurrentTournament();
    const participants = await this.tournamentParticipantRepo.find({
      where: { tournament: { id: tournament.id } },
      relations: { user: true },
      order: { groupPoints: 'DESC', createdAt: 'ASC' },
    });
    return {
      tournamentId: tournament.id,
      seasonKey: tournament.seasonKey,
      standings: participants.map((p, idx) => ({
        rank: idx + 1,
        participantId: p.id,
        userId: p.user.id,
        username: p.user.userName,
        groupPoints: p.groupPoints,
        status: p.status,
      })),
    };
  }

  async tournamentResolveMatch(
    userId: string,
    matchId: string,
    dto: ResolveTournamentMatchDto,
  ) {
    const me = await this.getUserByIdOrFail(userId);
    if (!matchId) throw new BadRequestException('matchId is required.');
    const match = await this.dataSource.transaction(async (manager) => {
      const locked = await manager
        .getRepository(ChampionsMatch)
        .createQueryBuilder('m')
        .leftJoinAndSelect('m.tournament', 't')
        .leftJoinAndSelect('m.participantA', 'a')
        .leftJoinAndSelect('m.participantB', 'b')
        .leftJoinAndSelect('a.user', 'au')
        .leftJoinAndSelect('b.user', 'bu')
        .where('m.id = :id', { id: matchId })
        .setLock('pessimistic_write')
        .getOne();
      if (!locked) throw new NotFoundException('Tournament match not found.');
      if (locked.status !== TournamentMatchStatusEnum.PENDING) {
        throw new BadRequestException('Match already resolved.');
      }
      const isParticipant =
        locked.participantA.user.id === me.id || locked.participantB.user.id === me.id;
      if (!isParticipant) {
        throw new UnauthorizedException('Only this match participants can resolve it.');
      }

      const scoreA = dto.scoreA ?? 1;
      const scoreB = dto.scoreB ?? 0;
      let winner = null as ChampionsParticipant | null;
      if (dto.winnerParticipantId) {
        if (dto.winnerParticipantId === locked.participantA.id) winner = locked.participantA;
        if (dto.winnerParticipantId === locked.participantB.id) winner = locked.participantB;
        if (!winner) throw new BadRequestException('winnerParticipantId is not in this match.');
      } else if (scoreA !== scoreB) {
        winner = scoreA > scoreB ? locked.participantA : locked.participantB;
      } else {
        winner = Math.random() > 0.5 ? locked.participantA : locked.participantB;
      }

      locked.scoreA = scoreA;
      locked.scoreB = scoreB;
      locked.winner = winner;
      locked.status = TournamentMatchStatusEnum.COMPLETED;
      await manager.getRepository(ChampionsMatch).save(locked);
      return locked;
    });

    if (match.stage === TournamentMatchStageEnum.GROUP) {
      await this.applyGroupPoints(match);
      await this.tryPromoteToKnockout(match.tournament.id);
    } else {
      await this.tryAdvanceKnockout(match.tournament.id, match.stage);
    }

    return { resolved: true, matchId: match.id, winnerParticipantId: match.winner?.id };
  }

  async tournamentStartMatch(userId: string, matchId: string) {
    const me = await this.getUserByIdOrFail(userId);
    if (!matchId) throw new BadRequestException('matchId is required.');
    const fixture = await this.tournamentMatchRepo.findOne({
      where: { id: matchId },
      relations: {
        tournament: true,
        participantA: { user: true },
        participantB: { user: true },
      },
    });
    if (!fixture) throw new NotFoundException('Tournament match not found.');
    if (fixture.status !== TournamentMatchStatusEnum.PENDING) {
      throw new BadRequestException('Tournament match already resolved.');
    }
    const aUserId = fixture.participantA.user.id;
    const bUserId = fixture.participantB.user.id;
    if (me.id !== aUserId && me.id !== bUserId) {
      throw new UnauthorizedException(
        'Only tournament match participants can start this battle.',
      );
    }

    const active = await this.battleRepo.findOne({
      where: {
        tournamentMatch: { id: fixture.id },
        status: BattleStatusEnum.IN_PROGRESS,
      },
    });
    if (active) {
      return {
        started: false,
        reason: 'already_started',
        battleId: active.id,
      };
    }

    const starterIsA = me.id === aUserId;
    const player1 = await this.getUserByIdOrFail(starterIsA ? aUserId : bUserId);
    const player2 = await this.getUserByIdOrFail(starterIsA ? bUserId : aUserId);
    const p1Cards = await this.userCardRepo.find({
      where: { user: { id: player1.id }, isInDeck: true },
      relations: { card: true },
      order: { createdAt: 'ASC' },
    });
    const p2Cards = await this.userCardRepo.find({
      where: { user: { id: player2.id }, isInDeck: true },
      relations: { card: true },
      order: { createdAt: 'ASC' },
    });
    if (p1Cards.length !== 5 || p2Cards.length !== 5) {
      throw new BadRequestException('Both participants must have active 5-card squads.');
    }
    this.validateClassicPositions(p1Cards);
    this.validateClassicPositions(p2Cards);

    const battle = await this.battleRepo.save(
      this.battleRepo.create({
        mode: BattleModeEnum.CLASSIC,
        status: BattleStatusEnum.IN_PROGRESS,
        opponentType: BattleOpponentTypeEnum.PVP,
        region: BattleRegionEnum.GLOBAL,
        player1,
        player2,
        tournamentMatch: fixture,
        player1Squad: p1Cards.map((x) => this.toSnapshot(x)),
        player2Squad: p2Cards.map((x) => this.toSnapshot(x)),
        categories: this.shuffleCategories(),
        currentRound: 0,
        player1RoundWins: 0,
        player2RoundWins: 0,
        entryFee: 0,
        winner: null,
        rewards: null,
      }),
    );

    return {
      started: true,
      battleId: battle.id,
      tournamentMatchId: fixture.id,
      player1Id: player1.id,
      player2Id: player2.id,
    };
  }

  async tournamentSettleDemo(seasonKey?: string) {
    const tournament = seasonKey
      ? await this.tournamentRepo.findOne({ where: { seasonKey } })
      : await this.tournamentRepo.findOne({ order: { createdAt: 'DESC' } });
    if (!tournament) throw new NotFoundException('Tournament not found.');
    if (tournament.settledAt) {
      return {
        settled: false,
        reason: 'already_settled',
        tournamentId: tournament.id,
      };
    }

    const participants = await this.tournamentParticipantRepo.find({
      where: { tournament: { id: tournament.id } },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });
    if (!participants.length) throw new BadRequestException('No participants.');

    const ranked = participants
      .map((p) => ({
        p,
        score:
          p.groupPoints + Number(p.user.rankPoints || 0) + Math.random() * 1000,
      }))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.p);

    for (let i = 0; i < ranked.length; i += 1) {
      const row = ranked[i];
      const place = i + 1;
      let rewardFgc = 0;
      let rewardGems = 0;
      let rewardChest: ChestTypeEnum | null = null;
      let rewardChestQty = 0;

      if (place === 1) {
        row.status = TournamentParticipantStatusEnum.CHAMPION;
        rewardFgc = 50000;
        rewardGems = 500;
        rewardChest = ChestTypeEnum.MYTHIC_CHEST;
        rewardChestQty = 3;
      } else if (place === 2) {
        row.status = TournamentParticipantStatusEnum.RUNNER_UP;
        rewardFgc = 25000;
        rewardGems = 250;
        rewardChest = ChestTypeEnum.LEGENDARY_CHEST;
        rewardChestQty = 2;
      } else if (place <= 4) {
        row.status = TournamentParticipantStatusEnum.TOP4;
        rewardFgc = 10000;
        rewardGems = 100;
        rewardChest = ChestTypeEnum.EPIC_CHEST;
        rewardChestQty = 2;
      } else if (place <= 8) {
        row.status = TournamentParticipantStatusEnum.TOP8;
        rewardFgc = 3000;
        rewardGems = 30;
        rewardChest = ChestTypeEnum.RARE_CHEST;
        rewardChestQty = 2;
      } else {
        row.status = TournamentParticipantStatusEnum.ELIMINATED;
      }

      row.user.fgc = Number(row.user.fgc || 0) + rewardFgc;
      row.user.gems = Number(row.user.gems || 0) + rewardGems;
      await this.userRepo.save(row.user);
      await this.tournamentParticipantRepo.save(row);

      if (rewardChest && rewardChestQty > 0) {
        await this.grantChest(row.user.id, rewardChest, rewardChestQty);
      }
    }

    tournament.status = TournamentStatusEnum.FINISHED;
    tournament.settledAt = new Date();
    await this.tournamentRepo.save(tournament);
    return {
      settled: true,
      tournamentId: tournament.id,
      participants: ranked.length,
    };
  }

  async history(userId: string, query: BattleHistoryQueryDto, url?: string) {
    await this.getUserByIdOrFail(userId);
    const qb = this.battleRepo
      .createQueryBuilder('battle')
      .leftJoinAndSelect('battle.player1', 'player1')
      .leftJoinAndSelect('battle.player2', 'player2')
      .where('player1.id = :userId OR player2.id = :userId', { userId })
      .orderBy('battle.createdAt', 'DESC');

    if (query.mode) {
      qb.andWhere('battle.mode = :mode', { mode: query.mode });
    }

    return paginate(qb, {
      page: query.page ?? 1,
      limit: Math.min(query.limit ?? 20, 100),
      route: url,
    });
  }

  private rewardByMode(result: 'win' | 'lose' | 'draw', mode: BattleModeEnum) {
    if (mode === BattleModeEnum.RANKED) {
      if (result === 'win') return { fgc: 200, exp: 70, trophies: 45 };
      if (result === 'lose') return { fgc: 40, exp: 25, trophies: -20 };
      return { fgc: 100, exp: 45, trophies: 8 };
    }
    if (result === 'win') return { fgc: 100, exp: 50, trophies: 30 };
    if (result === 'lose') return { fgc: 20, exp: 20, trophies: -15 };
    return { fgc: 50, exp: 30, trophies: 5 };
  }

  private resolveResult(
    winner: BattleWinnerEnum,
    forPlayer: BattleWinnerEnum.PLAYER1 | BattleWinnerEnum.PLAYER2,
  ): 'win' | 'lose' | 'draw' {
    if (winner === BattleWinnerEnum.DRAW) return 'draw';
    return winner === forPlayer ? 'win' : 'lose';
  }

  private resolveTier(points: number): RankedTierConfig {
    const found = RANKED_TIERS.find(
      (x) => points >= x.min && (x.max === null || points <= x.max),
    );
    return found || RANKED_TIERS[0];
  }

  private resolveWinner(battle: Battle) {
    if (battle.player1RoundWins > battle.player2RoundWins) {
      return BattleWinnerEnum.PLAYER1;
    }
    if (battle.player2RoundWins > battle.player1RoundWins) {
      return BattleWinnerEnum.PLAYER2;
    }
    const p1Sum = this.sumSquadStats(battle.player1Squad);
    const p2Sum = this.sumSquadStats(battle.player2Squad);
    if (p1Sum > p2Sum) return BattleWinnerEnum.PLAYER1;
    if (p2Sum > p1Sum) return BattleWinnerEnum.PLAYER2;
    return BattleWinnerEnum.DRAW;
  }

  private sumSquadStats(squad: Array<Record<string, unknown>>) {
    return squad.reduce(
      (acc, item) =>
        acc +
        Number(item.speed || 0) +
        Number(item.power || 0) +
        Number(item.skill || 0) +
        Number(item.attack || 0) +
        Number(item.defend || 0),
      0,
    );
  }

  private async getValidatedSquad(userId: string, userCardIds?: string[]) {
    let cards: UserCard[];
    if (userCardIds?.length) {
      cards = await this.userCardRepo.find({
        where: { id: In(userCardIds), user: { id: userId } },
        relations: { card: true },
      });
      if (cards.length !== userCardIds.length) {
        throw new BadRequestException('Some cards do not belong to user.');
      }
    } else {
      cards = await this.userCardRepo.find({
        where: { user: { id: userId }, isInDeck: true },
        relations: { card: true },
        order: { createdAt: 'ASC' },
      });
    }
    if (cards.length !== 5) {
      throw new BadRequestException('Classic battle requires exactly 5 cards.');
    }
    if (cards.some((x) => x.isListed)) {
      throw new BadRequestException('Listed cards cannot be used in battle.');
    }
    this.validateClassicPositions(cards);
    return cards.map((x) => this.toSnapshot(x));
  }

  private validateClassicPositions(cards: UserCard[]) {
    const counts = { GK: 0, DEF: 0, MID: 0, FW: 0 };
    for (const item of cards) {
      const pos = item.card.position;
      if (!counts[pos] && counts[pos] !== 0) {
        throw new BadRequestException('Invalid card position.');
      }
      counts[pos] += 1;
    }
    if (
      !(
        counts.GK === 1 &&
        counts.DEF === 1 &&
        counts.MID === 1 &&
        counts.FW === 2
      )
    ) {
      throw new BadRequestException(
        'Required positions: GK=1, DEF=1, MID=1, FW=2.',
      );
    }
  }

  private validateRankedSquad(squad: Array<Record<string, unknown>>) {
    const avg =
      squad.reduce((acc, item) => acc + Number(item.overallRating || 0), 0) /
      Math.max(1, squad.length);
    if (avg < 80) {
      throw new BadRequestException(
        'Ranked requires minimum squad average rating of 80.',
      );
    }
  }

  private validateTournamentSquad(squad: Array<Record<string, unknown>>) {
    const avg =
      squad.reduce((acc, item) => acc + Number(item.overallRating || 0), 0) /
      Math.max(1, squad.length);
    if (avg < 85) {
      throw new BadRequestException(
        'Tournament requires minimum squad average rating of 85.',
      );
    }
    const hasLegendaryPlus = squad.some((x) => {
      const overall = Number(x.overallRating || 0);
      return overall >= 94;
    });
    if (!hasLegendaryPlus) {
      throw new BadRequestException(
        'Tournament requires at least one Legendary or higher card.',
      );
    }
  }

  private toSnapshot(userCard: UserCard) {
    const card = userCard.card;
    return {
      userCardId: userCard.id,
      cardId: card.id,
      playerName: card.playerName,
      position: card.position,
      level: userCard.level,
      overallRating: card.overallRating,
      speed: card.speed,
      power: card.power,
      skill: card.skill,
      attack: card.attack,
      defend: card.defend,
    };
  }

  private async makeBotSquad(playerSquad: Array<Record<string, unknown>>) {
    const avg = Math.floor(
      playerSquad.reduce((a, x) => a + Number(x.overallRating || 0), 0) /
        playerSquad.length,
    );

    const picks = await Promise.all([
      this.pickBotCard('GK', avg),
      this.pickBotCard('DEF', avg),
      this.pickBotCard('MID', avg),
      this.pickBotCard('FW', avg),
      this.pickBotCard('FW', avg),
    ]);
    return picks.map((card, idx) => ({
      userCardId: null,
      cardId: card.id,
      playerName: card.playerName,
      position: card.position,
      level: 1,
      overallRating: card.overallRating,
      speed: card.speed,
      power: card.power,
      skill: card.skill,
      attack: card.attack,
      defend: card.defend,
      botSlot: idx + 1,
    }));
  }

  private async pickBotCard(
    position: 'GK' | 'DEF' | 'MID' | 'FW',
    avg: number,
  ) {
    const cards = await this.cardRepo
      .createQueryBuilder('card')
      .where('card.position = :position', { position })
      .andWhere('card.overallRating BETWEEN :min AND :max', {
        min: Math.max(1, avg - 8),
        max: Math.min(99, avg + 8),
      })
      .orderBy('RANDOM()')
      .take(20)
      .getMany();
    if (cards.length) return cards[0];
    const fallback = await this.cardRepo
      .createQueryBuilder('card')
      .where('card.position = :position', { position })
      .orderBy('card.overallRating', 'DESC')
      .take(1)
      .getOne();
    if (!fallback) {
      throw new NotFoundException(`No card found for bot position ${position}`);
    }
    return fallback;
  }

  private shuffleCategories(): BattleStatCategoryEnum[] {
    const arr = [
      BattleStatCategoryEnum.SPEED,
      BattleStatCategoryEnum.POWER,
      BattleStatCategoryEnum.SKILL,
      BattleStatCategoryEnum.ATTACK,
      BattleStatCategoryEnum.DEFEND,
    ];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  private cleanupPending(now: number) {
    for (const [k, v] of this.pending.entries()) {
      if (now - v.createdAt > Math.max(v.timeoutSeconds, 60) * 1000) {
        this.pending.delete(k);
      }
    }
  }

  private makeToken() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private async getOrCreateActiveSeason() {
    const active = await this.rankedSeasonRepo.findOne({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
    if (active) return active;

    const now = new Date();
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0),
    );
    const end = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0),
    );
    const seasonKey = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`;

    const existing = await this.rankedSeasonRepo.findOne({
      where: { seasonKey },
    });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        await this.rankedSeasonRepo.save(existing);
      }
      return existing;
    }

    return this.rankedSeasonRepo.save(
      this.rankedSeasonRepo.create({
        seasonKey,
        startedAt: start,
        endsAt: end,
        isActive: true,
        rewardsDistributedAt: null,
      }),
    );
  }

  private async getOrCreateCurrentTournament() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const yearStart = Date.UTC(year, 0, 1, 0, 0, 0, 0);
    const daysSinceYearStart = Math.floor(
      (now.getTime() - yearStart) / (24 * 60 * 60 * 1000),
    );
    const cycle = Math.floor(daysSinceYearStart / 14) + 1;
    const seasonKey = `${year}-C${String(cycle).padStart(2, '0')}`;
    const existing = await this.tournamentRepo.findOne({
      where: { seasonKey },
    });
    if (existing) return existing;

    const cycleStartDays = (cycle - 1) * 14;
    const startsAt = new Date(yearStart + cycleStartDays * 24 * 60 * 60 * 1000);
    const registrationEndsAt = new Date(
      startsAt.getTime() + 2 * 24 * 60 * 60 * 1000,
    );
    const endsAt = new Date(startsAt.getTime() + 14 * 24 * 60 * 60 * 1000);
    const status =
      now.getTime() < registrationEndsAt.getTime()
        ? TournamentStatusEnum.REGISTRATION
        : TournamentStatusEnum.IN_PROGRESS;
    return this.tournamentRepo.save(
      this.tournamentRepo.create({
        seasonKey,
        status,
        phase:
          status === TournamentStatusEnum.REGISTRATION ? 'group' : 'knockout',
        startsAt,
        registrationEndsAt,
        endsAt,
        maxParticipants: 128,
        settledAt: null,
      }),
    );
  }

  private async resolveTournamentMatchInternal(
    matchId: string,
    dto: ResolveTournamentMatchDto,
  ) {
    const match = await this.dataSource.transaction(async (manager) => {
      const locked = await manager
        .getRepository(ChampionsMatch)
        .createQueryBuilder('m')
        .leftJoinAndSelect('m.tournament', 't')
        .leftJoinAndSelect('m.participantA', 'a')
        .leftJoinAndSelect('m.participantB', 'b')
        .where('m.id = :id', { id: matchId })
        .setLock('pessimistic_write')
        .getOne();
      if (!locked) throw new NotFoundException('Tournament match not found.');
      if (locked.status !== TournamentMatchStatusEnum.PENDING) return locked;

      const scoreA = dto.scoreA ?? 1;
      const scoreB = dto.scoreB ?? 0;
      let winner = null as ChampionsParticipant | null;
      if (dto.winnerParticipantId) {
        if (dto.winnerParticipantId === locked.participantA.id)
          winner = locked.participantA;
        if (dto.winnerParticipantId === locked.participantB.id)
          winner = locked.participantB;
        if (!winner)
          throw new BadRequestException(
            'winnerParticipantId is not in this match.',
          );
      } else if (scoreA !== scoreB) {
        winner = scoreA > scoreB ? locked.participantA : locked.participantB;
      } else {
        winner = Math.random() > 0.5 ? locked.participantA : locked.participantB;
      }

      locked.scoreA = scoreA;
      locked.scoreB = scoreB;
      locked.winner = winner;
      locked.status = TournamentMatchStatusEnum.COMPLETED;
      await manager.getRepository(ChampionsMatch).save(locked);
      return locked;
    });

    if (match.status !== TournamentMatchStatusEnum.COMPLETED || !match.winner) {
      return match;
    }
    if (match.stage === TournamentMatchStageEnum.GROUP) {
      await this.applyGroupPoints(match);
      await this.tryPromoteToKnockout(match.tournament.id);
    } else {
      await this.tryAdvanceKnockout(match.tournament.id, match.stage);
    }
    return match;
  }

  private async ensureGroupFixtures(tournamentId: string) {
    const existing = await this.tournamentMatchRepo.count({
      where: { tournament: { id: tournamentId } },
    });
    if (existing > 0) return;
    const participants = await this.tournamentParticipantRepo.find({
      where: { tournament: { id: tournamentId } },
      relations: { user: true, tournament: true },
      order: { createdAt: 'ASC' },
    });
    if (participants.length < 8) return;
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const groups: ChampionsParticipant[][] = [];
    for (let i = 0; i < shuffled.length; i += 8) {
      groups.push(shuffled.slice(i, i + 8));
    }
    const rows: ChampionsMatch[] = [];
    groups.forEach((group, idx) => {
      if (group.length < 2) return;
      const rounds = [
        [[0, 1], [2, 3], [4, 5], [6, 7]],
        [[0, 2], [1, 3], [4, 6], [5, 7]],
        [[0, 3], [1, 2], [4, 7], [5, 6]],
      ];
      rounds.forEach((pairs, ridx) => {
        pairs.forEach(([a, b]) => {
          if (!group[a] || !group[b]) return;
          rows.push(
            this.tournamentMatchRepo.create({
              tournament: group[a].tournament,
              participantA: group[a],
              participantB: group[b],
              winner: null,
              stage: TournamentMatchStageEnum.GROUP,
              status: TournamentMatchStatusEnum.PENDING,
              roundNo: ridx + 1,
              groupNo: idx + 1,
              scoreA: 0,
              scoreB: 0,
            }),
          );
        });
      });
    });
    if (rows.length) await this.tournamentMatchRepo.save(rows);
  }

  private async applyGroupPoints(match: ChampionsMatch) {
    const pA = await this.tournamentParticipantRepo.findOne({
      where: { id: match.participantA.id },
    });
    const pB = await this.tournamentParticipantRepo.findOne({
      where: { id: match.participantB.id },
    });
    if (!pA || !pB) return;
    if (match.winner?.id === pA.id) {
      pA.groupPoints += 3;
    } else if (match.winner?.id === pB.id) {
      pB.groupPoints += 3;
    } else {
      pA.groupPoints += 1;
      pB.groupPoints += 1;
    }
    await this.tournamentParticipantRepo.save([pA, pB]);
  }

  private async tryPromoteToKnockout(tournamentId: string) {
    const pendingGroup = await this.tournamentMatchRepo.count({
      where: {
        tournament: { id: tournamentId },
        stage: TournamentMatchStageEnum.GROUP,
        status: TournamentMatchStatusEnum.PENDING,
      },
    });
    if (pendingGroup > 0) return;

    const already = await this.tournamentMatchRepo.count({
      where: {
        tournament: { id: tournamentId },
        stage: TournamentMatchStageEnum.QUARTER_FINAL,
      },
    });
    if (already > 0) return;

    const participants = await this.tournamentParticipantRepo.find({
      where: { tournament: { id: tournamentId } },
      relations: { tournament: true, user: true },
    });
    const top8 = participants
      .sort((a, b) => b.groupPoints - a.groupPoints || Number(b.user.rankPoints || 0) - Number(a.user.rankPoints || 0))
      .slice(0, 8);
    if (top8.length < 8) return;
    const pairs = [
      [0, 7],
      [1, 6],
      [2, 5],
      [3, 4],
    ];
    const rows = pairs.map(([a, b]) =>
      this.tournamentMatchRepo.create({
        tournament: top8[a].tournament,
        participantA: top8[a],
        participantB: top8[b],
        winner: null,
        stage: TournamentMatchStageEnum.QUARTER_FINAL,
        status: TournamentMatchStatusEnum.PENDING,
        roundNo: 1,
        groupNo: null,
        scoreA: 0,
        scoreB: 0,
      }),
    );
    await this.tournamentMatchRepo.save(rows);
    const t = await this.tournamentRepo.findOne({ where: { id: tournamentId } });
    if (t) {
      t.phase = 'quarter_final';
      await this.tournamentRepo.save(t);
    }
  }

  private async tryAdvanceKnockout(
    tournamentId: string,
    stage: TournamentMatchStageEnum,
  ) {
    const pendingCurrent = await this.tournamentMatchRepo.count({
      where: {
        tournament: { id: tournamentId },
        stage,
        status: TournamentMatchStatusEnum.PENDING,
      },
    });
    if (pendingCurrent > 0) return;

    const winners = await this.tournamentMatchRepo.find({
      where: {
        tournament: { id: tournamentId },
        stage,
        status: TournamentMatchStatusEnum.COMPLETED,
      },
      relations: { winner: { user: true }, tournament: true },
      order: { createdAt: 'ASC' },
    });
    const participants = winners.map((x) => x.winner).filter(Boolean) as ChampionsParticipant[];
    if (!participants.length) return;

    const nextStage =
      stage === TournamentMatchStageEnum.QUARTER_FINAL
        ? TournamentMatchStageEnum.SEMI_FINAL
        : stage === TournamentMatchStageEnum.SEMI_FINAL
          ? TournamentMatchStageEnum.FINAL
          : null;

    if (!nextStage) {
      const champion = participants[0];
      const tournament = await this.tournamentRepo.findOne({ where: { id: tournamentId } });
      if (tournament) {
        tournament.phase = 'final';
        tournament.status = TournamentStatusEnum.FINISHED;
        await this.tournamentRepo.save(tournament);
      }
      const allParticipants = await this.tournamentParticipantRepo.find({
        where: { tournament: { id: tournamentId } },
      });
      if (allParticipants.length) {
        for (const p of allParticipants) {
          p.status = TournamentParticipantStatusEnum.ELIMINATED;
        }
        await this.tournamentParticipantRepo.save(allParticipants);
      }
      champion.status = TournamentParticipantStatusEnum.CHAMPION;
      await this.tournamentParticipantRepo.save(champion);
      await this.tournamentSettleDemo(tournament?.seasonKey);
      return;
    }

    const exists = await this.tournamentMatchRepo.count({
      where: { tournament: { id: tournamentId }, stage: nextStage },
    });
    if (exists > 0) return;
    const rows: ChampionsMatch[] = [];
    for (let i = 0; i < participants.length; i += 2) {
      if (!participants[i + 1]) break;
      rows.push(
        this.tournamentMatchRepo.create({
          tournament: participants[i].tournament,
          participantA: participants[i],
          participantB: participants[i + 1],
          winner: null,
          stage: nextStage,
          status: TournamentMatchStatusEnum.PENDING,
          roundNo: 1,
          groupNo: null,
          scoreA: 0,
          scoreB: 0,
        }),
      );
    }
    if (rows.length) await this.tournamentMatchRepo.save(rows);
    const t = await this.tournamentRepo.findOne({ where: { id: tournamentId } });
    if (t) {
      t.phase = nextStage;
      await this.tournamentRepo.save(t);
    }
  }

  private async grantChest(
    userId: string,
    chestType: ChestTypeEnum,
    qty: number,
  ) {
    const existing = await this.chestInventoryRepo.findOne({
      where: { user: { id: userId }, chestType },
      relations: { user: true },
    });
    if (existing) {
      existing.quantity = Number(existing.quantity || 0) + qty;
      await this.chestInventoryRepo.save(existing);
      return;
    }
    await this.chestInventoryRepo.save(
      this.chestInventoryRepo.create({
        user: { id: userId } as User,
        chestType,
        quantity: qty,
      }),
    );
  }

  private async getUserByIdOrFail(userId?: string) {
    if (!userId) throw new UnauthorizedException('Authentication required.');
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found.');
    return user;
  }
}
