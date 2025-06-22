# Burroughs Alert - API Design

## API Overview

**Base URL**: `/api`  
**Content Type**: `application/json`  
**Error Format**: Standard HTTP status codes with JSON error messages

## Authentication

**MVP Approach**: No authentication required  
**Future**: JWT tokens or session-based auth

## Endpoints

### 1. Alert Management

#### POST /api/alerts

**Purpose**: Create a new alert for a user

**Request**:

```typescript
{
  email: string;              // Required: user email
  neighborhoods: string[];    // Required: NYC neighborhoods
  minPrice?: number;          // Optional: minimum rent
  maxPrice?: number;          // Required: maximum rent
  minBedrooms?: number;       // Optional: minimum bedrooms
  maxBedrooms?: number;       // Optional: maximum bedrooms
  petFriendly?: boolean;      // Optional: pet-friendly required
  maxCommuteMinutes?: number; // Optional: max commute time
  commuteDestination?: string; // Optional: work/school address
}
```

**Response Success (201)**:

```typescript
{
  success: true;
  data: {
    alertId: number;
    userId: number;
    message: string;
  }
}
```

**Response Error (400)**:

```typescript
{
  success: false;
  error: {
    code: "VALIDATION_ERROR";
    message: string;
    details?: string[];
  }
}
```

**Validation Rules**:

- Email: Valid email format
- Neighborhoods: At least 1, max 5 valid NYC neighborhoods
- MaxPrice: Required, 500-20000 range
- MinPrice: Optional, must be < maxPrice
- Bedrooms: 0-10 range
- MaxCommute: 1-120 minutes

#### GET /api/alerts/[email]

**Purpose**: Get all alerts for an email address

**Response Success (200)**:

```typescript
{
  success: true;
  data: {
    user: {
      email: string;
      createdAt: string;
    }
    alerts: Array<{
      id: number;
      neighborhoods: string[];
      minPrice: number;
      maxPrice: number;
      minBedrooms: number;
      maxBedrooms: number;
      petFriendly: boolean;
      maxCommuteMinutes: number;
      commuteDestination: string;
      isActive: boolean;
      createdAt: string;
    }>;
  }
}
```

#### DELETE /api/alerts/[id]

**Purpose**: Deactivate an alert

**Response Success (200)**:

```typescript
{
  success: true;
  message: 'Alert deactivated successfully';
}
```

### 2. Unsubscribe Management

#### GET /api/unsubscribe/[token]

**Purpose**: Unsubscribe user from all notifications

**Response Success (200)**:

```typescript
{
  success: true;
  message: 'Successfully unsubscribed from all notifications';
}
```

#### POST /api/unsubscribe

**Purpose**: Unsubscribe via email address

**Request**:

```typescript
{
  email: string;
}
```

**Response Success (200)**:

```typescript
{
  success: true;
  message: 'Successfully unsubscribed';
}
```

### 3. Listings (Read-only)

#### GET /api/listings

**Purpose**: Get recent listings (for testing/admin)

**Query Parameters**:

- `limit`: number (default: 50, max: 200)
- `neighborhood`: string (filter by neighborhood)
- `minPrice`: number
- `maxPrice`: number

**Response Success (200)**:

```typescript
{
  success: true;
  data: {
    listings: Array<{
      id: number;
      title: string;
      price: number;
      bedrooms: number;
      bathrooms: number;
      neighborhood: string;
      address: string;
      petFriendly: boolean;
      listingUrl: string;
      postedAt: string;
      scamScore: number;
    }>;
    total: number;
    page: number;
  }
}
```

#### GET /api/listings/[id]

**Purpose**: Get single listing details

**Response Success (200)**:

```typescript
{
  success: true;
  data: {
    id: number;
    title: string;
    description: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    neighborhood: string;
    address: string;
    latitude: number;
    longitude: number;
    petFriendly: boolean;
    images: string[];
    contactInfo: {
      phone?: string;
      email?: string;
      name?: string;
    };
    listingUrl: string;
    source: string;
    postedAt: string;
    scrapedAt: string;
    scamScore: number;
  }
}
```

### 4. System Health

#### GET /api/health

**Purpose**: System health check

**Response Success (200)**:

```typescript
{
  success: true;
  data: {
    status: 'healthy' | 'degraded' | 'down';
    timestamp: string;
    components: {
      database: 'healthy' | 'error';
      scraper: {
        status: 'running' | 'stopped' | 'error';
        lastRun: string;
        lastSuccess: string;
      }
      notifications: {
        status: 'healthy' | 'error';
        recentlySent: number;
      }
    }
    version: string;
  }
}
```

