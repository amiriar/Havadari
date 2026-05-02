import Handlebars from 'handlebars';

const otp = `Confidential \n This is your otp in {{clinicName}} clinic 
\n OTP: {{otp}} \n do not share it with others`;

export const otpTemplate = Handlebars.compile(otp);
