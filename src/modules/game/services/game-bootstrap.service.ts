import { User } from '@app/auth/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from '../entities/card.entity';
import { GameProfile } from '../entities/game-profile.entity';
import { UserCard } from '../entities/user-card.entity';

@Injectable()
export class GameBootstrapService {
  constructor(
    @InjectRepository(GameProfile)
    private readonly gameProfileRepo: Repository<GameProfile>,
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
    @InjectRepository(UserCard)
    private readonly userCardRepo: Repository<UserCard>,
  ) {}

  async ensureProfile(user: User): Promise<GameProfile> {
    let profile = await this.gameProfileRepo.findOne({
      where: { user: { id: user.id } },
      relations: ['user'],
    });

    if (!profile) {
      profile = this.gameProfileRepo.create({ user });
      profile = await this.gameProfileRepo.save(profile);
    }

    const cardsCount = await this.userCardRepo.count({
      where: { user: { id: user.id } },
    });

    if (cardsCount === 0) {
      await this.seedStarterCards(user);
    }

    return profile;
  }

  async ensureCardCatalog(): Promise<void> {
    const count = await this.cardRepo.count();
    if (count > 0) return;

    const cards = this.cardRepo.create([
      {
        playerName: 'Lionel Messi',
        playerNameFa: 'لیونل مسی',
        nationality: 'Argentina',
        position: 'FW',
        overallRating: 99,
        speed: 92,
        power: 87,
        skill: 99,
        attack: 98,
        defend: 44,
        rarity: 'MYTHIC',
        edition: 'WORLD_CUP_2026',
        avatar: '',
        baseValue: 30000,
      },
      {
        playerName: 'Rodri',
        playerNameFa: 'رودری',
        nationality: 'Spain',
        position: 'MID',
        overallRating: 98,
        speed: 80,
        power: 90,
        skill: 95,
        attack: 88,
        defend: 94,
        rarity: 'LEGENDARY',
        edition: 'WORLD_CUP_2026',
        avatar: '',
        baseValue: 8000,
      },
      {
        playerName: 'Jude Bellingham',
        playerNameFa: 'بلینگام',
        nationality: 'England',
        position: 'MID',
        overallRating: 98,
        speed: 86,
        power: 87,
        skill: 94,
        attack: 91,
        defend: 82,
        rarity: 'EPIC',
        edition: 'WORLD_CUP_2026',
        avatar: '',
        baseValue: 2000,
      },
      {
        playerName: 'Mehdi Taremi',
        playerNameFa: 'مهدی طارمی',
        nationality: 'Iran',
        position: 'FW',
        overallRating: 84,
        speed: 79,
        power: 80,
        skill: 82,
        attack: 85,
        defend: 45,
        rarity: 'RARE',
        edition: 'WORLD_CUP_2026',
        avatar: '',
        baseValue: 500,
      },
      {
        playerName: 'Alireza Beiranvand',
        playerNameFa: 'علیرضا بیرانوند',
        nationality: 'Iran',
        position: 'GK',
        overallRating: 78,
        speed: 60,
        power: 82,
        skill: 70,
        attack: 40,
        defend: 81,
        rarity: 'COMMON',
        edition: 'WORLD_CUP_2026',
        avatar: '',
        baseValue: 100,
      },
    ]);
    await this.cardRepo.save(cards);
  }

  private async seedStarterCards(user: User): Promise<void> {
    await this.ensureCardCatalog();
    const starter = await this.cardRepo.find({
      order: { overallRating: 'DESC' },
      take: 5,
    });
    if (!starter.length) return;

    const userCards = starter.map((card, index) =>
      this.userCardRepo.create({
        user,
        card,
        level: 1,
        isInDeck: index < 5,
      }),
    );
    await this.userCardRepo.save(userCards);
  }
}
