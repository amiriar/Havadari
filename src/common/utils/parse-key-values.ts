export function parseKeyValue(keyalues: { key: string; value: string }[]) {
  const result = {};
  keyalues.forEach((item) => (result[item.key] = item.value));

  return result;
}
