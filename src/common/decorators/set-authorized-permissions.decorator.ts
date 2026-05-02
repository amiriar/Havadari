import { AUTHORIZED_PERMISSIONS } from '@common/constants/keys';
import { SetMetadata } from '@nestjs/common';

export const SetAuthorizedPermissions = (permissions: string[]) => {
  return SetMetadata(AUTHORIZED_PERMISSIONS, permissions);
};
