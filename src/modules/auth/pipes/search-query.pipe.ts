import { PipeTransform } from '@nestjs/common';
import { FindUsersDto } from '@app/auth/dto/find-users.dto';

export class SearchQueryPipe implements PipeTransform {
  transform(query: FindUsersDto): FindUsersDto {
    if (!query.advancedSearch) {
      return query;
    }

    query.searchQuery = [];

    if (query.fullName) {
      query.searchQuery.push({
        fuzzy: { fullName: { value: query.fullName, fuzziness: 2 } },
      });
    }

    if (query.name) {
      query.searchQuery.push({
        match: { fullName: { query: query.name, fuzziness: 'AUTO' } },
      });
    }

    if (query.phoneNumber) {
      query.searchQuery.push({
        fuzzy: { phoneNumber: { value: query.phoneNumber, fuzziness: 2 } },
      });
    }

    if (query.nationalCode) {
      query.searchQuery.push({
        fuzzy: { nationalCode: { value: query.nationalCode, fuzziness: 2 } },
      });
    }

    return query;
  }
}
