import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Regex to check if a string is an integer (positive or negative)
const INTEGER_PATTERN = /^-?\d+$/;

// Safe integer boundaries for JavaScript numbers
const MIN_SAFE = BigInt(Number.MIN_SAFE_INTEGER);
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

// Check if a string represents a safe integer (within JS safe range)
function isSafeIntegerString(str: string): boolean {
  if (!INTEGER_PATTERN.test(str)) return false;
  try {
    const bi = BigInt(str);
    return bi >= MIN_SAFE && bi <= MAX_SAFE;
  } catch {
    return false;
  }
}
// Recursively normalize values: convert bigint/stringified-integers → number
function normalize(value: unknown): any {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string' && isSafeIntegerString(value)) {
    return Number(value);
  }

  if (typeof value === 'bigint') {
    if (value >= MIN_SAFE && value <= MAX_SAFE) return Number(value);
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((v) => normalize(v));
  }

  // Recursively handle objects (plain or class instances)
  if (typeof value === 'object') {
    if (value instanceof Date) {
      return value;
    }
    const out: Record<string, any> = {};
    for (const key in value as Record<string, any>) {
      out[key] = normalize((value as any)[key]);
    }
    return out;
  }

  return value;
}

@Injectable()
export class BigIntToNumberInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => normalize(data)));
  }
}
