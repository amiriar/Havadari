import { localizeEntityLabel, tError } from '@common/messages/error-translator';

export function notFoundTemplate({ entity }: { entity: string }): string {
  return tError(
    'errors.not_found',
    { entity: localizeEntityLabel(entity) },
    `${entity} not found`,
  );
}
