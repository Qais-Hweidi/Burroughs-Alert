/**
 * Email Notification Service - Handles all email communications for apartment alerts
 * Status: Implemented - Basic email functionality with nodemailer and Gmail SMTP
 * Dependencies: Nodemailer, Gmail SMTP with App Password
 * Features: Match notifications, welcome emails, plain text format
 */

import * as nodemailer from 'nodemailer';
import { ParsedListing } from '../types/database.types';
import { formatBedrooms } from '../utils/listingHelpers';

// ================================
// Types
// ================================

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ================================
// Email Configuration
// ================================

function getEmailConfig(): EmailConfig {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '465');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      'Missing required SMTP environment variables: SMTP_HOST, SMTP_USER, SMTP_PASS'
    );
  }

  return {
    host,
    port,
    secure: port === 465, // Use SSL for port 465, TLS for others
    auth: {
      user,
      pass,
    },
  };
}

// ================================
// Email Transport
// ================================

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const config = getEmailConfig();
    transporter = nodemailer.createTransport(config);
  }
  return transporter as nodemailer.Transporter;
}

// ================================
// Email Templates
// ================================

function formatListingNotificationEmail(listings: ParsedListing[]): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  let emailBody = `New Apartment Listings Found!\n\n`;
  emailBody += `We found ${listings.length} new apartment${listings.length > 1 ? 's' : ''} that match your criteria:\n\n`;

  listings.forEach((listing, index) => {
    emailBody += `${index + 1}. ${listing.title}\n`;
    emailBody += `   Price: $${listing.price.toLocaleString()}\n`;

    if (listing.bedrooms !== null) {
      emailBody += `   Bedrooms: ${formatBedrooms(listing.bedrooms)}\n`;
    }

    if (listing.neighborhood) {
      emailBody += `   Neighborhood: ${listing.neighborhood}\n`;
    }

    if (listing.pet_friendly !== null) {
      emailBody += `   Pet Friendly: ${listing.pet_friendly ? 'Yes' : 'No'}\n`;
    }

    if (listing.square_feet) {
      emailBody += `   Square Feet: ${listing.square_feet.toLocaleString()}\n`;
    }

    if (listing.posted_at) {
      const postedDate = new Date(listing.posted_at);
      emailBody += `   Posted: ${postedDate.toLocaleDateString()}\n`;
    }

    emailBody += `   Craigslist Link: ${listing.listing_url}\n\n`;
  });

  emailBody += `---\n\n`;
  emailBody += `This email was sent because you have an active apartment alert.\n\n`;
  emailBody += `Happy apartment hunting!\n`;
  emailBody += `- The Burroughs Alert Team`;

  return emailBody;
}

function formatWelcomeEmail(userEmail: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  let emailBody = `Welcome to Burroughs Alert!\n\n`;
  emailBody += `Thank you for signing up for apartment alerts in NYC.\n\n`;
  emailBody += `Your alert has been successfully created and is now active. `;
  emailBody += `We'll notify you via email whenever new apartments matching your criteria are found.\n\n`;
  emailBody += `What happens next:\n`;
  emailBody += `• We scan Craigslist every few minutes for new listings\n`;
  emailBody += `• You'll receive email notifications when matches are found\n`;
  emailBody += `• All listings are automatically checked for potential scams\n\n`;
  emailBody += `Happy apartment hunting!\n`;
  emailBody += `- The Burroughs Alert Team`;

  return emailBody;
}

// ================================
// Email Sending Functions
// ================================

/**
 * Send apartment listing notifications to user
 */
export async function sendListingNotification(
  userEmail: string,
  listings: ParsedListing[]
): Promise<EmailResult> {
  try {
    if (!listings || listings.length === 0) {
      return { success: false, error: 'No listings provided' };
    }

    const transport = getTransporter();
    const emailBody = formatListingNotificationEmail(listings);
    const subject = `${listings.length} New Apartment${listings.length > 1 ? 's' : ''} Found - Burroughs Alert`;

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: userEmail,
      subject,
      text: emailBody,
    };

    const result = await transport.sendMail(mailOptions);

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('Error sending listing notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  userEmail: string
): Promise<EmailResult> {
  try {
    const transport = getTransporter();
    const emailBody = formatWelcomeEmail(userEmail);
    const subject =
      'Welcome to Burroughs Alert - Your NYC Apartment Search Assistant';

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: userEmail,
      subject,
      text: emailBody,
    };

    const result = await transport.sendMail(mailOptions);

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// ================================
// Utility Functions
// ================================

/**
 * Test email configuration
 */
export async function testEmailConnection(): Promise<EmailResult> {
  try {
    const transport = getTransporter();
    await transport.verify();

    return {
      success: true,
    };
  } catch (error) {
    console.error('Email connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
    };
  }
}

/**
 * Close email transporter (useful for cleanup)
 */
export function closeEmailConnection(): void {
  if (transporter) {
    transporter.close();
    transporter = null;
  }
}
