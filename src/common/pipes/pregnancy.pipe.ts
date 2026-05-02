import { Gender } from '@common/enums';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint()
export class PregnancyValidation implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    const dto = args.object as any;
    if (value === 'true' && dto.gender == Gender.Male) {
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return 'isPregnant can not be true while gender is Male';
  }
}
