# Email Service Usage Guide

This guide explains how to use the email service for sending apartment listing notifications.

## Setup

1. Configure your environment variables in `.env.local`:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

2. For Gmail, you'll need to create an App Password:
   - Enable 2-factor authentication on your Gmail account
   - Go to Google Account Settings → Security → App passwords
   - Generate a new app password for "Mail"
   - Use this password as `SMTP_PASS`

## Usage Examples

### Import the service

```typescript
import {
  sendListingNotification,
  sendWelcomeEmail,
  testEmailConnection,
} from '@/lib/notifications';
```

### Test email connection

```typescript
const result = await testEmailConnection();
if (result.success) {
  console.log('Email service is configured correctly');
} else {
  console.error('Email configuration error:', result.error);
}
```

### Send welcome email

```typescript
const result = await sendWelcomeEmail('user@example.com');
if (result.success) {
  console.log('Welcome email sent successfully');
} else {
  console.error('Failed to send welcome email:', result.error);
}
```

### Send listing notifications

```typescript
import { ParsedListing } from '@/lib/types/database.types';

const listings: ParsedListing[] = [
  // ... your listing data
];

const result = await sendListingNotification('user@example.com', listings);
if (result.success) {
  console.log('Listing notification sent successfully');
} else {
  console.error('Failed to send listing notification:', result.error);
}
```

## Testing

Run the email service test script:

```bash
# Test configuration only
npx tsx scripts/manual/test-email-service.ts

# Test with actual email sending
npx tsx scripts/manual/test-email-service.ts your-email@example.com
```

## Email Templates

### Welcome Email Format

- Subject: "Welcome to Burroughs Alert - Your NYC Apartment Search Assistant"
- Plain text format with app instructions

### Listing Notification Format

- Subject: "X New Apartment(s) Found - Burroughs Alert"
- Plain text format with:
  - Listing title and price
  - Bedrooms, neighborhood, pet policy
  - Square footage (if available)
  - Posted date (if available)
  - Direct Craigslist link

## Error Handling

All email functions return a `Promise<EmailResult>` with:

```typescript
interface EmailResult {
  success: boolean;
  messageId?: string; // On success
  error?: string; // On failure
}
```

## Security Notes

- Uses secure SMTP connections (SSL/TLS)
- Credentials are stored in environment variables
- No sensitive data is logged
- Graceful error handling prevents crashes
