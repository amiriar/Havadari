import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsUtcDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsZeroDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;
          return !!value.endsWith('Z');
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a UTC datetime string ending with 'Z'.`;
        },
      },
    });
  };
}
