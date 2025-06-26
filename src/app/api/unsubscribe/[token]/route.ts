/**
 * API Route: /api/unsubscribe/[token]
 * Purpose: CAN-SPAM compliant one-click email unsubscribe with secure token validation
 * Status: Fully implemented ✅ DONE (GET confirmation page, POST process unsubscribe)
 * Operations: Token validation, user/alerts deactivation with transactions, HTML response pages
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, withTransaction } from '@/lib/database';
import { schema } from '@/lib/database/schema';
import { eq, and } from 'drizzle-orm';

// ================================
// Types and Interfaces
// ================================

interface UnsubscribePageData {
  status: 'valid' | 'invalid' | 'already_unsubscribed';
  email?: string;
  alertCount?: number;
  message: string;
}

interface UnsubscribeResult {
  success: boolean;
  message: string;
  details?: {
    email: string;
    deactivatedAlerts: number;
    timestamp: string;
  };
}

// ================================
// Token Validation Functions
// ================================

/**
 * Validate unsubscribe token format
 */
const isValidTokenFormat = (token: string): boolean => {
  // Basic validation: non-empty string with reasonable length
  return typeof token === 'string' && token.length > 0 && token.length <= 255;
};

/**
 * Find user by unsubscribe token
 */
const findUserByToken = async (token: string) => {
  const db = getDatabase();

  try {
    const user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.unsubscribe_token, token))
      .limit(1)
      .then((results) => results[0] || null);

    return user;
  } catch (error) {
    console.error('Database error finding user by token:', error);
    return null;
  }
};

/**
 * Get user alerts count
 */
const getUserAlertsCount = async (userId: number): Promise<number> => {
  const db = getDatabase();

  try {
    const alerts = await db
      .select()
      .from(schema.alerts)
      .where(
        and(
          eq(schema.alerts.user_id, userId),
          eq(schema.alerts.is_active, true)
        )
      );

    return alerts.length;
  } catch (error) {
    console.error('Database error counting user alerts:', error);
    return 0;
  }
};

// ================================
// Unsubscribe Processing Functions
// ================================

/**
 * Process unsubscribe request with database transaction
 */
