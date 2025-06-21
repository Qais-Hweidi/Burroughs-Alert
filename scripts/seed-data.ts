#!/usr/bin/env node

/**
 * Database Seeding Script
 * Create sample data for development and testing
 */

import { getDatabase } from '../src/lib/database';
import { createUser, createOrGetUser } from '../src/lib/database/queries/users';
import { logger } from '../src/lib/utils/logger';
import { generateUnsubscribeToken } from '../src/lib/utils/validation';

// Sample data
const SAMPLE_USERS = [
  'john.doe@example.com',
  'jane.smith@example.com',
  'mike.wilson@example.com',
  'sarah.johnson@example.com',
  'alex.brown@example.com'
];

const SAMPLE_ALERTS = [
  {
    email: 'john.doe@example.com',
    neighborhoods: ['Manhattan', 'Brooklyn'],
    maxPrice: 4000,
    minBedrooms: 1,
    petFriendly: true,
    maxCommuteMinutes: 45,
    commuteDestination: 'Times Square, NYC'
  },
  {
    email: 'jane.smith@example.com',
    neighborhoods: ['Upper East Side', 'Upper West Side'],
    minPrice: 2000,
    maxPrice: 5000,
    minBedrooms: 2,
    maxBedrooms: 3,
    petFriendly: false,
    maxCommuteMinutes: 30,
    commuteDestination: 'Wall Street, NYC'
  },
  {
    email: 'mike.wilson@example.com',
    neighborhoods: ['Williamsburg', 'DUMBO', 'Park Slope'],
    maxPrice: 3500,
    minBedrooms: 1,
    maxBedrooms: 2,
    petFriendly: true
  },
  {
    email: 'sarah.johnson@example.com',
    neighborhoods: ['Astoria', 'Long Island City'],
    minPrice: 1500,
    maxPrice: 2800,
    minBedrooms: 0,
    maxBedrooms: 1,
    petFriendly: false,
    maxCommuteMinutes: 60,
    commuteDestination: 'Midtown Manhattan'
  },
  {
    email: 'alex.brown@example.com',
    neighborhoods: ['Greenwich Village', 'East Village', 'West Village'],
    minPrice: 3000,
    maxPrice: 6000,
    minBedrooms: 1,
    petFriendly: true,
    maxCommuteMinutes: 20,
    commuteDestination: 'Union Square, NYC'
  }
];

const SAMPLE_LISTINGS = [
  {
    externalId: 'cl_1234567890',
    title: 'Beautiful 1BR in Manhattan - Pet Friendly!',
    description: 'Stunning apartment with great views of Central Park. Recently renovated with modern amenities.',
    price: 3200,
    bedrooms: 1,
    bathrooms: 1.0,
    squareFeet: 650,
    neighborhood: 'Upper East Side',
    address: '123 E 86th St, New York, NY 10028',
    latitude: 40.7831,
    longitude: -73.9712,
    petFriendly: true,
    images: ['https://images.craigslist.org/example1.jpg'],
    contactInfo: { phone: '555-0123', email: 'landlord@example.com' },
    listingUrl: 'https://newyork.craigslist.org/mnh/abo/d/example/1234567890.html',
    postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
  },
  {
    externalId: 'cl_2345678901',
    title: 'Cozy Studio in Brooklyn Heights',
    description: 'Charming studio apartment with exposed brick walls and hardwood floors.',
    price: 2400,
    bedrooms: 0,
    bathrooms: 1.0,
    squareFeet: 450,
    neighborhood: 'Brooklyn Heights',
    address: '456 Henry St, Brooklyn, NY 11201',
    latitude: 40.6952,
    longitude: -73.9935,
    petFriendly: false,
    images: ['https://images.craigslist.org/example2.jpg'],
    contactInfo: { phone: '555-0124', name: 'John Smith' },
    listingUrl: 'https://newyork.craigslist.org/brk/abo/d/example/2345678901.html',
    postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
  },
  {
    externalId: 'cl_3456789012',
    title: 'Spacious 2BR in Williamsburg',
    description: 'Modern apartment with in-unit laundry and rooftop access. Perfect for professionals.',
    price: 3800,
    bedrooms: 2,
    bathrooms: 2.0,
    squareFeet: 900,
    neighborhood: 'Williamsburg',
    address: '789 Graham Ave, Brooklyn, NY 11206',
    latitude: 40.7081,
    longitude: -73.9441,
    petFriendly: true,
    images: ['https://images.craigslist.org/example3.jpg', 'https://images.craigslist.org/example4.jpg'],
    contactInfo: { email: 'property@example.com', name: 'Property Manager' },
    listingUrl: 'https://newyork.craigslist.org/brk/abo/d/example/3456789012.html',
    postedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
  },
  {
    externalId: 'cl_4567890123',
    title: 'Luxury 3BR with River Views',
    description: 'Premium apartment with stunning East River views. Doorman building with gym and pool.',
    price: 6500,
    bedrooms: 3,
    bathrooms: 2.5,
    squareFeet: 1200,
    neighborhood: 'Long Island City',
    address: '321 Waterfront Dr, Long Island City, NY 11101',
    latitude: 40.7505,
    longitude: -73.9620,
    petFriendly: false,
    images: ['https://images.craigslist.org/example5.jpg'],
    contactInfo: { phone: '555-0125', email: 'luxury@example.com' },
    listingUrl: 'https://newyork.craigslist.org/que/abo/d/example/4567890123.html',
    postedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() // 6 hours ago
  },
  {
    externalId: 'cl_5678901234',
    title: 'Affordable 1BR in Astoria',
    description: 'Great value apartment near subway. Perfect for first-time renters.',
    price: 2200,
    bedrooms: 1,
    bathrooms: 1.0,
    squareFeet: 550,
    neighborhood: 'Astoria',
    address: '654 Ditmars Blvd, Astoria, NY 11105',
    latitude: 40.7744,
    longitude: -73.9102,
    petFriendly: true,
    images: [],
    contactInfo: { phone: '555-0126' },
    listingUrl: 'https://newyork.craigslist.org/que/abo/d/example/5678901234.html',
    postedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    scamScore: 0.1
  }
];

