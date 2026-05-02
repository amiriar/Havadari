import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

export async function validateDto<T extends object>(
  dtoClass: new () => T,
  obj: Record<string, any>,
): Promise<string[] | null> {
  const dtoInstance = plainToInstance(dtoClass, obj);

  const errors = await validate(dtoInstance);

  if (errors.length > 0) {
    return errors.flatMap((err) => Object.values(err.constraints ?? {}));
  }

  return null;
}
