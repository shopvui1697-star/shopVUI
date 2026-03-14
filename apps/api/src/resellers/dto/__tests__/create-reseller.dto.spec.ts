import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateResellerDto, LoginDto } from '../create-reseller.dto';

describe('CreateResellerDto', () => {
  it('passes with valid data', async () => {
    const dto = plainToInstance(CreateResellerDto, {
      name: 'Test Reseller',
      email: 'test@example.com',
      password: 'password123',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails when password is too short', async () => {
    const dto = plainToInstance(CreateResellerDto, {
      name: 'Test',
      email: 'test@example.com',
      password: 'abc',
    });
    const errors = await validate(dto);
    const passwordError = errors.find((e) => e.property === 'password');
    expect(passwordError).toBeDefined();
    expect(passwordError!.constraints).toHaveProperty('minLength');
  });

  it('fails when email is invalid', async () => {
    const dto = plainToInstance(CreateResellerDto, {
      name: 'Test',
      email: 'not-an-email',
      password: 'password123',
    });
    const errors = await validate(dto);
    const emailError = errors.find((e) => e.property === 'email');
    expect(emailError).toBeDefined();
    expect(emailError!.constraints).toHaveProperty('isEmail');
  });

  it('fails when required fields are missing', async () => {
    const dto = plainToInstance(CreateResellerDto, {});
    const errors = await validate(dto);
    const properties = errors.map((e) => e.property);
    expect(properties).toContain('name');
    expect(properties).toContain('email');
    expect(properties).toContain('password');
  });
});

describe('LoginDto', () => {
  it('passes with valid data', async () => {
    const dto = plainToInstance(LoginDto, {
      email: 'test@example.com',
      password: 'password123',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails when email is invalid', async () => {
    const dto = plainToInstance(LoginDto, {
      email: 'notEmail',
      password: 'password123',
    });
    const errors = await validate(dto);
    const emailError = errors.find((e) => e.property === 'email');
    expect(emailError).toBeDefined();
  });
});
