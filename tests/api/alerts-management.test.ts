import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '../../src/app/api/alerts/[id]/route';
import {
  VALIDATION_LIMITS,
  ERROR_CODES,
  HTTP_STATUS,
} from '../../src/lib/utils/constants';

// Mock the database module
const mockAlert = {
  id: 1,
  user_id: 1,
  neighborhoods: '["Upper East Side", "Brooklyn Heights"]',
  min_price: 2000,
  max_price: 4000,
  bedrooms: 1,
  pet_friendly: true,
  max_commute_minutes: 30,
  commute_destination: 'Times Square',
  commute_destination_place_id: null,
  commute_destination_lat: 40.7580,
  commute_destination_lng: -73.9855,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockUser = {
  id: 1,
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  is_active: true,
  unsubscribe_token: 'token123',
};

const mockDb = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      leftJoin: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => [
            {
              alert_id: mockAlert.id,
              user_id: mockAlert.user_id,
              user_email: mockUser.email,
              is_active: mockAlert.is_active,
              neighborhoods: mockAlert.neighborhoods,
              min_price: mockAlert.min_price,
              max_price: mockAlert.max_price,
              bedrooms: mockAlert.bedrooms,
              pet_friendly: mockAlert.pet_friendly,
              max_commute_minutes: mockAlert.max_commute_minutes,
              commute_destination: mockAlert.commute_destination,
              commute_destination_lat: mockAlert.commute_destination_lat,
              commute_destination_lng: mockAlert.commute_destination_lng,
              created_at: mockAlert.created_at,
            },
          ]),
        })),
      })),
    })),
  })),
  update: vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => [mockAlert]),
      })),
    })),
  })),
};

vi.mock('../../src/lib/database', () => ({
  getDatabase: vi.fn(() => mockDb),
}));

