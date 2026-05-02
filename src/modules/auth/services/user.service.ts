import { FileService } from '@app/file/services/file.service';
import { USER_REGISTERED } from '@common/constants/events';
import { PaginationQuery } from '@common/dto/pagination-input-query';
import { notFoundTemplate } from '@common/messages/en/templates/errors/not-found.template';
import { BaseService } from '@common/services/base-service.service';
import { CACHED_ROLES, ONE_HOUR_IN_MS } from '@common/utils/constants.utils';
import { deepMerge } from '@common/utils/deep-merge';
import { getFlatPermissions } from '@common/utils/get-flat-permissions';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import {
  FilterOperator,
  FilterSuffix,
  paginate as nestjsPaginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { DeepPartial, In, Repository } from 'typeorm';
import { UserControllerCode } from '../constants/controller-codes';
import { FindUsersDto } from '../dto/find-users.dto';
import { RegisterDto } from '../dto/register.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { VerifyUserDto } from '../dto/verify-user.dto';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';
import { RoleService } from './role.service';
import { UserSearchService } from './user-search.service';
import { File } from '@app/file/entities/file.entity';

@Injectable()
export class UserService extends BaseService {
  constructor(
    @InjectRepository(User) protected readonly repository: Repository<User>,
    private readonly fileService: FileService,
    private readonly userSearchService: UserSearchService,
    private readonly eventEmitter: EventEmitter2,
    private readonly rolesService: RoleService,
    @Inject(CACHE_MANAGER)
    protected readonly cacheManager: Cache,
  ) {
    super();
  }

  /**
   * @param dto RegisterDto
   * @returns User
   * @description cerates a new user,and returns the body
   */
  async create(
    dto: RegisterDto,
    files?: Array<Express.Multer.File>,
  ): Promise<User> {
    //create user
    const user: User = this.repository.create(dto);

    //save user to database
    await this.repository.save(user);

    if (files) {
      const savedFiles: File[] = await this.fileService.saveMany(files, user);

      await this.setAvatar(savedFiles, user.id);
    }

    this.eventEmitter.emit(USER_REGISTERED, user);

    return user;
  }

  /**
   * @param userId string
   * @returns User
   * @description finds a user by id
   */
  async findOne(userId: string): Promise<User> {
    const user = await this.repository.findOne({
      where: {
        id: userId,
      },
      relations: {
        roles: {
          permissions: true,
        },
        permissions: true,
      },
    });

    if (!user)
      throw new NotFoundException({
        code: `${UserControllerCode}01`,
        statusCode: HttpStatus.NOT_FOUND,
        message: notFoundTemplate({ entity: 'User' }),
      });

    const avatar = await this.loadAvatar(user);
    const signature = await this.loadSignature(user);
    user.avatar = avatar[0]?.url;
    user.signature = signature[0]?.url;
    return user;
  }

  /**
   * @param userId string
   * @returns User
   * @description finds a user by id
   */
  async findOneMinimal(userId: string): Promise<User> {
    const user = await this.repository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user)
      throw new NotFoundException({
        code: `${UserControllerCode}01`,
        statusCode: HttpStatus.NOT_FOUND,
        message: notFoundTemplate({ entity: 'User' }),
      });

    return user;
  }

  /**
   * @param phoneNumber string
   * @returns Boolean
   * @description cerates a new user,and returns the body
   */
  async isPhoneRegistered(phoneNumber: string): Promise<boolean> {
    const exists: boolean = await this.repository.exists({
      where: { phoneNumber: phoneNumber },
    });
    return exists;
  }

  /**
   * @param PaginationQuery
   * @returns User Array
   * @description returns users list
   */
  async findAll(
    query: PaginationQuery<FindUsersDto>,
    url: string,
  ): Promise<Pagination<User> | Array<User>> {
    if (query.data?.advancedSearch) {
      return await this.userSearchService.elasticSearch(query.data);
    }

    if (query.data) {
      delete query.data.advancedSearch;
      delete query.data.name;
    }

    let users: Pagination<User>;

    if (query.data.roleName) {
      const queryBuilder = this.repository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.roles', 'role')
        .where('role.name = :roleName', { roleName: query.data.roleName });

      delete query.data.roleName;

      for (const [key, value] of Object.entries(query.data)) {
        if (value != null) {
          queryBuilder.andWhere(`user.${key} = :${key}`, { [key]: value });
        }
      }

      users = await paginate(queryBuilder, {
        ...query.paginationOptions,
        route: url,
      });

      await this.attachAvatars(users.items);

      return users;
    }

      users = await paginate(
        this.repository,
        {
          ...query.paginationOptions,
          route: url,
        },
        {
          where: query.data,
        },
      );

    //await this.attachAvatars(users.items);

    return users;
  }

  private async attachAvatars(users: User[]) {
    for (const user of users) {
      const avatar = await this.loadAvatar(user);
      user.avatar = avatar[0]?.url;
    }
  }

  /**
   * @param UpdateUserDto
   * @returns User
   * @description updates user
   */
  async update(
    id: string,
    body: UpdateUserDto,
    files?: Array<Express.Multer.File>,
  ) {
    const userToUpdate: User = await this.findOne(id);
    const updatedParts: DeepPartial<User> = this.repository.create(body);
    const updatedUser = await this.repository.save(
      deepMerge(userToUpdate, updatedParts),
    );

    if (files) {
      const savedFiles: File[] = await this.fileService.saveMany(
        files,
        userToUpdate,
      );
      await this.setAvatar(savedFiles, id);
    }

    return updatedUser;
  }

  /**
   * @param UserId
   * @returns DeleteResult
   * @description deletes user specified by userId
   */
  async delete(userId: string) {
    await this.cacheManager.del(userId);
    await this.repository.softDelete({ id: userId });
  }

  /**
   * @param UserId
   * @returns DeleteResult
   * @description deletes user specified by userId
   */
  async recover(userId: string) {
    await this.repository.recover({ id: userId });
  }

  async loadAvatar(user: User) {
    return await this.fileService.find(user, 'avatar');
  }

  async loadSignature(user: User) {
    return await this.fileService.find(user, 'signature');
  }

  async loadFingerprint(user: User) {
    return await this.fileService.find(user, 'fingerprint');
  }

  async loadRoles(userId: string) {
    const user: User = await this.repository.findOne({
      where: { id: userId },
      relations: { roles: true },
      select: { roles: true },
    });

    return user.roles;
  }

  async setFiles(userId: string, files?: Array<Express.Multer.File>) {
    const user: User = await this.repository.findOne({ where: { id: userId } });

    if (files) {
      const savedFiles: File[] = await this.fileService.saveMany(files, user);
      await this.setAvatar(savedFiles, user.id);
    }
  }

  async verify(userId: string, body: VerifyUserDto) {
    await this.repository.update(userId, body);

    return {
      userId,
      ...body,
    };
  }
  async findAllByRolename(
    query: PaginateQuery,
    url: string,
  ): Promise<Paginated<User> | Array<User>> {
    return nestjsPaginate(query, this.repository, {
      select: [
        'id',
        'fullName',
        'email',
        'userName',
        'phoneNumber',
        'nationalCode',
        'createdAt',
        'updatedAt',
        'personnel.id',
        'personnel.salary',
        'personnel.personnelNumber',
        'personnel.position',
        'personnel.position.name',
        'personnel.position.description',
      ],
      searchableColumns: ['fullName'],
      multiWordSearch: true,
      sortableColumns: ['createdAt', 'updatedAt'],
      defaultSortBy: [['createdAt', 'DESC']],
      relations: ['personnel.position', 'personnel', 'roles'],
      filterableColumns: {
        'roles.name': [FilterOperator.EQ, FilterSuffix.NOT],
      },
      origin: url,
    });
  }

  async findByRoleName(roleName: string): Promise<User[]> {
    return await this.repository.find({
      relations: ['roles'],
      where: {
        roles: {
          name: In([roleName]),
        },
      },
    });
  }

  async getPermissions(user: User) {
    let roles: Array<Role> = await this.cacheManager.get(CACHED_ROLES);

    if (!roles) {
      roles = await this.rolesService.findAll();
      await this.cacheManager.set(CACHED_ROLES, roles, ONE_HOUR_IN_MS);
    }

    return Array.from(new Set(getFlatPermissions(user, roles)));
  }

  async getFiles(userId: string) {
    const user = await this.repository.findOne({
      where: { id: userId },
      select: ['id'],
    });

    return this.fileService.find(user, 'patient-document');
  }

  async setAvatar(savedFiles: File[], userId: string) {
    const avatar = savedFiles.find((file) => file.relationType == 'avatar');
    if (!avatar) {
      return;
    }
    await this.repository.update(userId, { avatar: avatar.url });
  }

  // async setAllAvatars() {
  //   return;
  //   const allUsers: number = await this.repository.count();
  //   console.log(allUsers);
  //   let chunk: User[];
  //   let avatar;
  //   for (let c = 1, i = 1; c < allUsers; c += 100, i++) {
  //     chunk = [];
  //     chunk = await this.repository.find({ skip: (i - 1) * 100, take: 100 });
  //     console.log((i - 1) * 100);
  //     for (const user of chunk) {
  //       avatar = await this.loadAvatar(user);

  //       if (avatar[0]) {
  //         await this.repository.update(user.id, { avatar: avatar[0].url });
  //       }
  //     }
  //   }
  //   return 'completed';
  // }
}
