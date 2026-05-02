import { notFoundTemplate } from '@common/messages/en/templates/errors/not-found.template';
import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import dataSource from 'src/config/data-source';
import { NotFoundException, HttpStatus } from '@nestjs/common';
@ValidatorConstraint({ async: true })
@Injectable()
export class ExistenceConstraint implements ValidatorConstraintInterface {
  async validate(value: string, args: ValidationArguments): Promise<boolean> {
    const entityClass = args.constraints[0];
    const repository = dataSource.getRepository(args.constraints[0]);
    const exists = await repository.exists({ where: { id: value } });
    if (!exists) {
      throw new NotFoundException({
        message: notFoundTemplate({
          entity: args.property,
        }),
        code: `${entityClass.name.toLowerCase()}_id_404`,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    return exists;
  }

  defaultMessage(args: ValidationArguments): string {
    return notFoundTemplate({ entity: args.property });
  }
}

export function Exists(
  entityClass: any,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [entityClass],
      validator: ExistenceConstraint,
    });
  };
}
