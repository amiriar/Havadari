import * as bcrypt from 'bcrypt';

export class HashingUtil {
  static async hash(password: string): Promise<string> {
    const salt: string = await bcrypt.genSalt(10);

    return await bcrypt.hash(password, salt);
  }
}
