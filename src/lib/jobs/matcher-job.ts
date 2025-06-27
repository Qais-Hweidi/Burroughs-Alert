/**
 * Purpose: Matches new apartment listings against user alerts and triggers notifications
 * Status: ✅ IMPLEMENTED - Alert matching and notification generation
 * Dependencies: Database queries, notification utilities
 * Key Features: Alert matching, duplicate prevention, notification generation
 */

import { getDatabase } from '../database/index';
import { schema } from '../database/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getActiveAlertsWithUsers } from '../database/queries/alerts';
import {
  matchListingsToAlerts,
  formatMatchResult,
  getMatchStatistics,
} from '../matching/alert-matcher';
import type { ListingSelect } from '../database/schema';

// ================================
// Types
// ================================

export interface MatcherJobResult {
  success: boolean;
  startTime: Date;
  endTime: Date;
  duration: number;
  matchesFound: number;
  notificationsGenerated: number;
  errors: string[];
}

export interface MatcherJobOptions {
  maxHours?: number;
  generateNotifications?: boolean;
}

export interface NotificationData {
  userEmail: string;
  matches: MatchedListingResult[];
}

export interface MatchedListingResult {
  listing: ListingSelect;
  alertId: number;
  userId: number;
  userEmail: string;
}

// ================================
// Job Implementation
// ================================

/**
 * Execute matcher job: find matches -> generate notifications -> record results
 */
