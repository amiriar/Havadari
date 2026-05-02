import { randomBytes } from 'crypto';

export function generatNumber(spoticode_code: string) {
  const digits = 6;
  const buffer = randomBytes(digits);
  const code = buffer.readUIntBE(0, digits) % 10 ** digits;
  return spoticode_code + code.toString().padStart(digits, '0');
}

export function generatDocumentNumber(
  spoticode_code: string,
  lastPatientDocNumber: string,
): string {
  const lastDocNumber = parseInt(lastPatientDocNumber);
  const newDocNumber: number = lastDocNumber + 1;
  const newDocNumberString: string = newDocNumber.toFixed(0);
  return spoticode_code + newDocNumberString.padStart(5, '0');
}
