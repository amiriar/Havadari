import { User } from '@app/auth/entities/user.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlacePredictionDto } from '../dto';
import { GameProfile } from '../entities/game-profile.entity';
import { Prediction } from '../entities/prediction.entity';
import { GameBootstrapService } from '../services/game-bootstrap.service';

@Injectable()
export class PredictionService {
  constructor(
    @InjectRepository(Prediction)
    private readonly predictionRepo: Repository<Prediction>,
    @InjectRepository(GameProfile)
    private readonly profileRepo: Repository<GameProfile>,
    private readonly bootstrap: GameBootstrapService,
  ) {}

  getMatches() {
    return [
      { id: 'wc26-arg-fra', home: 'Argentina', away: 'France' },
      { id: 'wc26-esp-eng', home: 'Spain', away: 'England' },
    ];
  }

  async place(user: User, dto: PlacePredictionDto) {
    const profile = await this.bootstrap.ensureProfile(user);
    if (profile.fgc < dto.betAmount) {
      throw new BadRequestException('insufficient FGC');
    }
    profile.fgc -= dto.betAmount;
    await this.profileRepo.save(profile);

    const prediction = this.predictionRepo.create({
      user,
      matchId: dto.matchId,
      type: dto.type,
      value: dto.value,
      betAmount: dto.betAmount,
      odds: Number((1.3 + Math.random() * 1.7).toFixed(2)),
      result: 'pending',
    });
    await this.predictionRepo.save(prediction);
    return prediction;
  }

  myPredictions(user: User) {
    return this.predictionRepo.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }
}
