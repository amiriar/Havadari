import { User } from '@app/auth/entities/user.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { EndBattleDto, PlayRoundDto, StartBattleDto } from '../dto';
import { BattleRound } from '../entities/battle-round.entity';
import { Battle } from '../entities/battle.entity';
import { GameProfile } from '../entities/game-profile.entity';
import { UserCard } from '../entities/user-card.entity';
import { GameBootstrapService } from '../services/game-bootstrap.service';

@Injectable()
export class BattleService {
  constructor(
    @InjectRepository(Battle)
    private readonly battleRepo: Repository<Battle>,
    @InjectRepository(BattleRound)
    private readonly roundRepo: Repository<BattleRound>,
    @InjectRepository(UserCard)
    private readonly userCardRepo: Repository<UserCard>,
    @InjectRepository(GameProfile)
    private readonly profileRepo: Repository<GameProfile>,
    private readonly bootstrap: GameBootstrapService,
  ) {}

  async findMatch(user: User) {
    await this.bootstrap.ensureProfile(user);
    return {
      matchId: randomUUID(),
      mode: 'ELO-based',
      region: 'IR',
      status: 'found',
    };
  }

  async startBattle(user: User, dto: StartBattleDto) {
    await this.bootstrap.ensureProfile(user);
    const battle = this.battleRepo.create({
      type: dto.type || 'classic',
      player1: user,
      status: 'started',
      player2Id: null,
      winnerId: null,
    });
    await this.battleRepo.save(battle);
    return { battleId: battle.id, status: battle.status, type: battle.type };
  }

  async playRound(user: User, dto: PlayRoundDto) {
    const battle = await this.battleRepo.findOne({
      where: { id: dto.battleId, player1: { id: user.id } },
      relations: ['player1'],
    });
    if (!battle) throw new NotFoundException('battle not found');
    if (battle.status !== 'started')
      throw new BadRequestException('battle is not active');

    const ownership = await this.userCardRepo.findOne({
      where: { id: dto.player1CardOwnershipId, user: { id: user.id } },
      relations: ['card'],
    });
    if (!ownership) throw new NotFoundException('card ownership not found');

    const p1Stat = ownership.card[dto.category];
    const p2Stat = Math.max(1, p1Stat - Math.floor(Math.random() * 6));
    const winner =
      p1Stat > p2Stat ? 'player1' : p1Stat < p2Stat ? 'player2' : 'draw';

    const roundNumber =
      (await this.roundRepo.count({ where: { battle: { id: battle.id } } })) +
      1;

    const round = this.roundRepo.create({
      battle,
      roundNumber,
      category: dto.category,
      player1CardOwnershipId: ownership.id,
      player1Stat: p1Stat,
      player2Stat: p2Stat,
      winner,
    });
    await this.roundRepo.save(round);

    return {
      battleId: battle.id,
      roundNumber,
      category: dto.category,
      player1Stat: p1Stat,
      player2Stat: p2Stat,
      winner,
    };
  }

  async endBattle(user: User, dto: EndBattleDto) {
    const battle = await this.battleRepo.findOne({
      where: { id: dto.battleId, player1: { id: user.id } },
      relations: ['player1'],
    });
    if (!battle) throw new NotFoundException('battle not found');

    const rounds = await this.roundRepo.find({
      where: { battle: { id: battle.id } },
    });
    const playerWins = rounds.filter((r) => r.winner === 'player1').length;
    const opponentWins = rounds.filter((r) => r.winner === 'player2').length;
    const winnerId = playerWins >= opponentWins ? user.id : null;

    battle.winnerId = winnerId;
    battle.status = 'finished';
    await this.battleRepo.save(battle);

    const profile = await this.bootstrap.ensureProfile(user);
    if (winnerId === user.id) {
      profile.fgc += 100;
      profile.exp += 50;
      profile.trophies += 30;
    } else {
      profile.fgc += 20;
      profile.exp += 20;
      profile.trophies = Math.max(0, profile.trophies - 15);
    }
    await this.profileRepo.save(profile);

    return {
      battleId: battle.id,
      winnerId: winnerId || 'draw',
      rounds: rounds.length,
      rewards:
        winnerId === user.id
          ? { FGC: 100, exp: 50, trophies: 30 }
          : { FGC: 20, exp: 20, trophies: -15 },
    };
  }

  async history(user: User) {
    const battles = await this.battleRepo.find({
      where: { player1: { id: user.id } },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return battles;
  }
}
