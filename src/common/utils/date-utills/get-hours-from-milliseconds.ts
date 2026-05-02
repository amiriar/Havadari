export function getHoursFromMillSeconds(milliSeconds: number) {
  const hours = milliSeconds / (1000 * 60 * 60);
  return hours;
}