async function seedUsers(): Promise<void> {
  logger.info('Seeding users...');
  
  for (const email of SAMPLE_USERS) {
    try {
      await createOrGetUser(email);
      logger.debug(`Created/found user: ${email}`);
    } catch (error) {
      logger.error(`Failed to create user ${email}`, error as Error);
    }
  }
  
  logger.info(`Seeded ${SAMPLE_USERS.length} users`);
}

async function seedAlerts(): Promise<void> {
  logger.info('Seeding alerts...');
  
  const db = getDatabase();
  
  // First ensure we have users
  await seedUsers();
  
  for (const alertData of SAMPLE_ALERTS) {
    try {
      // Get user
      const user = await createOrGetUser(alertData.email);
      
      // Create alert
      const insertStmt = db.prepare(`
        INSERT INTO alerts (
          user_id, neighborhoods, min_price, max_price, 
          min_bedrooms, max_bedrooms, pet_friendly, 
          max_commute_minutes, commute_destination
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      insertStmt.run(
        user.id,
        JSON.stringify(alertData.neighborhoods),
        alertData.minPrice || null,
        alertData.maxPrice,
        alertData.minBedrooms || null,
        alertData.maxBedrooms || null,
        alertData.petFriendly ? 1 : 0,
        alertData.maxCommuteMinutes || null,
        alertData.commuteDestination || null
      );
      
      logger.debug(`Created alert for: ${alertData.email}`);
      
    } catch (error) {
      logger.error(`Failed to create alert for ${alertData.email}`, error as Error);
    }
  }
  
  logger.info(`Seeded ${SAMPLE_ALERTS.length} alerts`);
}

async function seedListings(): Promise<void> {
  logger.info('Seeding listings...');
  
  const db = getDatabase();
  
  for (const listingData of SAMPLE_LISTINGS) {
    try {
      const insertStmt = db.prepare(`
        INSERT INTO listings (
          external_id, title, description, price, bedrooms, bathrooms,
          square_feet, neighborhood, address, latitude, longitude,
          pet_friendly, images, contact_info, listing_url, posted_at, scam_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      insertStmt.run(
        listingData.externalId,
        listingData.title,
        listingData.description,
        listingData.price,
        listingData.bedrooms,
        listingData.bathrooms,
        listingData.squareFeet,
        listingData.neighborhood,
        listingData.address,
        listingData.latitude,
        listingData.longitude,
        listingData.petFriendly ? 1 : 0,
        JSON.stringify(listingData.images),
        JSON.stringify(listingData.contactInfo),
        listingData.listingUrl,
        listingData.postedAt,
        listingData.scamScore || 0.0
      );
      
      logger.debug(`Created listing: ${listingData.title}`);
      
    } catch (error) {
      logger.error(`Failed to create listing ${listingData.title}`, error as Error);
    }
  }
  
  logger.info(`Seeded ${SAMPLE_LISTINGS.length} listings`);
}

async function seedNotifications(): Promise<void> {
  logger.info('Seeding sample notifications...');
  
  const db = getDatabase();
  
  // Get some sample data for notifications
  const users = db.prepare('SELECT id FROM users LIMIT 3').all() as { id: number }[];
  const alerts = db.prepare('SELECT id, user_id FROM alerts LIMIT 3').all() as { id: number; user_id: number }[];
  const listings = db.prepare('SELECT id FROM listings LIMIT 3').all() as { id: number }[];
  
  if (users.length === 0 || alerts.length === 0 || listings.length === 0) {
    logger.warn('Not enough data to create sample notifications');
    return;
  }
  
  const notifications = [
    {
      userId: users[0].id,
      alertId: alerts[0].id,
      listingId: listings[0].id,
      emailStatus: 'sent'
    },
    {
      userId: users[1].id,
      alertId: alerts[1].id,
      listingId: listings[1].id,
      emailStatus: 'delivered'
    },
    {
      userId: users[2].id,
      alertId: alerts[2].id,
      listingId: listings[2].id,
      emailStatus: 'sent'
    }
  ];
  
  for (const notificationData of notifications) {
    try {
      const insertStmt = db.prepare(`
        INSERT INTO notifications (user_id, alert_id, listing_id, email_status)
        VALUES (?, ?, ?, ?)
      `);
      
      insertStmt.run(
        notificationData.userId,
        notificationData.alertId,
        notificationData.listingId,
        notificationData.emailStatus
      );
      
      logger.debug(`Created notification for user ${notificationData.userId}`);
      
    } catch (error) {
      logger.error(`Failed to create notification`, error as Error);
    }
  }
  
  logger.info(`Seeded ${notifications.length} notifications`);
}

interface SeedOptions {
  users?: boolean;
  alerts?: boolean;
  listings?: boolean;
  notifications?: boolean;
  all?: boolean;
  clear?: boolean;
}

function parseArgs(): SeedOptions {
  const args = process.argv.slice(2);
  const options: SeedOptions = {};
  
  if (args.length === 0) {
    options.all = true;
  }
  
  for (const arg of args) {
    switch (arg) {
      case '--users':
        options.users = true;
        break;
      case '--alerts':
        options.alerts = true;
        break;
      case '--listings':
        options.listings = true;
        break;
      case '--notifications':
        options.notifications = true;
        break;
      case '--all':
        options.all = true;
        break;
      case '--clear':
        options.clear = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
    }
  }
  
  return options;
}

function showHelp() {
  console.log(`
Database Seeding Tool

Usage:
  npm run db:seed [options]

Options:
  --users          Seed only users
  --alerts         Seed only alerts
  --listings       Seed only listings
  --notifications  Seed only notifications
  --all            Seed all data (default)
  --clear          Clear existing data before seeding
  --help, -h       Show this help message

Examples:
  npm run db:seed                    # Seed all data
  npm run db:seed --users            # Seed only users
  npm run db:seed --clear --all      # Clear and reseed all data
`);
}

async function clearData(): Promise<void> {
  logger.warn('Clearing existing data...');
  
  const db = getDatabase();
  
  // Clear in order due to foreign key constraints
  db.prepare('DELETE FROM notifications').run();
  db.prepare('DELETE FROM listings').run();
  db.prepare('DELETE FROM alerts').run();
  db.prepare('DELETE FROM users').run();
  
  logger.info('Existing data cleared');
}

async function seedData(options: SeedOptions): Promise<void> {
  try {
    logger.info('Starting database seeding...');
    
    if (options.clear) {
      await clearData();
    }
    
    if (options.all || options.users) {
      await seedUsers();
    }
    
    if (options.all || options.alerts) {
      await seedAlerts();
    }
    
    if (options.all || options.listings) {
      await seedListings();
    }
    
    if (options.all || options.notifications) {
      await seedNotifications();
    }
    
    logger.info('Database seeding completed successfully');
    
    // Show final counts
    const db = getDatabase();
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const alertCount = db.prepare('SELECT COUNT(*) as count FROM alerts').get() as { count: number };
    const listingCount = db.prepare('SELECT COUNT(*) as count FROM listings').get() as { count: number };
    const notificationCount = db.prepare('SELECT COUNT(*) as count FROM notifications').get() as { count: number };
    
    logger.info('Final counts:', {
      users: userCount.count,
      alerts: alertCount.count,
      listings: listingCount.count,
      notifications: notificationCount.count
    });
    
  } catch (error) {
    logger.fatal('Database seeding failed', error as Error);
    process.exit(1);
  }
}

async function main() {
  const options = parseArgs();
  await seedData(options);
}

// Run if called directly
if (require.main === module) {
  main();
}

export default main;