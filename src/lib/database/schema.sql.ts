/**
 * Database Schema for Burroughs Alert
 * SQLite schema with all tables, indexes, and constraints
 */

export const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1,
  unsubscribe_token VARCHAR(32) UNIQUE
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_unsubscribe ON users(unsubscribe_token);
`;

export const createAlertsTable = `
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  neighborhoods TEXT NOT NULL, -- JSON array
  min_price INTEGER,
  max_price INTEGER,
  min_bedrooms INTEGER,
  max_bedrooms INTEGER,
  pet_friendly BOOLEAN,
  max_commute_minutes INTEGER,
  commute_destination VARCHAR(255), -- address or landmark
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for alerts table
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_alerts_price_range ON alerts(min_price, max_price);
`;

export const createListingsTable = `
CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  external_id VARCHAR(255) NOT NULL UNIQUE, -- Craigslist post ID
  title VARCHAR(500) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  bedrooms INTEGER,
  bathrooms REAL,
  square_feet INTEGER,
  neighborhood VARCHAR(255),
  address VARCHAR(500),
  latitude REAL,
  longitude REAL,
  pet_friendly BOOLEAN,
  images TEXT, -- JSON array of image URLs
  contact_info TEXT, -- JSON object
  listing_url VARCHAR(1000) NOT NULL,
  source VARCHAR(50) DEFAULT 'craigslist',
  posted_at DATETIME,
  scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1,
  scam_score REAL DEFAULT 0.0 -- 0-1 scale, higher = more suspicious
);

-- Indexes for listings table
CREATE INDEX IF NOT EXISTS idx_listings_external_id ON listings(external_id);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_neighborhood ON listings(neighborhood);
CREATE INDEX IF NOT EXISTS idx_listings_bedrooms ON listings(bedrooms);
CREATE INDEX IF NOT EXISTS idx_listings_posted_at ON listings(posted_at);
CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(is_active);
CREATE INDEX IF NOT EXISTS idx_listings_scam_score ON listings(scam_score);
`;

export const createNotificationsTable = `
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  alert_id INTEGER NOT NULL,
  listing_id INTEGER NOT NULL,
  notification_type VARCHAR(50) DEFAULT 'email',
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  email_status VARCHAR(50), -- sent, delivered, bounced, failed
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  
  UNIQUE(user_id, alert_id, listing_id) -- Prevent duplicate notifications
);

-- Indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(email_status);
`;

export const createTriggers = `
-- Update updated_at timestamp for users
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
  AFTER UPDATE ON users
  FOR EACH ROW
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update updated_at timestamp for alerts
CREATE TRIGGER IF NOT EXISTS update_alerts_timestamp 
  AFTER UPDATE ON alerts
  FOR EACH ROW
BEGIN
  UPDATE alerts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
`;

// Complete schema for database initialization
export const fullSchema = [
  createUsersTable,
  createAlertsTable,
  createListingsTable,
  createNotificationsTable,
  createTriggers
].join('\n\n');

// Individual table schemas for migrations
export const schemas = {
  users: createUsersTable,
  alerts: createAlertsTable,
  listings: createListingsTable,
  notifications: createNotificationsTable,
  triggers: createTriggers
} as const;