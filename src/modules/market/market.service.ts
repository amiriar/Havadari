import { User } from '@app/auth/entities/user.entity';
import { UserCard } from '@app/cards/entities/user-card.entity';
import { RankPointSourceEnum } from '@app/leaderboard/constants/rank-point-source.enum';
import { RankPointsService } from '@app/leaderboard/rank-points.service';
import { MissionsService } from '@app/missions/missions.service';
import { MissionMetricEnum } from '@app/missions/constants/mission.enums';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import { LessThan, Repository } from 'typeorm';
import { CreateListingDto } from './dto/create-listing.dto';
import { GetMarketListingsQueryDto } from './dto/get-market-listings-query.dto';
import { ListingStatusEnum } from './constants/listing-status.enum';
import { MarketListing } from './entities/market-listing.entity';
import { MarketTrade } from './entities/market-trade.entity';

@Injectable()
export class MarketService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserCard)
    private readonly userCardRepo: Repository<UserCard>,
    @InjectRepository(MarketListing)
    private readonly listingRepo: Repository<MarketListing>,
    @InjectRepository(MarketTrade)
    private readonly tradeRepo: Repository<MarketTrade>,
    private readonly rankPointsService: RankPointsService,
    private readonly missionsService: MissionsService,
  ) {}

  @Cron('0 */10 * * * *')
  async expireListingsCron() {
    await this.expireOldListings();
  }

  async list(user: User, dto: CreateListingDto) {
    const seller = await this.mustUser(user);
    const owned = await this.userCardRepo.findOne({
      where: { id: dto.userCardId, user: { id: seller.id } },
      relations: { card: true },
    });
    if (!owned) throw new NotFoundException('User card not found.');
    if (owned.isInDeck) {
      throw new BadRequestException('Card in active squad cannot be listed.');
    }
    if (owned.isListed) {
      throw new BadRequestException('Card is already listed.');
    }

    const minPrice = Math.floor(owned.card.baseValue * 0.5);
    const maxPrice = Math.floor(owned.card.baseValue * 5);
    if (dto.price < minPrice || dto.price > maxPrice) {
      throw new BadRequestException(
        `Price must be between ${minPrice} and ${maxPrice}.`,
      );
    }

    const listingFee = Math.floor(dto.price * 0.05);
    if (seller.fgc < listingFee) {
      throw new BadRequestException('Not enough FGC for listing fee.');
    }
    seller.fgc -= listingFee;
    owned.isListed = true;

    const listing = this.listingRepo.create({
      seller,
      userCard: owned,
      price: dto.price,
      listingFee,
      expiresAt: new Date(Date.now() + dto.durationHours * 60 * 60 * 1000),
      status: ListingStatusEnum.ACTIVE,
    });

    await this.userRepo.save(seller);
    await this.userCardRepo.save(owned);
    await this.listingRepo.save(listing);
    return listing;
  }

  async buy(user: User, listingId: string) {
    const buyer = await this.mustUser(user);
    const listing = await this.listingRepo.findOne({
      where: { id: listingId },
      relations: { seller: true, userCard: { user: true, card: true } },
    });
    if (!listing || listing.status !== ListingStatusEnum.ACTIVE) {
      throw new NotFoundException('Active listing not found.');
    }
    if (listing.expiresAt.getTime() <= Date.now()) {
      await this.markExpired(listing);
      throw new BadRequestException('Listing has expired.');
    }
    if (listing.seller.id === buyer.id) {
      throw new BadRequestException('You cannot buy your own listing.');
    }
    if (buyer.fgc < listing.price) {
      throw new BadRequestException('Not enough FGC.');
    }

    const seller = await this.userRepo.findOne({
      where: { id: listing.seller.id },
    });
    if (!seller) throw new BadRequestException('Seller not found.');

    const platformFee = Math.floor(listing.price * 0.1);
    const sellerReceive = listing.price - platformFee;

    buyer.fgc -= listing.price;
    seller.fgc += sellerReceive;

    listing.status = ListingStatusEnum.SOLD;
    listing.userCard.user = buyer;
    listing.userCard.isListed = false;
    listing.userCard.isInDeck = false;

    await this.userRepo.save([buyer, seller]);
    await this.userCardRepo.save(listing.userCard);
    await this.listingRepo.save(listing);
    await this.tradeRepo.save(
      this.tradeRepo.create({
        seller,
        buyer,
        userCard: listing.userCard,
        price: listing.price,
        platformFee,
        sellerReceive,
      }),
    );
    await this.rankPointsService.apply(
      seller.id,
      4,
      RankPointSourceEnum.REWARD,
      listing.id,
      { marketAction: 'sell' },
    );
    await this.rankPointsService.apply(
      buyer.id,
      2,
      RankPointSourceEnum.REWARD,
      listing.id,
      { marketAction: 'buy' },
    );
    await this.missionsService.track(seller.id, MissionMetricEnum.SELL_CARDS, 1);
    await this.missionsService.track(buyer.id, MissionMetricEnum.BUY_CARDS, 1);

    return {
      listingId: listing.id,
      price: listing.price,
      platformFee,
      sellerReceive,
      buyerFgc: buyer.fgc,
    };
  }

  async listings(query: GetMarketListingsQueryDto, url?: string) {
    const qb = this.listingRepo
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.seller', 'seller')
      .leftJoinAndSelect('listing.userCard', 'userCard')
      .leftJoinAndSelect('userCard.card', 'card')
      .where('listing.status = :status', { status: ListingStatusEnum.ACTIVE })
      .orderBy('listing.createdAt', 'DESC');

    if (query.rarity) {
      qb.andWhere('card.rarity = :rarity', { rarity: query.rarity });
    }
    if (query.position) {
      qb.andWhere('card.position = :position', { position: query.position });
    }

    return paginate(qb, {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      route: url,
    });
  }

  async myListings(user: User, page = 1, limit = 20, url?: string) {
    const me = await this.mustUser(user);
    return paginate(
      this.listingRepo,
      { page, limit, route: url },
      {
        where: { seller: { id: me.id } },
        relations: { userCard: { card: true } },
        order: { createdAt: 'DESC' },
      },
    );
  }

  async cancel(user: User, listingId: string) {
    const me = await this.mustUser(user);
    const listing = await this.listingRepo.findOne({
      where: { id: listingId, seller: { id: me.id } },
      relations: { userCard: true },
    });
    if (!listing || listing.status !== ListingStatusEnum.ACTIVE) {
      throw new NotFoundException('Active listing not found.');
    }
    listing.status = ListingStatusEnum.CANCELLED;
    listing.userCard.isListed = false;
    await this.userCardRepo.save(listing.userCard);
    await this.listingRepo.save(listing);
    return { cancelled: true, listingId };
  }

  async expireOldListings() {
    const old = await this.listingRepo.find({
      where: {
        status: ListingStatusEnum.ACTIVE,
        expiresAt: LessThan(new Date()),
      },
      relations: { userCard: true },
      take: 1000,
    });
    for (const row of old) {
      await this.markExpired(row);
    }
    return { expired: old.length };
  }

  private async markExpired(listing: MarketListing) {
    listing.status = ListingStatusEnum.EXPIRED;
    listing.userCard.isListed = false;
    await this.userCardRepo.save(listing.userCard);
    await this.listingRepo.save(listing);
  }

  private async mustUser(user?: User) {
    if (!user?.id) throw new UnauthorizedException('Authentication required.');
    const found = await this.userRepo.findOne({ where: { id: user.id } });
    if (!found) throw new UnauthorizedException('User not found.');
    return found;
  }
}
