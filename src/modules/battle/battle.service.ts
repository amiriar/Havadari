import { User } from '@app/auth/entities/user.entity';
import { UserCard } from '@app/cards/entities/user-card.entity';
import { Card } from '@app/cards/entities/card.entity';
import { ProgressionService } from '@app/progression/progression.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import { In, Repository } from 'typeorm';
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
    private readonly progressionService: ProgressionService,
  ) {}

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
      throw new BadRequestException('Only classic and ranked modes are enabled right now.');
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
          throw new BadRequestException('Opponent has not enough FGC for ranked entry fee.');
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
      relations: { player1: true, player2: true },
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

    return {
      battleId: battle.id,
      winner: battle.winner,
      rounds: {
        player1RoundWins: battle.player1RoundWins,
        player2RoundWins: battle.player2RoundWins,
      },
      rewards: battle.rewards,
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
      throw new BadRequestException('Ranked requires minimum squad average rating of 80.');
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

  private async getUserByIdOrFail(userId?: string) {
    if (!userId) throw new UnauthorizedException('Authentication required.');
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found.');
    return user;
  }
}
