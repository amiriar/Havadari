import { ValidationError } from '@nestjs/common';

export function getValidationMessages(
  error: ValidationError,
  messages = [],
  prefix = '',
) {
  if (error.constraints) {
    let message = Object.values(error.constraints);
    message = message.map((message) => {
      return prefix + message;
    });

    messages.push(...message);
    return messages;
  }

  error.children.forEach((err) => {
    prefix += error.property + '.';
    getValidationMessages(err, messages, prefix);
  });

  return messages;
}
