export function getKeyValues(json: object) {
  return Object.keys(json).map((key) => {
    return { key: key, value: json[key] };
  });
}
