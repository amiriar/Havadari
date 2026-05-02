import { Injectable } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';

@Injectable()
export class DtoValidationService {
  async validate(dto: any): Promise<string[]> {
    const errors = await validate(dto, { whitelist: true });
    return this.extractErrors(errors);
  }

  private extractErrors(errors: ValidationError[]): string[] {
    const messages: string[] = [];
    for (const err of errors) {
      if (err.constraints) {
        messages.push(...Object.values(err.constraints));
      }
      if (err.children?.length) {
        messages.push(...this.extractErrors(err.children));
      }
    }
    return messages;
  }
}