const processUnsubscribe = async (
  token: string
): Promise<UnsubscribeResult> => {
  try {
    const result = await withTransaction(async (db) => {
      // Find user by token
      const user = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.unsubscribe_token, token))
        .limit(1)
        .then((results) => results[0] || null);

      if (!user) {
        return {
          success: false,
          message: 'Invalid or expired unsubscribe token.',
        };
      }

      if (!user.is_active) {
        return {
          success: false,
          message: 'You have already been unsubscribed from all notifications.',
        };
      }

      // Count active alerts before deactivation
      const activeAlerts = await db
        .select()
        .from(schema.alerts)
        .where(
          and(
            eq(schema.alerts.user_id, user.id),
            eq(schema.alerts.is_active, true)
          )
        );

      const alertCount = activeAlerts.length;

      // Deactivate user account
      await db
        .update(schema.users)
        .set({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .where(eq(schema.users.id, user.id));

      // Deactivate all user alerts
      if (alertCount > 0) {
        await db
          .update(schema.alerts)
          .set({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .where(eq(schema.alerts.user_id, user.id));
      }

      // Log the unsubscribe action
      console.log(
        `User unsubscribed: ${user.email} (${alertCount} alerts deactivated)`
      );

      return {
        success: true,
        message:
          'You have been successfully unsubscribed from all apartment alerts.',
        details: {
          email: user.email,
          deactivatedAlerts: alertCount,
          timestamp: new Date().toISOString(),
        },
      };
    });

    return result;
  } catch (error) {
    console.error('Unsubscribe processing error:', error);
    return {
      success: false,
      message:
        'An error occurred while processing your unsubscribe request. Please try again.',
    };
  }
};

// ================================
// HTML Response Generation
// ================================

/**
 * Generate unsubscribe confirmation page HTML
 */
const generateUnsubscribePageHTML = (
  data: UnsubscribePageData,
  token: string
): string => {
  const isValid = data.status === 'valid';
  const pageTitle = isValid ? 'Confirm Unsubscribe' : 'Unsubscribe Status';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle} - Burroughs Alert</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8fafc;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: #1e40af;
            color: white;
            padding: 24px;
            text-align: center;
        }
        .header h1 {
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 32px 24px;
        }
        .status-message {
            margin-bottom: 24px;
            padding: 16px;
            border-radius: 6px;
            font-size: 16px;
        }
        .status-valid {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            color: #92400e;
        }
        .status-invalid {
            background: #fee2e2;
            border: 1px solid #ef4444;
            color: #dc2626;
        }
        .status-already {
            background: #e0e7ff;
            border: 1px solid #6366f1;
            color: #4338ca;
        }
        .user-info {
            background: #f1f5f9;
            padding: 16px;
            border-radius: 6px;
            margin-bottom: 24px;
        }
        .user-info p {
            margin-bottom: 8px;
        }
        .user-info strong {
            color: #1e40af;
        }
        .action-section {
            text-align: center;
            margin-top: 24px;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            font-size: 16px;
            font-weight: 600;
            text-decoration: none;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            margin: 8px;
            transition: all 0.2s;
        }
        .btn-danger {
            background: #dc2626;
            color: white;
        }
        .btn-danger:hover {
            background: #b91c1c;
        }
        .btn-secondary {
            background: #64748b;
            color: white;
        }
        .btn-secondary:hover {
            background: #475569;
        }
        .footer {
            border-top: 1px solid #e2e8f0;
            padding: 20px 24px;
            text-align: center;
            color: #64748b;
            font-size: 14px;
        }
        .footer a {
            color: #1e40af;
            text-decoration: none;
        }
        form {
            display: inline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏠 Burroughs Alert</h1>
            <p>NYC Apartment Notification Service</p>
        </div>
        
        <div class="content">
            <div class="status-message status-${data.status === 'valid' ? 'valid' : data.status === 'already_unsubscribed' ? 'already' : 'invalid'}">
                ${data.message}
            </div>
            
            ${
              isValid && data.email
                ? `
                <div class="user-info">
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Active Alerts:</strong> ${data.alertCount || 0}</p>
                    <p><strong>Action:</strong> All alerts will be deactivated and you will stop receiving emails immediately.</p>
                </div>
                
                <div class="action-section">
                    <p style="margin-bottom: 16px; font-size: 16px;">
                        Are you sure you want to unsubscribe from all apartment alerts?
                    </p>
                    
                    <form method="POST" style="display: inline;">
                        <button type="submit" class="btn btn-danger">
                            Yes, Unsubscribe Me
                        </button>
                    </form>
                    
                    <a href="/" class="btn btn-secondary">
                        Cancel
                    </a>
                </div>
            `
                : ''
            }
            
            ${
              !isValid
                ? `
                <div class="action-section">
                    <a href="/" class="btn btn-secondary">
                        Return to Homepage
                    </a>
                </div>
            `
                : ''
            }
        </div>
        
        <div class="footer">
            <p>
                <strong>Burroughs Alert</strong> - Find your next apartment in NYC<br>
                Questions? Contact us at <a href="mailto:support@burroughsalert.com">support@burroughsalert.com</a>
            </p>
        </div>
    </div>
</body>
</html>`;
};

/**
 * Generate unsubscribe success page HTML
 */
const generateSuccessPageHTML = (result: UnsubscribeResult): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unsubscribe Successful - Burroughs Alert</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8fafc;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: ${result.success ? '#059669' : '#dc2626'};
            color: white;
            padding: 24px;
            text-align: center;
        }
        .header h1 {
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 32px 24px;
            text-align: center;
        }
        .success-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }
        .message {
            font-size: 18px;
            margin-bottom: 24px;
            color: #374151;
        }
        .details {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 24px;
            text-align: left;
        }
        .details p {
            margin-bottom: 8px;
        }
        .details strong {
            color: #1e40af;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            font-size: 16px;
            font-weight: 600;
            text-decoration: none;
            border-radius: 6px;
            background: #64748b;
            color: white;
            transition: all 0.2s;
        }
        .btn:hover {
            background: #475569;
        }
        .footer {
            border-top: 1px solid #e2e8f0;
            padding: 20px 24px;
            text-align: center;
            color: #64748b;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏠 Burroughs Alert</h1>
            <p>${result.success ? 'Unsubscribe Successful' : 'Unsubscribe Failed'}</p>
        </div>
        
        <div class="content">
            <div class="success-icon">
                ${result.success ? '✅' : '❌'}
            </div>
            
            <div class="message">
                ${result.message}
            </div>
            
            ${
              result.success && result.details
                ? `
                <div class="details">
                    <p><strong>Email:</strong> ${result.details.email}</p>
                    <p><strong>Alerts Deactivated:</strong> ${result.details.deactivatedAlerts}</p>
                    <p><strong>Date:</strong> ${new Date(result.details.timestamp).toLocaleString()}</p>
                </div>
                
                <p style="margin-bottom: 24px; color: #64748b;">
                    You will no longer receive apartment alert emails. 
                    If you change your mind, you can create a new alert anytime by visiting our homepage.
                </p>
            `
                : ''
            }
            
            <a href="/" class="btn">
                Return to Homepage
            </a>
        </div>
        
        <div class="footer">
            <p>
                <strong>Burroughs Alert</strong> - Find your next apartment in NYC
            </p>
        </div>
    </div>
</body>
</html>`;
};

// ================================
// API Route Handlers
// ================================

/**
 * GET /api/unsubscribe/[token]
 * Display unsubscribe confirmation page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
): Promise<NextResponse> {
  const { token } = params;

  try {
    // Validate token format
    if (!isValidTokenFormat(token)) {
      const pageData: UnsubscribePageData = {
        status: 'invalid',
        message:
          'Invalid unsubscribe link. Please check the link in your email or contact support.',
      };

      return new NextResponse(generateUnsubscribePageHTML(pageData, token), {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Find user by token
    const user = await findUserByToken(token);

    if (!user) {
      const pageData: UnsubscribePageData = {
        status: 'invalid',
        message:
          'Invalid or expired unsubscribe token. Please check the link in your email or contact support if you continue to receive emails.',
      };

      return new NextResponse(generateUnsubscribePageHTML(pageData, token), {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Check if user is already unsubscribed
    if (!user.is_active) {
      const pageData: UnsubscribePageData = {
        status: 'already_unsubscribed',
        message:
          'You have already been unsubscribed from all apartment alerts. You will not receive any further emails.',
      };

      return new NextResponse(generateUnsubscribePageHTML(pageData, token), {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Get user's active alerts count
    const alertCount = await getUserAlertsCount(user.id);

    // Show confirmation page
    const pageData: UnsubscribePageData = {
      status: 'valid',
      email: user.email,
      alertCount,
      message:
        'Please confirm that you want to unsubscribe from all apartment alerts.',
    };

    return new NextResponse(generateUnsubscribePageHTML(pageData, token), {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Unsubscribe GET error:', error);

    const pageData: UnsubscribePageData = {
      status: 'invalid',
      message:
        'An error occurred while processing your request. Please try again later or contact support.',
    };

    return new NextResponse(generateUnsubscribePageHTML(pageData, token), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

/**
 * POST /api/unsubscribe/[token]
 * Process unsubscribe request
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
): Promise<NextResponse> {
  const { token } = params;

  try {
    // Validate token format
    if (!isValidTokenFormat(token)) {
      const result: UnsubscribeResult = {
        success: false,
        message: 'Invalid unsubscribe token.',
      };

      return new NextResponse(generateSuccessPageHTML(result), {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Process unsubscribe
    const result = await processUnsubscribe(token);

    // Return success or error page
    const statusCode = result.success
      ? 200
      : result.message.includes('Invalid')
        ? 404
        : 500;

    return new NextResponse(generateSuccessPageHTML(result), {
      status: statusCode,
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Unsubscribe POST error:', error);

    const result: UnsubscribeResult = {
      success: false,
      message:
        'An unexpected error occurred while processing your unsubscribe request. Please try again.',
    };

    return new NextResponse(generateSuccessPageHTML(result), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

// ================================
// Method Not Allowed Handlers
// ================================

/**
 * Handle unsupported HTTP methods
 */
export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PATCH() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
