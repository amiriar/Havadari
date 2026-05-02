import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { FindUsersDto } from '../dto/find-users.dto';
import { User } from '../entities/user.entity';
import { UserControllerCode } from '../constants/controller-codes';

@Injectable()
export class UserSearchService {
  constructor(
    private readonly elasticSearchService: ElasticsearchService,
    private readonly configService: ConfigService,
  ) {}

  async elasticSearch(query: FindUsersDto): Promise<Array<User>> {
    try {
      const indexName = this.configService.get<string>(
        'ELASTICSEARCH_USERS_INDEX',
      );
      const { hits } = await this.elasticSearchService.search({
        index: indexName,
        query: {
          bool: {
            should: query.searchQuery,
            minimum_should_match: 1,
          },
        },
      });
      return hits.hits.map((hit) => hit._source as User);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({
        code: `${UserControllerCode}02`,
        statusCode: HttpStatus.NOT_FOUND,
        message: 'internal server error',
      });
    }
  }
}
