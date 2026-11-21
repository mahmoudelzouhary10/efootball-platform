import { registerSchema } from '@efp/contracts';
import { describe, expect, it } from 'vitest';
import { AppError } from '../errors/app-error';
import { ZodPipe } from './zod-body.pipe';

function errorsFor(body: unknown): Record<string, string[]> {
  try {
    new ZodPipe(registerSchema).transform(body);
  } catch (e) {
    return (e as AppError).errors!;
  }
  throw new Error('expected validation to fail');
}

describe('ZodPipe', () => {
  it('maps built-in checks to stable reason keys', () => {
    const errors = errorsFor({ email: 'nope', username: 'ab', password: 'short' });
    expect(errors.email).toEqual(['invalid']);
    expect(errors.username).toEqual(['too_short']);
    expect(errors.password).toEqual(['too_short']);
  });

  it('keeps custom schema reasons', () => {
    const errors = errorsFor({ email: 'a@b.co', username: 'admin', password: 'long enough pw' });
    expect(errors.username).toEqual(['username_reserved']);
  });

  it('reports unknown fields at the root', () => {
    const errors = errorsFor({
      email: 'a@b.co',
      username: 'okname',
      password: 'long enough pw',
      x: 1,
    });
    expect(errors._root).toEqual(['unknown_field']);
  });
});
