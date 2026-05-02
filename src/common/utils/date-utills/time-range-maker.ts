import { FindOptionsWhere, LessThan, MoreThan } from 'typeorm';

export function buildTimeOverlapFilter<T>(
  startField: keyof T,
  endField: keyof T,
  from?: string,
  to?: string,
): FindOptionsWhere<T> {
  const filter: FindOptionsWhere<T> = {};

  if (from && to) {
    Object.assign(filter, {
      [startField]: LessThan(to),
      [endField]: MoreThan(from),
    });
  } else if (from) {
    Object.assign(filter, {
      [endField]: MoreThan(from),
    });
  } else if (to) {
    Object.assign(filter, {
      [startField]: LessThan(to),
    });
  }

  return filter;
}
