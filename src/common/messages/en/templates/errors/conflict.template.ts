import { localizeEntityLabel, tError } from '@common/messages/error-translator';

interface ConflictTemplateArgs {
  entity: string;
  fieldName: string;
  fieldValue: string | number | boolean;
}

export function conflictTemplate({
  entity,
  fieldName,
  fieldValue,
}: ConflictTemplateArgs): string {
  return tError(
    'errors.conflict',
    {
      entity: localizeEntityLabel(entity),
      fieldName,
      fieldValue,
    },
    `${entity} with ${fieldName}: ${fieldValue} already exists`,
  );
}
