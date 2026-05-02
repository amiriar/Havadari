// src/config/config.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { join } from 'path';
import { envValidationSchema } from './env.validation';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(process.cwd(), '.env'),
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true, // Allows additional fields in the .env file that are not defined in the validation schema. This is useful since IDEs like VSCode may automatically add their own environment variables
        abortEarly: false, // Returns all validation errors instead of stopping at the first error, providing better debugging experience
      },
    }),
  ],
})
export class ApplicationConfigModule {}
