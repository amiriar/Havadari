import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsDateOnlyConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (typeof value !== 'string') return false;

    const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;

    return dateOnlyRegex.test(value) && !isNaN(Date.parse(value));
  }

  defaultMessage(): string {
    return 'Date must be in YYYY-MM-DD format without time.';
  }
}

export function IsDateOnly(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsDateOnlyConstraint,
    });
  };
}
