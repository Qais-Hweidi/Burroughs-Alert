# Burroughs Alert - Project Overview

## Project Description

Burroughs Alert is a renter-focused notification service specifically designed for New York City apartment hunting. The app solves the critical problem of finding available apartments in NYC's competitive rental market by providing instant notifications when suitable listings appear.

## Core Value Proposition

- **Immediate Results**: See current matching apartments right after creating alert
- **Set & Forget**: Users define their perfect apartment criteria once
- **Instant Alerts**: Get notified the moment NEW matching listings appear
- **Beat the Competition**: Be first to respond to fresh listings
- **Scam Protection**: Built-in AI detection warns about suspicious listings
- **Dual System**: Browse now + get notified later

## User Journey (Dual System)

### **Immediate Experience:**

1. **Setup**: User visits website, enters email and apartment criteria
2. **Instant Results**: User immediately sees current matching apartments
3. **Browse & Contact**: User can contact landlords right away

### **Ongoing Benefits:**

4. **Background Monitoring**: System continuously scrapes for NEW listings
5. **Fresh Match Detection**: Algorithm identifies new apartments (every 30-45 min)
6. **Email Notifications**: User gets alerted when fresh matches appear
7. **First Responder Advantage**: User clicks through to new listing immediately

**Result**: Users get immediate satisfaction + ongoing competitive advantage

## Target User

- NYC renters actively searching for apartments
- Busy professionals who can't manually check listing sites constantly
- People new to NYC who need help avoiding scams
- Anyone who values speed in the competitive NYC rental market

## MVP Scope

### Core Features (Must Have)

- Email collection and basic user preferences
- **Immediate listings view** after alert creation
- Single listing source monitoring (Craigslist NYC)
- Simple matching algorithm (neighborhood, price, bedrooms)
- Email notifications for new matches
- Basic scam detection (price anomalies, suspicious keywords)
- Simple commute time estimation

### Simplified for MVP

- **Authentication**: None - just email collection
- **Notifications**: Email only (no push/SMS)
- **Verification**: No email verification required
- **Listing Sources**: Single source (Craigslist)
- **Scam Detection**: Basic keyword/price patterns
- **Commute**: Hardcoded estimates or simple API call

### Future Enhancements (Post-MVP)

- Multiple listing sources
- User accounts and authentication
- Push notifications and SMS
- Advanced scam detection with ML
- Real-time commute calculations
- Favorite listings and search history
- Premium features and monetization

## Success Metrics

- User email signups
- Successful notification deliveries
- Click-through rates on listing notifications
- User retention (continued use of service)
- Listing match accuracy

## Technical Constraints

- Must be fast and responsive
- Handle high-frequency scraping without being blocked
- Scale to handle thousands of users and listings
- Maintain 99% uptime for notifications
- Keep infrastructure costs minimal for MVP
