import { ValueTransformer } from 'typeorm';
export const DateOnlyTransformer: ValueTransformer = {
  to: (value: Date) => {
    return new Date(value).toISOString().split('T')[0];
  },
  from: (value: Date) => new Date(value).toISOString().split('T')[0],
};
