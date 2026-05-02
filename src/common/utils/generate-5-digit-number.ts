export function generate5DigitNumber() {
  return Math.floor(Math.random() * 90000 + 10000).toString();
}
