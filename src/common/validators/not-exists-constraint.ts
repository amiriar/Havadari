import { conflictTemplate } from '@common/messages/en/templates/errors/conflict.template';
import { ConflictException, HttpStatus, Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import dataSource from 'src/config/data-source';
@ValidatorConstraint({ async: true })
@Injectable()
export class NotExistenceConstraint implements ValidatorConstraintInterface {
  async validate(value: string, args: ValidationArguments): Promise<boolean> {
    const entityClass = args.constraints[0];
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      const exists: boolean = await queryRunner.manager
        .createQueryBuilder(entityClass, entityClass.name)
        .where(`${entityClass.name}.${args.property} = :value`, { value })
        .withDeleted()
        .getExists();
      if (exists) {
        throw new ConflictException({
          message: conflictTemplate({
            entity: args.constraints[0].name,
            fieldName: args.property,
            fieldValue: args.value,
          }),
          code: `${entityClass.name.toLowerCase()}_${args.property}_409`,
          statusCode: HttpStatus.CONFLICT,
        });
      }
      return true;
    } finally {
      await queryRunner.release();
    }
  }

  defaultMessage(args: ValidationArguments): string {
    return conflictTemplate({
      entity: args.constraints[0].name,
      fieldName: args.property,
      fieldValue: args.value,
    });
  }
}

export function NotExists(
  entityClass: any,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [entityClass],
      validator: NotExistenceConstraint,
    });
  };
}
