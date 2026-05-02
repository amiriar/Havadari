export function unflatten(obj: Record<string, any>): any {
  const result: any = {};
  for (const key in obj) {
    const keys = key.split('.');
    keys.reduce((acc, k, i) => {
      if (i === keys.length - 1) {
        acc[k] = obj[key];
      } else {
        acc[k] = acc[k] || {};
      }
      return acc[k];
    }, result);
  }
  return result;
}
