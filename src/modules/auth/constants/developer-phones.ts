import { ApplicationMainRoles } from '@common/enums/application-main-roles.enum';

type DeveloperPhoneConfig = {
  phoneNumber: string;
  role?: ApplicationMainRoles;
};

export const DEVELOPER_PHONE_OTP = '123456';

export const DEVELOPER_PHONE_CONFIG: DeveloperPhoneConfig[] = [
  { phoneNumber: '+989100000001' },
  { phoneNumber: '+989100000002', role: ApplicationMainRoles.SUPERADMIN },
];

export function getDeveloperPhoneConfig(phoneNumber: string) {
  return DEVELOPER_PHONE_CONFIG.find((item) => item.phoneNumber === phoneNumber);
}

