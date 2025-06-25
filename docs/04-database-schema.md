# Burroughs Alert - Database Schema

## Database: SQLite (Simplified for MVP)

**File Location**: `./data/app.db`  
**Library**: Drizzle ORM + better-sqlite3  
**Strategy**: Direct schema setup (no migrations for MVP)

## Schema Design

### 1. Users Table

**Purpose**: Store user email and preferences

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1,
  unsubscribe_token VARCHAR(32) UNIQUE
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_unsubscribe ON users(unsubscribe_token);
```

**Sample Data**:

```json
{
  "id": 1,
  "email": "john@example.com",
  "created_at": "2024-01-15 10:30:00",
  "updated_at": "2024-01-15 10:30:00",
  "is_active": true,
  "unsubscribe_token": "abc123def456"
}
```

### 2. Alerts Table

**Purpose**: Store user search criteria

```sql
CREATE TABLE alerts (
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

-- Indexes
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_active ON alerts(is_active);
CREATE INDEX idx_alerts_price_range ON alerts(min_price, max_price);
```

**Sample Data**:

```json
{
  "id": 1,
  "user_id": 1,
  "neighborhoods": "[\"Manhattan\", \"Brooklyn\"]",
  "min_price": 2000,
  "max_price": 4000,
  "min_bedrooms": 1,
  "max_bedrooms": 2,
  "pet_friendly": true,
  "max_commute_minutes": 45,
  "commute_destination": "Times Square, NYC",
  "created_at": "2024-01-15 10:30:00",
  "updated_at": "2024-01-15 10:30:00",
  "is_active": true
}
```

### 3. Listings Table

**Purpose**: Store scraped apartment listings

```sql
CREATE TABLE listings (
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

-- Indexes
CREATE INDEX idx_listings_external_id ON listings(external_id);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_listings_neighborhood ON listings(neighborhood);
CREATE INDEX idx_listings_bedrooms ON listings(bedrooms);
CREATE INDEX idx_listings_posted_at ON listings(posted_at);
CREATE INDEX idx_listings_active ON listings(is_active);
CREATE INDEX idx_listings_scam_score ON listings(scam_score);
```

**Sample Data**:

```json
{
  "id": 1,
  "external_id": "7123456789",
  "title": "Beautiful 1BR in Manhattan - Pet Friendly!",
  "description": "Stunning apartment with great views...",
  "price": 3200,
  "bedrooms": 1,
  "bathrooms": 1.0,
  "square_feet": 650,
  "neighborhood": "Upper East Side",
  "address": "123 E 86th St, New York, NY 10028",
  "latitude": 40.7831,
  "longitude": -73.9712,
  "pet_friendly": true,
  "images": "[\"https://images.craigslist.org/abc123.jpg\"]",
  "contact_info": "{\"phone\": \"555-0123\", \"email\": \"landlord@example.com\"}",
  "listing_url": "https://newyork.craigslist.org/mnh/abo/d/new-york-beautiful-1br-manhattan/7123456789.html",
  "source": "craigslist",
  "posted_at": "2024-01-15 08:00:00",
  "scraped_at": "2024-01-15 09:15:00",
  "is_active": true,
  "scam_score": 0.1
}
```

### 4. Notifications Table

**Purpose**: Track sent notifications to prevent duplicates

```sql
CREATE TABLE notifications (
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

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at);
CREATE INDEX idx_notifications_status ON notifications(email_status);
```

**Sample Data**:

```json
{
  "id": 1,
  "user_id": 1,
  "alert_id": 1,
  "listing_id": 1,
  "notification_type": "email",
  "sent_at": "2024-01-15 09:20:00",
  "email_status": "sent"
}
```

## Database Operations

### Common Queries

#### Create New Alert

```sql
INSERT INTO users (email, unsubscribe_token)
VALUES (?, ?)
ON CONFLICT(email) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
RETURNING id;

INSERT INTO alerts (user_id, neighborhoods, min_price, max_price, min_bedrooms, pet_friendly, max_commute_minutes, commute_destination)
VALUES (?, ?, ?, ?, ?, ?, ?, ?);
```

#### Find Matching Listings

```sql
SELECT l.* FROM listings l
WHERE l.is_active = 1
  AND l.scam_score < 0.5
  AND l.price BETWEEN ? AND ?
  AND l.bedrooms >= ?
  AND (? = 0 OR l.pet_friendly = 1)
  AND l.neighborhood IN (SELECT value FROM json_each(?))
  AND l.id NOT IN (
    SELECT listing_id FROM notifications
    WHERE user_id = ? AND alert_id = ?
  )
ORDER BY l.posted_at DESC;
```

#### Get User's Active Alerts

```sql
SELECT a.*, u.email
FROM alerts a
JOIN users u ON a.user_id = u.id
WHERE u.is_active = 1 AND a.is_active = 1;
```

#### Update Listing Status

```sql
UPDATE listings
SET is_active = 0
WHERE external_id = ? AND source = ?;
```

### Data Maintenance

#### Daily Cleanup (Remove old listings)

```sql
DELETE FROM listings
WHERE scraped_at < datetime('now', '-30 days');

DELETE FROM notifications
WHERE sent_at < datetime('now', '-90 days');
```

#### Vacuum Database (Weekly)

```sql
VACUUM;
ANALYZE;
```

## Data Types & Constraints

### Validation Rules

1. **Email Format**: Validated at application layer
2. **Price Range**: 500 ≤ price ≤ 20000
3. **Bedrooms**: 0 ≤ bedrooms ≤ 10
4. **Neighborhoods**: Must be valid NYC neighborhoods
5. **Scam Score**: 0.0 ≤ score ≤ 1.0

### JSON Fields

#### neighborhoods (in alerts table)

```json
["Manhattan", "Brooklyn", "Queens"]
```

#### images (in listings table)

```json
[
  "https://images.craigslist.org/abc123.jpg",
  "https://images.craigslist.org/def456.jpg"
]
```

#### contact_info (in listings table)

```json
{
  "phone": "555-0123",
  "email": "landlord@example.com",
  "name": "John Smith"
}
```

## Migration Strategy

### Initial Setup

```sql
-- migrations/001_initial_schema.sql
-- Create all tables with initial structure
```

### Future Migrations

```sql
-- migrations/002_add_commute_data.sql
-- migrations/003_add_user_preferences.sql
-- migrations/004_add_listing_features.sql
```

### Migration Runner

```typescript
// Simple migration system
function runMigrations(db: Database) {
  const currentVersion = getCurrentVersion(db);
  const migrationFiles = getMigrationFiles();

  for (const file of migrationFiles) {
    if (file.version > currentVersion) {
      db.exec(readFileSync(file.path, 'utf8'));
      updateVersion(db, file.version);
    }
  }
}
```

## Performance Considerations

### Indexing Strategy

- Primary keys: Automatic B-tree indexes
- Foreign keys: Explicit indexes for joins
- Query columns: Indexes on frequently filtered columns
- Composite indexes: For multi-column queries

### Query Optimization

- Use EXPLAIN QUERY PLAN for slow queries
- Limit result sets with appropriate WHERE clauses
- Use prepared statements for repeated queries
- Consider query result caching for expensive operations

### Storage Optimization

- Use appropriate data types (INTEGER vs VARCHAR)
- Normalize repeated data (neighborhoods lookup table)
- Regular VACUUM to reclaim space
- Consider archiving old data instead of deletion
