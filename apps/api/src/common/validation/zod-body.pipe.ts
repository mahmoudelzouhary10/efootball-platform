import { PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';
import { AppError } from '../errors/app-error';

/** Validates and parses a request body (or query) with a Zod schema; unknown keys are rejected by strict schemas. */
export class ZodPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value ?? {});
    if (result.success) return result.data;
    const errors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.length ? issue.path.join('.') : '_root';
      (errors[key] ??= []).push(reasonOf(issue));
    }
    throw AppError.validation(errors);
  }
}

/**
 * Stable, translatable reason keys instead of Zod's English messages.
 * Schemas set custom keys (e.g. "username_reserved"); built-in checks are mapped by issue code.
 */
function reasonOf(issue: { code: string; message: string }): string {
  if (/^[a-z][a-z_]*$/.test(issue.message)) return issue.message;
  switch (issue.code) {
    case 'too_small':
      return 'too_short';
    case 'too_big':
      return 'too_long';
    case 'unrecognized_keys':
      return 'unknown_field';
    default:
      return 'invalid';
  }
}
