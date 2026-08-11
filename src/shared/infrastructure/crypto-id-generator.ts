import type { IdGenerator } from '@/shared/application/ports/id-generator';

/**
 * Adapter — UUID v4 from the Web Crypto API.
 *
 * `crypto.randomUUID` is available in the Node.js and Edge runtimes Next.js
 * targets, so the adapter works unchanged on Vercel functions and locally.
 */
export class CryptoIdGenerator implements IdGenerator {
  generate(): string {
    return crypto.randomUUID();
  }
}
