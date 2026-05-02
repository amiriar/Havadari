import * as path from 'path';

// image extensions
export const imageExtensions = [
  'image/jpg',
  'image/png',
  'image/jpeg',
  'image/jfif',
  'image/svg+xml',
  'image/webp',
];

export const videoExtentions = [
  'video/mpeg',
  'video/mp4',
  'video/mkv',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
];

export const documentExtentions = [
  'application/msword',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpg',
  'image/png',
  'image/jpeg',
  'image/jfif',
  'image/svg+xml',
  'image/webp',
];

export const excelExtenstions = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.ms-excel.sheet.macroEnabled.12',
  'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
  'application/vnd.ms-excel.template.macroEnabled.12',
  'application/vnd.ms-excel.sheet.template.macroenabled.12',
  'text/csv',
];

export const compressedExtensions = [
  'application/vnd.rar',
  'application/zip',
  'application/x-zip-compressed',
];

export const audioExtensions = [
  'audio/aac',
  'audio/midi',
  'audio/x-midi',
  'audio/ogg',
  'audio/webm',
  'audio/mpeg',
];

export const BASE_UPLOAD_PATH = path.join(process.cwd(), 'uploads');
export const UPLOADS_PUBLIC_PREFIX = '/uploads';
export const IMAGES_DIRECTORY = 'images';
export const DOCS_DIRECTORY = 'documents';
export const VIDEOS_DIRECTORY = 'videos';
export const EXCEL_DIRECTORY = 'excels';
export const PUBLIC_FILES_DIRECTORY = 'public';

//jwt expiration time
export const JWT_EXPIRE_TIME = '1h';

//refresh token expire time
export const REFRESH_TOKEN_EXPIRE_TIME = '30d';

//OTP expire time in seconds
export const otpExpireTime = 180;

//view refresh expire time in seconds
export const REFRESH_VIEW_EXPIRE_TIME = 3600 * 2;

export const ONE_HOUR_IN_MS = 60 * 60 * 1000;

export const CACHED_ROLES = 'CACHED_ROLES';
