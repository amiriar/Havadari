export function deepMerge(base: any, partial: any) {
  if (typeof partial != 'object' || partial === null) {
    base = partial;
    return base;
  }

  if (Array.isArray(partial)) {
    if (!base) {
      base = [];
    }

    partial.forEach((partial, index) => {
      base[index] = deepMerge(base[index], partial);
    });

    return base;
  }

  Object.keys(partial).forEach((key) => {
    if (!base) {
      base = {};
    }

    base[key] = deepMerge(base[key], partial[key]);
  });

  return base;
}
