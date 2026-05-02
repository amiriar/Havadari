export function normalizeBooleanStrings(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(normalizeBooleanStrings);
  } else if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = normalizeBooleanStrings(obj[key]);
    }
    return result;
  } else if (typeof obj === 'string') {
    if (obj.toLowerCase() === 'بلی') return 'true';
    if (obj.toLowerCase() === 'خیر') return 'false';
  }
  return obj;
}
