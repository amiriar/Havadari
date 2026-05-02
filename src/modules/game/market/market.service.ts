import { User } from '@app/auth/entities/user.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListCardDto, PlaceBidDto } from '../dto';
import { GameProfile } from '../entities/game-profile.entity';
import { MarketListing } from '../entities/market-listing.entity';
import { UserCard } from '../entities/user-card.entity';
import { GameBootstrapService } from '../services/game-bootstrap.service';

@Injectable()
export class MarketService {
  constructor(
    @InjectRepository(MarketListing)
    private readonly listingRepo: Repository<MarketListing>,
    @InjectRepository(UserCard)
    private readonly userCardRepo: Repository<UserCard>,
    @InjectRepository(GameProfile)
    private readonly profileRepo: Repository<GameProfile>,
    private readonly bootstrap: GameBootstrapService,
  ) {}

  async listings() {
    return this.listingRepo.find({
      where: { status: 'active' },
      relations: ['seller', 'userCard', 'userCard.card'],
      order: { createdAt: 'DESC' },
    });
  }

  async list(user: User, dto: ListCardDto) {
    const userCard = await this.userCardRepo.findOne({
      where: { id: dto.userCardId, user: { id: user.id } },
      relations: ['card'],
    });
    if (!userCard) throw new NotFoundException('card not found');
    if (userCard.isListed) throw new BadRequestException('card already listed');

    const minPrice = Math.floor(userCard.card.baseValue * 0.5);
    const maxPrice = userCard.card.baseValue * 5;
    if (dto.price < minPrice || dto.price > maxPrice) {
      throw new BadRequestException(
        `price must be between ${minPrice} and ${maxPrice}`,
      );
    }

    userCard.isListed = true;
    userCard.listedPrice = dto.price;
    await this.userCardRepo.save(userCard);

    const listing = this.listingRepo.create({
      seller: user,
      userCard,
      price: dto.price,
    });
    await this.listingRepo.save(listing);
    return listing;
  }

  async buy(user: User, listingId: string) {
    const listing = await this.listingRepo.findOne({
      where: { id: listingId, status: 'active' },
      relations: ['seller', 'userCard', 'userCard.card', 'userCard.user'],
    });
    if (!listing) throw new NotFoundException('listing not found');
    if (listing.seller.id === user.id)
      throw new BadRequestException('cannot buy own listing');

    const buyerProfile = await this.bootstrap.ensureProfile(user);
    const sellerProfile = await this.bootstrap.ensureProfile(listing.seller);
    if (buyerProfile.fgc < listing.price)
      throw new BadRequestException('insufficient FGC');

    const platformFee = Math.floor(listing.price * 0.1);
    buyerProfile.fgc -= listing.price;
    sellerProfile.fgc += listing.price - platformFee;
    await this.profileRepo.save([buyerProfile, sellerProfile]);

    listing.status = 'sold';
    listing.userCard.user = user;
    listing.userCard.isListed = false;
    listing.userCard.listedPrice = null;
    await this.userCardRepo.save(listing.userCard);
    await this.listingRepo.save(listing);

    return {
      status: 'sold',
      listingId,
      paid: listing.price,
      platformFee,
    };
  }

  async bid(_user: User, listingId: string, dto: PlaceBidDto) {
    const listing = await this.listingRepo.findOne({
      where: { id: listingId, status: 'active' },
    });
    if (!listing) throw new NotFoundException('listing not found');
    return {
      listingId,
      currentPrice: listing.price,
      bidAmount: dto.amount,
      accepted: true,
      note: 'auction bids are accepted; auction engine can be expanded',
    };
  }

  async cancel(user: User, listingId: string) {
    const listing = await this.listingRepo.findOne({
      where: { id: listingId, seller: { id: user.id }, status: 'active' },
      relations: ['userCard'],
    });
    if (!listing) throw new NotFoundException('listing not found');

    listing.status = 'cancelled';
    listing.userCard.isListed = false;
    listing.userCard.listedPrice = null;
    await this.userCardRepo.save(listing.userCard);
    await this.listingRepo.save(listing);
    return { listingId, status: 'cancelled' };
  }
}
