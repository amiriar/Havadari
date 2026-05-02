import { TARGET_ENTITY } from '@common/constants/keys';
import { SetMetadata } from '@nestjs/common';
import { EntityTarget, ObjectLiteral } from 'typeorm';

export const SetTargetEntity = (targetEntity: EntityTarget<ObjectLiteral>) => {
  return SetMetadata(TARGET_ENTITY, targetEntity);
};

