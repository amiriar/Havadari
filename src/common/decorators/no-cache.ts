import { SetMetadata } from '@nestjs/common';
import { NO_CACHE_METADATA } from '@common/constants/keys';

export const NoCache = () => SetMetadata(NO_CACHE_METADATA, true);
