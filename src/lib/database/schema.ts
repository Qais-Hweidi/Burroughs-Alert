/**
 * Database Schema Definition
 * Purpose: SQLite schema for apartment alert system (users, alerts, listings, notifications)
 * Status: Complete implementation with all tables, indexes, and relationships
 * Dependencies: Drizzle ORM, SQLite - uses JSON columns for flexible data storage
 */

import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  integer,
  text,
  real,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

// ================================
// Users Table
// ================================

export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    email: text('email').notNull().unique(),
    created_at: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updated_at: text('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    is_active: integer('is_active', { mode: 'boolean' })
      .default(true)
      .notNull(),
    unsubscribe_token: text('unsubscribe_token').unique(),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
    unsubscribeTokenIdx: index('users_unsubscribe_token_idx').on(
      table.unsubscribe_token
    ),
    activeIdx: index('users_active_idx').on(table.is_active),
  })
);

// ================================
// Alerts Table
// ================================

export const alerts = sqliteTable(
  'alerts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    user_id: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    neighborhoods: text('neighborhoods').notNull(), // JSON array as string
    min_price: integer('min_price'),
    max_price: integer('max_price'),
    bedrooms: integer('bedrooms'), // 0=studio, 1-10=bedrooms, null=any
    pet_friendly: integer('pet_friendly', { mode: 'boolean' }),
    max_commute_minutes: integer('max_commute_minutes'),
    commute_destination: text('commute_destination'),
    commute_destination_place_id: text('commute_destination_place_id'),
    commute_destination_lat: real('commute_destination_lat'),
    commute_destination_lng: real('commute_destination_lng'),
    created_at: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updated_at: text('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    is_active: integer('is_active', { mode: 'boolean' })
      .default(true)
      .notNull(),
  },
  (table) => ({
    userIdIdx: index('alerts_user_id_idx').on(table.user_id),
    activeIdx: index('alerts_active_idx').on(table.is_active),
    priceIdx: index('alerts_price_idx').on(table.min_price, table.max_price),
    bedroomsIdx: index('alerts_bedrooms_idx').on(table.bedrooms),
    petFriendlyIdx: index('alerts_pet_friendly_idx').on(table.pet_friendly),
    commuteIdx: index('alerts_commute_idx').on(table.max_commute_minutes),
  })
);

// ================================
// Listings Table
// ================================

export const listings = sqliteTable(
  'listings',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    external_id: text('external_id').notNull().unique(),
    title: text('title').notNull(),
    description: text('description'),
    price: integer('price').notNull(),
    bedrooms: integer('bedrooms'),
    square_feet: integer('square_feet'),
    neighborhood: text('neighborhood'),
    address: text('address'),
    latitude: real('latitude'),
    longitude: real('longitude'),
    pet_friendly: integer('pet_friendly', { mode: 'boolean' }),
    listing_url: text('listing_url').notNull(),
    source: text('source').default('craigslist').notNull(),
    posted_at: text('posted_at'),
    scraped_at: text('scraped_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    is_active: integer('is_active', { mode: 'boolean' })
      .default(true)
      .notNull(),
    scam_score: integer('scam_score').default(0).notNull(),
  },
  (table) => ({
    externalIdIdx: uniqueIndex('listings_external_id_idx').on(
      table.external_id
    ),
    priceIdx: index('listings_price_idx').on(table.price),
    bedroomsIdx: index('listings_bedrooms_idx').on(table.bedrooms),
    neighborhoodIdx: index('listings_neighborhood_idx').on(table.neighborhood),
    locationIdx: index('listings_location_idx').on(
      table.latitude,
      table.longitude
    ),
    petFriendlyIdx: index('listings_pet_friendly_idx').on(table.pet_friendly),
    activeIdx: index('listings_active_idx').on(table.is_active),
    scamScoreIdx: index('listings_scam_score_idx').on(table.scam_score),
    sourceIdx: index('listings_source_idx').on(table.source),
    postedAtIdx: index('listings_posted_at_idx').on(table.posted_at),
    scrapedAtIdx: index('listings_scraped_at_idx').on(table.scraped_at),
  })
);

// ================================
// Notifications Table
// ================================

export const notifications = sqliteTable(
  'notifications',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    user_id: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    alert_id: integer('alert_id')
      .notNull()
      .references(() => alerts.id, { onDelete: 'cascade' }),
    listing_id: integer('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    notification_type: text('notification_type')
      .default('new_listing')
      .notNull(),
    sent_at: text('sent_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    email_status: text('email_status').default('sent'),
  },
  (table) => ({
    userIdIdx: index('notifications_user_id_idx').on(table.user_id),
    alertIdIdx: index('notifications_alert_id_idx').on(table.alert_id),
    listingIdIdx: index('notifications_listing_id_idx').on(table.listing_id),
    sentAtIdx: index('notifications_sent_at_idx').on(table.sent_at),
    typeIdx: index('notifications_type_idx').on(table.notification_type),
    emailStatusIdx: index('notifications_email_status_idx').on(
      table.email_status
    ),
    // Composite index to prevent duplicate notifications
    uniqueNotificationIdx: uniqueIndex('notifications_unique_idx').on(
      table.user_id,
      table.alert_id,
      table.listing_id
    ),
  })
);

// ================================
// Schema Exports for TypeScript
// ================================

export type UserSelect = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;

export type AlertSelect = typeof alerts.$inferSelect;
export type AlertInsert = typeof alerts.$inferInsert;

export type ListingSelect = typeof listings.$inferSelect;
export type ListingInsert = typeof listings.$inferInsert;

export type NotificationSelect = typeof notifications.$inferSelect;
export type NotificationInsert = typeof notifications.$inferInsert;

// ================================
// Database Schema Export
// ================================

export const schema = {
  users,
  alerts,
  listings,
  notifications,
};
