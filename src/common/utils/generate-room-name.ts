import { RoomTypes } from '@common/constants/websocket-room-types';
import { ApplicationMainRoles } from '@common/enums/application-main-roles.enum';

export function generateRoomName(
  roomType: RoomTypes,
  role: ApplicationMainRoles | string,
  id: string,
) {
  return roomType.concat('_', role, '-', id);
}
