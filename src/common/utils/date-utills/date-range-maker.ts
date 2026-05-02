import {
  Between,
  LessThanOrEqual,
  MoreThanOrEqual,
  FindOptionsWhere,
} from 'typeorm';

export function buildDateRangeFilter<T>(
  field: keyof T,
  from?: Date | string,
  to?: Date | string,
): FindOptionsWhere<T> {
  if (from && to) return { [field]: Between(from, to) } as any;
  if (from) return { [field]: MoreThanOrEqual(from) } as any;
  if (to) return { [field]: LessThanOrEqual(to) } as any;
  return {};
}
