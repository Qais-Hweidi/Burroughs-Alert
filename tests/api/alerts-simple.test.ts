import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '../../src/app/api/alerts/route';
import {
  VALIDATION_LIMITS,
  ERROR_CODES,
  HTTP_STATUS,
} from '../../src/lib/utils/constants';

// Mock the database module
vi.mock('../../src/lib/database', () => ({
  getDatabase: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => []),
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => []),
          })),
        })),
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => []),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => [{ id: 1, email: 'test@example.com' }]),
      })),
    })),
  })),
}));

describe('/api/alerts - Simple Tests', () => {
  describe('POST /api/alerts - Basic Validation', () => {
    it('should reject request with missing required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/alerts', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(body.error).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should reject invalid email format', async () => {
      const request = new NextRequest('http://localhost:3000/api/alerts', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
          neighborhoods: ['Upper East Side'],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(body.error).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(body.details[0].message).toContain('email');
    });

    it('should reject empty neighborhoods array', async () => {
      const request = new NextRequest('http://localhost:3000/api/alerts', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          neighborhoods: [],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(body.error).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(body.details[0].message).toContain(
        'At least one neighborhood must be selected'
      );
    });

    it('should reject invalid neighborhoods', async () => {
      const request = new NextRequest('http://localhost:3000/api/alerts', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          neighborhoods: ['Invalid Neighborhood'],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(body.error).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(body.details[0].message).toContain('neighborhoods are invalid');
    });

    it('should reject price range validation errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/alerts', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          neighborhoods: ['Upper East Side'],
          min_price: VALIDATION_LIMITS.price.min - 100,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(body.error).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should reject when min_price > max_price', async () => {
      const request = new NextRequest('http://localhost:3000/api/alerts', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          neighborhoods: ['Upper East Side'],
          min_price: 3000,
          max_price: 2000,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(body.error).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(body.details[0].message).toContain(
        'Minimum price must be less than or equal to maximum price'
      );
    });

    it('should reject bedroom count validation errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/alerts', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          neighborhoods: ['Upper East Side'],
          bedrooms: VALIDATION_LIMITS.bedrooms.max + 1,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(body.error).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should reject commute destination without max_commute_minutes', async () => {
      const request = new NextRequest('http://localhost:3000/api/alerts', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          neighborhoods: ['Upper East Side'],
          commute_destination: 'Times Square',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(body.error).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(body.details[0].message).toContain(
        'Maximum commute time is required'
      );
    });

    it('should reject commute time above maximum', async () => {
      const request = new NextRequest('http://localhost:3000/api/alerts', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          neighborhoods: ['Upper East Side'],
          max_commute_minutes: VALIDATION_LIMITS.commute.maxMinutes + 10,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(body.error).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('GET /api/alerts - Basic Validation', () => {
    it('should reject invalid email format in query', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/alerts?email=invalid-email'
      );

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(body.error).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(body.details[0].message).toContain('email');
    });

    it('should reject invalid token length in query', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/alerts?token=invalid-short-token'
      );

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(body.error).toBe(ERROR_CODES.VALIDATION_ERROR);
      // Should validate token length since only token is provided
      const tokenError = body.details.find((d: any) =>
        d.message.includes('Token must be exactly')
      );
      expect(tokenError).toBeDefined();
    });

    it('should return general alerts when no specific parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/alerts');

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(body.success).toBe(true);
      expect(body.alerts).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle non-integer price values', async () => {
      const request = new NextRequest('http://localhost:3000/api/alerts', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          neighborhoods: ['Upper East Side'],
          min_price: 'not-a-number',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(body.error).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should handle non-boolean pet_friendly values', async () => {
      const request = new NextRequest('http://localhost:3000/api/alerts', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          neighborhoods: ['Upper East Side'],
          pet_friendly: 'not-a-boolean',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(body.error).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should handle very long email addresses', async () => {
      const longEmail =
        'a'.repeat(VALIDATION_LIMITS.email.maxLength + 1) + '@example.com';
      const request = new NextRequest('http://localhost:3000/api/alerts', {
        method: 'POST',
        body: JSON.stringify({
          email: longEmail,
          neighborhoods: ['Upper East Side'],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(body.error).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should handle very long commute destination', async () => {
      const longDestination = 'a'.repeat(
        VALIDATION_LIMITS.text.commuteDestination + 1
      );
      const request = new NextRequest('http://localhost:3000/api/alerts', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          neighborhoods: ['Upper East Side'],
          commute_destination: longDestination,
          max_commute_minutes: 30,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(body.error).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });
});