export async function runMatcherJob(
  options: MatcherJobOptions = {}
): Promise<MatcherJobResult> {
  const { maxHours = 1, generateNotifications = true } = options;

  const startTime = new Date();
  const result: MatcherJobResult = {
    success: false,
    startTime,
    endTime: new Date(),
    duration: 0,
    matchesFound: 0,
    notificationsGenerated: 0,
    errors: [],
  };

  try {
    console.log(
      `Starting matcher job - looking for matches in last ${maxHours} hours`
    );

    // Step 1: Get recent listings and active alerts
    const [recentListings, activeAlerts] = await Promise.all([
      getRecentListings(maxHours),
      getActiveAlertsWithUsers(),
    ]);

    console.log(
      `Found ${recentListings.length} recent listings and ${activeAlerts.length} active alerts`
    );

    if (recentListings.length === 0 || activeAlerts.length === 0) {
      console.log('No listings or alerts to match');
      result.success = true;
      return result;
    }

    // Step 2: Perform matching with comprehensive logic
    const matchedPairs = await matchListingsToAlerts(
      recentListings,
      activeAlerts,
      {
        debug: process.env.NODE_ENV === 'development',
        maxMatchesPerAlert: 10, // Limit to prevent spam
      }
    );

    // Filter out matches that already have notifications
    const newMatches = await filterExistingNotifications(
      matchedPairs.filter((pair) => pair.matchResult.isMatch)
    );

    result.matchesFound = newMatches.length;

    if (newMatches.length === 0) {
      console.log('No new matches found (after filtering duplicates)');
      result.success = true;
      return result;
    }

    console.log(`Found ${newMatches.length} new matches`);

    // Log match statistics for monitoring
    const stats = getMatchStatistics(matchedPairs);
    console.log(
      `Match statistics: ${stats.matchCount}/${matchedPairs.length} matches (${Math.round(stats.matchRate * 100)}% rate)`
    );

    // Step 3: Convert to notification format and group by user
    const matchedListings = newMatches.map((pair) => ({
      listing: pair.listing,
      alertId: pair.alert.id,
      userId: pair.alert.user_id,
      userEmail: pair.alert.user.email,
    }));

    const userMatches = groupMatchesByUser(matchedListings);
    console.log(`Matches grouped for ${userMatches.length} users`);

    // Step 4: Generate notifications if requested
    if (generateNotifications) {
      for (const userData of userMatches) {
        try {
          await generateNotificationRecords(userData.matches);
          result.notificationsGenerated += userData.matches.length;
          console.log(
            `Generated ${userData.matches.length} notifications for ${userData.userEmail}`
          );
        } catch (error) {
          result.errors.push(
            `Failed to generate notifications for ${userData.userEmail}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    }

    result.success = result.errors.length === 0;
    return result;
  } catch (error) {
    result.errors.push(
      `Matcher job failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    console.error('Matcher job error:', error);
    return result;
  } finally {
    result.endTime = new Date();
    result.duration = result.endTime.getTime() - result.startTime.getTime();

    // Log job completion
    const durationSeconds = Math.round((result.duration / 1000) * 100) / 100;
    console.log(
      `Matcher job completed in ${durationSeconds}s - Success: ${result.success}, Matches: ${result.matchesFound}, Notifications: ${result.notificationsGenerated}`
    );

    if (result.errors.length > 0) {
      console.error('Matcher job errors:', result.errors);
    }
  }
}

// ================================
// Helper Functions
// ================================

/**
 * Get recent listings from database
 */
async function getRecentListings(maxHours: number): Promise<ListingSelect[]> {
  const db = getDatabase();

  try {
    return await db
      .select()
      .from(schema.listings)
      .where(
        and(
          eq(schema.listings.is_active, true),
          sql`scraped_at >= datetime('now', '-' || ${maxHours} || ' hours')`
        )
      )
      .orderBy(sql`scraped_at DESC`);
  } catch (error) {
    console.error('Error getting recent listings:', error);
    return [];
  }
}

/**
 * Filter out matches that already have notifications
 */
async function filterExistingNotifications(
  matches: Array<{
    listing: ListingSelect;
    alert: { id: number; user_id: number; user: { email: string } };
  }>
): Promise<typeof matches> {
  const db = getDatabase();
  const filteredMatches = [];

  for (const match of matches) {
    try {
      const existingNotification = await db
        .select()
        .from(schema.notifications)
        .where(
          and(
            eq(schema.notifications.user_id, match.alert.user_id),
            eq(schema.notifications.alert_id, match.alert.id),
            eq(schema.notifications.listing_id, match.listing.id)
          )
        )
        .get();

      if (!existingNotification) {
        filteredMatches.push(match);
      }
    } catch (error) {
      console.error(
        `Error checking existing notification for listing ${match.listing.id}:`,
        error
      );
      // Include the match if we can't check (better to have duplicates than miss notifications)
      filteredMatches.push(match);
    }
  }

  return filteredMatches;
}

/**
 * Group matches by user for batch notification processing
 */
function groupMatchesByUser(
  matches: MatchedListingResult[]
): NotificationData[] {
  const userMap = new Map<string, MatchedListingResult[]>();

  for (const match of matches) {
    const userEmail = match.userEmail;
    if (!userMap.has(userEmail)) {
      userMap.set(userEmail, []);
    }
    userMap.get(userEmail)!.push(match);
  }

  return Array.from(userMap.entries()).map(([userEmail, matches]) => ({
    userEmail,
    matches,
  }));
}

/**
 * Generate notification records in database
 */
async function generateNotificationRecords(
  matches: MatchedListingResult[]
): Promise<void> {
  const db = getDatabase();

  for (const match of matches) {
    try {
      // Insert notification record
      await db.insert(schema.notifications).values({
        user_id: match.userId,
        alert_id: match.alertId,
        listing_id: match.listing.id,
        notification_type: 'new_listing',
        sent_at: new Date().toISOString(),
        email_status: 'pending', // Will be processed by notifier job
      });
    } catch (error) {
      // Log error but continue with other notifications
      console.error(
        `Failed to create notification record for user ${match.userId}, listing ${match.listing.id}:`,
        error
      );
      throw error;
    }
  }
}

// ================================
// Utility Functions
// ================================

/**
 * Get job configuration from environment variables
 */
export function getMatcherJobConfig() {
  return {
    maxHours: parseInt(process.env.MATCHER_MAX_HOURS || '1'),
    generateNotifications:
      process.env.MATCHER_GENERATE_NOTIFICATIONS !== 'false',
  };
}

/**
 * Create a formatted job summary for logging
 */
export function formatJobSummary(result: MatcherJobResult): string {
  const duration = Math.round((result.duration / 1000) * 100) / 100;
  const summary = [
    `Matcher Job Summary:`,
    `  Success: ${result.success}`,
    `  Duration: ${duration} seconds`,
    `  Matches found: ${result.matchesFound}`,
    `  Notifications generated: ${result.notificationsGenerated}`,
  ];

  if (result.errors.length > 0) {
    summary.push(`  Errors: ${result.errors.length}`);
    result.errors.forEach((error) => summary.push(`    - ${error}`));
  }

  return summary.join('\n');
}

/**
 * Get recent matches for monitoring/debugging
 */
export async function getRecentMatches(
  hours: number = 24
): Promise<MatchedListingResult[]> {
  try {
    const [recentListings, activeAlerts] = await Promise.all([
      getRecentListings(hours),
      getActiveAlertsWithUsers(),
    ]);

    if (recentListings.length === 0 || activeAlerts.length === 0) {
      return [];
    }

    const matchedPairs = await matchListingsToAlerts(
      recentListings,
      activeAlerts
    );

    return matchedPairs
      .filter((pair) => pair.matchResult.isMatch)
      .map((pair) => ({
        listing: pair.listing,
        alertId: pair.alert.id,
        userId: pair.alert.user_id,
        userEmail: pair.alert.user.email,
      }));
  } catch (error) {
    console.error('Error getting recent matches:', error);
    return [];
  }
}