### 5. Neighborhoods Reference

#### GET /api/neighborhoods

**Purpose**: Get list of valid NYC neighborhoods

**Response Success (200)**:

```typescript
{
  success: true;
  data: {
    neighborhoods: Array<{
      name: string;
      borough: 'Manhattan' | 'Brooklyn' | 'Queens' | 'Bronx' | 'Staten Island';
      popular: boolean;
    }>;
  }
}
```

## Error Handling

### Standard Error Response

```typescript
{
  success: false;
  error: {
    code: string;           // Error code for client handling
    message: string;        // Human-readable error message
    details?: any;          // Additional error details
    timestamp: string;      // ISO timestamp
  }
}
```

### Error Codes

#### Validation Errors (400)

- `VALIDATION_ERROR`: Input validation failed
- `INVALID_EMAIL`: Email format invalid
- `INVALID_NEIGHBORHOOD`: Neighborhood not recognized
- `PRICE_RANGE_ERROR`: Invalid price range
- `REQUIRED_FIELD_MISSING`: Required field not provided

#### Resource Errors (404)

- `ALERT_NOT_FOUND`: Alert ID doesn't exist
- `USER_NOT_FOUND`: Email address not found
- `LISTING_NOT_FOUND`: Listing ID doesn't exist

#### Server Errors (500)

- `DATABASE_ERROR`: Database operation failed
- `EMAIL_SERVICE_ERROR`: Email sending failed
- `SCRAPING_ERROR`: Scraping service unavailable
- `INTERNAL_ERROR`: Unexpected server error

#### Rate Limiting (429)

- `RATE_LIMIT_EXCEEDED`: Too many requests

## Request/Response Examples

### Create Alert Example

**Request**:

```bash
POST /api/alerts
Content-Type: application/json

{
  "email": "john@example.com",
  "neighborhoods": ["Manhattan", "Brooklyn"],
  "maxPrice": 4000,
  "minBedrooms": 1,
  "petFriendly": true,
  "maxCommuteMinutes": 45,
  "commuteDestination": "Times Square, NYC"
}
```

**Success Response**:

```json
{
  "success": true,
  "data": {
    "alertId": 123,
    "userId": 45,
    "message": "Alert created successfully. You will receive notifications when matching apartments are found."
  }
}
```

**Error Response**:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      "neighborhoods must contain at least 1 valid NYC neighborhood",
      "maxPrice must be between 500 and 20000"
    ],
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## API Implementation Notes

### Input Validation

```typescript
// Zod schema for alert creation
const CreateAlertSchema = z.object({
  email: z.string().email(),
  neighborhoods: z.array(z.string()).min(1).max(5),
  minPrice: z.number().min(500).max(20000).optional(),
  maxPrice: z.number().min(500).max(20000),
  minBedrooms: z.number().min(0).max(10).optional(),
  maxBedrooms: z.number().min(0).max(10).optional(),
  petFriendly: z.boolean().optional(),
  maxCommuteMinutes: z.number().min(1).max(120).optional(),
  commuteDestination: z.string().max(500).optional(),
});
```

### Database Integration

```typescript
// Example API route handler
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = CreateAlertSchema.parse(body);

    // Create or get user
    const user = await createOrGetUser(validatedData.email);

    // Create alert
    const alert = await createAlert(user.id, validatedData);

    return NextResponse.json(
      {
        success: true,
        data: {
          alertId: alert.id,
          userId: user.id,
          message: 'Alert created successfully',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Rate Limiting

```typescript
// Simple in-memory rate limiting for MVP
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(
  ip: string,
  limit: number = 10,
  windowMs: number = 60000
) {
  const now = Date.now();
  const userLimit = rateLimiter.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimiter.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userLimit.count >= limit) {
    return false;
  }

  userLimit.count++;
  return true;
}
```

### CORS Configuration

```typescript
// Next.js API route CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin':
    process.env.NODE_ENV === 'development' ? '*' : 'https://burroughsalert.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

## Testing Strategy

### Unit Tests

- Input validation functions
- Database query functions
- Error handling utilities
- Business logic functions

### Integration Tests

- Full API endpoint tests
- Database integration tests
- Email service integration tests

### API Testing Tools

- Jest for unit/integration tests
- Postman/Insomnia for manual testing
- Automated API testing in CI/CD pipeline
