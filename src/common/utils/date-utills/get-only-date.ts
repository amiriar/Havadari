export function getOnlyDate(date: Date) {
  return date.toISOString().split('T')[0];
}
