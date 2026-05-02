import { Request } from 'express';

export function getToken(req: Request): string {
  const authHeader: string = req.headers.authorization;

  if (!authHeader) return null;

  const auth: string[] = authHeader.split(' ');

  return auth[1];
}
