import { ValueTransformer } from 'typeorm';
export const MilitaryTimeTransformer: ValueTransformer = {
  to: (value: string | null) => value,
  from: (value: string | null) => (value ? value.substring(0, 5) : null),
};
