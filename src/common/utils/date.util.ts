export function getDaysDifferenceCeil(
  laterDate: Date,
  earlierDate: Date,
): number {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil(
    (laterDate.getTime() - earlierDate.getTime()) / millisecondsPerDay,
  );
}
