export class OtpSentResponse {
  message: string;
  phoneNumber?: string;
  secondsToExpire: number;
  otp?: string;
}
