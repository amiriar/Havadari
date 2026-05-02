export function getPercentage(total: number, percent: number): number {
  if (percent < 0 || percent > 100) {
    throw new Error('percent must be between 0 and 100');
  }

  const result: number = (total / 100) * percent;

  return Number(result.toFixed(2));
}
