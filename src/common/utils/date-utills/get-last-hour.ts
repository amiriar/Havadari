export function getLasHour() {
  return new Date(
    new Date(new Date().setHours(new Date().getHours() - 1))
      .toISOString()
      .substring(23, -1),
  );
}
