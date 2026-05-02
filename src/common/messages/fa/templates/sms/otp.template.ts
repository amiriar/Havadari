import Handlebars from 'handlebars';

const otp =
  'محرمانه:\n این کد را در اختیار کسی قرار ندهید. \n کد تایید شما در اسپاتی کد: {{otp}}';

export const otpTemplate = Handlebars.compile(otp);
