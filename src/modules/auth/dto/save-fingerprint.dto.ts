import { ArrayMinSize, IsArray, IsInt, Max, Min } from 'class-validator';

export class SaveFingerprintDto {
  @IsArray()
  @ArrayMinSize(1)
  // TODO
  // @ArrayMaxSize(1)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(255, { each: true })
  fingerprintData: number[];
}
