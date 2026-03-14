import { describe, it, expect, vi, beforeEach } from 'vitest';
import { randomBytes } from 'crypto';
import { CredentialEncryptionService } from './credential-encryption.service';

const TEST_KEY = randomBytes(32).toString('hex');

function createService(keyOverride?: string): CredentialEncryptionService {
  const mockConfigService = {
    get: vi.fn().mockReturnValue(keyOverride ?? TEST_KEY),
  };
  return new CredentialEncryptionService(mockConfigService as any);
}

describe('CredentialEncryptionService', () => {
  let service: CredentialEncryptionService;

  beforeEach(() => {
    service = createService();
  });

  it('should encrypt and decrypt round-trip', () => {
    const plaintext = 'my-secret-access-token-12345';
    const encrypted = service.encrypt(plaintext);
    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should produce ciphertext different from plaintext', () => {
    const plaintext = 'my-secret-access-token';
    const encrypted = service.encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted).not.toContain(plaintext);
  });

  it('should produce unique IVs per encryption (nonce uniqueness)', () => {
    const plaintext = 'same-value';
    const encrypted1 = service.encrypt(plaintext);
    const encrypted2 = service.encrypt(plaintext);
    expect(encrypted1).not.toBe(encrypted2);
  });

  it('should throw when decrypting with wrong key', () => {
    const service1 = createService(randomBytes(32).toString('hex'));
    const service2 = createService(randomBytes(32).toString('hex'));

    const encrypted = service1.encrypt('secret');
    expect(() => service2.decrypt(encrypted)).toThrow();
  });

  it('should throw when CHANNEL_ENCRYPTION_KEY is missing', () => {
    const mockConfigService = { get: vi.fn().mockReturnValue(undefined) };
    expect(
      () => new CredentialEncryptionService(mockConfigService as any),
    ).toThrow('CHANNEL_ENCRYPTION_KEY environment variable is required');
  });

  it('should throw when key is not 32 bytes', () => {
    expect(() => createService('abcd')).toThrow('must be 32 bytes');
  });

  it('should throw on invalid ciphertext format', () => {
    expect(() => service.decrypt('invalid-format')).toThrow('Invalid encrypted value format');
  });
});
