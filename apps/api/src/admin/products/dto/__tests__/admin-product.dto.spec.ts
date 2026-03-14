import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateProductDto } from '../admin-product.dto';

describe('CreateProductDto', () => {
  it('passes with valid data', async () => {
    const dto = plainToInstance(CreateProductDto, {
      name: 'Test Product',
      description: 'A test product',
      basePrice: 10000,
      categoryId: 'cat-123',
      stockQuantity: 50,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails when name is empty', async () => {
    const dto = plainToInstance(CreateProductDto, {
      name: '',
      description: 'A test product',
      basePrice: 10000,
      categoryId: 'cat-123',
      stockQuantity: 50,
    });
    const errors = await validate(dto);
    const nameError = errors.find((e) => e.property === 'name');
    expect(nameError).toBeDefined();
  });

  it('fails when basePrice is negative', async () => {
    const dto = plainToInstance(CreateProductDto, {
      name: 'Test',
      description: 'desc',
      basePrice: -100,
      categoryId: 'cat-123',
      stockQuantity: 50,
    });
    const errors = await validate(dto);
    const priceError = errors.find((e) => e.property === 'basePrice');
    expect(priceError).toBeDefined();
    expect(priceError!.constraints).toHaveProperty('min');
  });

  it('fails when required fields are missing', async () => {
    const dto = plainToInstance(CreateProductDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThanOrEqual(4);
  });
});
