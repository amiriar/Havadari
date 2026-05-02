import { GiftCodeTypeEnum } from '@common/enums/gift-code-type.enum';

/**
 * Generates a unique gift code based on its type.
 * @param type - Type of the gift code (SCORE, WALLET_CREDIT, DISCOUNT)
 * @param length - The length of the random part (default: 8)
 * @param characters - The character set for generation (default: alphanumeric uppercase)
 * @returns Gift code with type prefix (e.g. "S-ABCD1234")
 */
export function generateGiftCodeByType(
  type: GiftCodeTypeEnum,
  length: number = 8,
  characters: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
): string {
  let result = '';

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  // Define prefix based on type
  const prefixMap: Record<GiftCodeTypeEnum, string> = {
    [GiftCodeTypeEnum.SCORE]: 'S',
    [GiftCodeTypeEnum.WALLET_CREDIT]: 'W',
    [GiftCodeTypeEnum.DISCOUNT]: 'D',
  };

  const prefix = prefixMap[type] ?? 'X'; // fallback in case of unexpected type

  return `${prefix}-${result}`;
}