describe('/api/alerts/[id] - Alert Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PUT /api/alerts/[id] - Update Alert', () => {
    it('should successfully update an alert', async () => {
      const alertId = '1';
      const updateData = {
        email: 'test@example.com',
        neighborhoods: ['Chelsea', 'SoHo'],
        min_price: 2500,
        max_price: 4500,
        bedrooms: 2,
        pet_friendly: false,
        max_commute_minutes: 45,
        commute_destination: 'Union Square',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/alerts/${alertId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await PUT(request, { params: Promise.resolve({ id: alertId }) });
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(body.success).toBe(true);
      expect(body.alert).toBeDefined();
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should reject update with invalid alert ID', async () => {
      const alertId = 'invalid';
      const updateData = {
        email: 'test@example.com',
        neighborhoods: ['Chelsea'],
      };

      const request = new NextRequest(
        `http://localhost:3000/api/alerts/${alertId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await PUT(request, { params: Promise.resolve({ id: alertId }) });
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(body.error).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(body.message).toContain('Invalid alert ID');
    });

    it('should reject update with missing email', async () => {
      const alertId = '1';
      const updateData = {
        neighborhoods: ['Chelsea'],
      };

      const request = new NextRequest(
        `http://localhost:3000/api/alerts/${alertId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await PUT(request, { params: Promise.resolve({ id: alertId }) });
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(body.error).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should reject update with invalid email format', async () => {
      const alertId = '1';
      const updateData = {
        email: 'invalid-email',
        neighborhoods: ['Chelsea'],
      };

      const request = new NextRequest(
        `http://localhost:3000/api/alerts/${alertId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await PUT(request, { params: Promise.resolve({ id: alertId }) });
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(body.error).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should reject update when user does not own alert', async () => {
      const alertId = '1';
      const updateData = {
        email: 'different@example.com',
        neighborhoods: ['Chelsea'],
      };

      const request = new NextRequest(
        `http://localhost:3000/api/alerts/${alertId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await PUT(request, { params: Promise.resolve({ id: alertId }) });
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(body.message).toContain('You can only update your own alerts');
    });

    it('should reject update with invalid price range', async () => {
      const alertId = '1';
      const updateData = {
        email: 'test@example.com',
        neighborhoods: ['Chelsea'],
        min_price: 4000,
        max_price: 3000, // max < min
      };

      const request = new NextRequest(
        `http://localhost:3000/api/alerts/${alertId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await PUT(request, { params: Promise.resolve({ id: alertId }) });
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(body.error).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should reject update with invalid neighborhoods', async () => {
      const alertId = '1';
      const updateData = {
        email: 'test@example.com',
        neighborhoods: ['Invalid Neighborhood'],
      };

      const request = new NextRequest(
        `http://localhost:3000/api/alerts/${alertId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await PUT(request, { params: Promise.resolve({ id: alertId }) });
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(body.error).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should reject update with commute destination but no time limit', async () => {
      const alertId = '1';
      const updateData = {
        email: 'test@example.com',
        neighborhoods: ['Chelsea'],
        commute_destination: 'Times Square',
        // Missing max_commute_minutes
      };

      const request = new NextRequest(
        `http://localhost:3000/api/alerts/${alertId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await PUT(request, { params: Promise.resolve({ id: alertId }) });
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(body.error).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should handle alert not found', async () => {
      // Mock database to return no results
      mockDb.select.mockReturnValueOnce({
        from: vi.fn(() => ({
          leftJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn(() => []), // No results
            })),
          })),
        })),
      });

      const alertId = '999';
      const updateData = {
        email: 'test@example.com',
        neighborhoods: ['Chelsea'],
      };

      const request = new NextRequest(
        `http://localhost:3000/api/alerts/${alertId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await PUT(request, { params: Promise.resolve({ id: alertId }) });
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(body.message).toContain('Alert not found');
    });

    it('should reject update of inactive alert', async () => {
      // Mock inactive alert
      mockDb.select.mockReturnValueOnce({
        from: vi.fn(() => ({
          leftJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn(() => [
                {
                  ...mockAlert,
                  is_active: false,
                  user_email: 'test@example.com',
                },
              ]),
            })),
          })),
        })),
      });

      const alertId = '1';
      const updateData = {
        email: 'test@example.com',
        neighborhoods: ['Chelsea'],
      };

      const request = new NextRequest(
        `http://localhost:3000/api/alerts/${alertId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await PUT(request, { params: Promise.resolve({ id: alertId }) });
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(body.message).toContain('Cannot update inactive alert');
    });
  });

  describe('DELETE /api/alerts/[id] - Delete Alert', () => {
    it('should successfully delete an alert', async () => {
      const alertId = '1';
      const deleteData = {
        email: 'test@example.com',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/alerts/${alertId}`,
        {
          method: 'DELETE',
          body: JSON.stringify(deleteData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await DELETE(request, { params: Promise.resolve({ id: alertId }) });
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(body.success).toBe(true);
      expect(body.message).toContain('deleted successfully');
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should reject delete with invalid alert ID', async () => {
      const alertId = 'invalid';
      const deleteData = {
        email: 'test@example.com',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/alerts/${alertId}`,
        {
          method: 'DELETE',
          body: JSON.stringify(deleteData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await DELETE(request, { params: Promise.resolve({ id: alertId }) });
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(body.error).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(body.message).toContain('Invalid alert ID');
    });

    it('should reject delete with missing email', async () => {
      const alertId = '1';
      const deleteData = {};

      const request = new NextRequest(
        `http://localhost:3000/api/alerts/${alertId}`,
        {
          method: 'DELETE',
          body: JSON.stringify(deleteData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await DELETE(request, { params: Promise.resolve({ id: alertId }) });
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(body.error).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should reject delete with invalid email format', async () => {
      const alertId = '1';
      const deleteData = {
        email: 'invalid-email',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/alerts/${alertId}`,
        {
          method: 'DELETE',
          body: JSON.stringify(deleteData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await DELETE(request, { params: Promise.resolve({ id: alertId }) });
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(body.error).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should reject delete when user does not own alert', async () => {
      const alertId = '1';
      const deleteData = {
        email: 'different@example.com',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/alerts/${alertId}`,
        {
          method: 'DELETE',
          body: JSON.stringify(deleteData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await DELETE(request, { params: Promise.resolve({ id: alertId }) });
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(body.message).toContain('You can only delete your own alerts');
    });

    it('should handle alert not found for delete', async () => {
      // Mock database to return no results
      mockDb.select.mockReturnValueOnce({
        from: vi.fn(() => ({
          leftJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn(() => []), // No results
            })),
          })),
        })),
      });

      const alertId = '999';
      const deleteData = {
        email: 'test@example.com',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/alerts/${alertId}`,
        {
          method: 'DELETE',
          body: JSON.stringify(deleteData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await DELETE(request, { params: Promise.resolve({ id: alertId }) });
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(body.message).toContain('Alert not found');
    });

    it('should reject delete of already inactive alert', async () => {
      // Mock inactive alert
      mockDb.select.mockReturnValueOnce({
        from: vi.fn(() => ({
          leftJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn(() => [
                {
                  ...mockAlert,
                  is_active: false,
                  user_email: 'test@example.com',
                },
              ]),
            })),
          })),
        })),
      });

      const alertId = '1';
      const deleteData = {
        email: 'test@example.com',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/alerts/${alertId}`,
        {
          method: 'DELETE',
          body: JSON.stringify(deleteData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await DELETE(request, { params: Promise.resolve({ id: alertId }) });
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(body.message).toContain('Alert is already inactive');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed JSON in PUT request', async () => {
      const alertId = '1';

      const request = new NextRequest(
        `http://localhost:3000/api/alerts/${alertId}`,
        {
          method: 'PUT',
          body: 'invalid-json',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await PUT(request, { params: Promise.resolve({ id: alertId }) });
      
      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    });

    it('should handle database errors gracefully in PUT', async () => {
      // Mock database error
      mockDb.select.mockImplementationOnce(() => {
        throw new Error('Database connection failed');
      });

      const alertId = '1';
      const updateData = {
        email: 'test@example.com',
        neighborhoods: ['Chelsea'],
      };

      const request = new NextRequest(
        `http://localhost:3000/api/alerts/${alertId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await PUT(request, { params: Promise.resolve({ id: alertId }) });
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(body.error).toBe(ERROR_CODES.DATABASE_ERROR);
    });

    it('should handle database errors gracefully in DELETE', async () => {
      // Mock database error
      mockDb.select.mockImplementationOnce(() => {
        throw new Error('Database connection failed');
      });

      const alertId = '1';
      const deleteData = {
        email: 'test@example.com',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/alerts/${alertId}`,
        {
          method: 'DELETE',
          body: JSON.stringify(deleteData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await DELETE(request, { params: Promise.resolve({ id: alertId }) });
      const body = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(body.error).toBe(ERROR_CODES.DATABASE_ERROR);
    });
  });
});