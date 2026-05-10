import { ApiProperty } from '@nestjs/swagger';

export class RealtimeSpecResponseDto {
  @ApiProperty()
  namespace: string;

  @ApiProperty({ type: [String] })
  clientEvents: string[];

  @ApiProperty({ type: [String] })
  serverEvents: string[];

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  rooms: Record<string, string>;
}

