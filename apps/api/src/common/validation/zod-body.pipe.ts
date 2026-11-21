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
      (errors[key] ??= []).push(issue.message);
    }
    throw AppError.validation(errors);
  }
}
