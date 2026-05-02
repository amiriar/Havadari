import { WeekDays } from '@common/enums/week-days.enum';

export function getDayOfWeek(index: number): WeekDays {
  const map = new Map<number, WeekDays>([
    [0, WeekDays.SUN],
    [1, WeekDays.MON],
    [2, WeekDays.TUE],
    [3, WeekDays.WED],
    [4, WeekDays.THU],
    [5, WeekDays.FRI],
    [6, WeekDays.SAT],
  ]);
  return map.get(index);
}
