import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  Max,
  IsPhoneNumber,
} from 'class-validator';

export class LoginByFingerprintDto {
  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber()
  phoneNumber: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(255, { each: true })
  fingerprintData: number[];
}
