# Burroughs Alert - Project Overview

## Project Description

Burroughs Alert is a renter-focused notification service specifically designed for New York City apartment hunting. The app solves the critical problem of finding available apartments in NYC's competitive rental market by providing instant notifications when suitable listings appear.

## Core Value Proposition

- **Set & Forget**: Users define their perfect apartment criteria once
- **Instant Alerts**: Get notified the moment a matching listing appears
- **Beat the Competition**: Be first to respond to new listings
- **Scam Protection**: Built-in detection warns about suspicious listings
- **Commute Intelligence**: Shows travel time to work/school

## User Journey

1. **Setup**: User visits website, enters email and apartment criteria
2. **Background Monitoring**: System continuously scrapes listing sites
3. **Match Detection**: Algorithm identifies apartments meeting user criteria
4. **Instant Notification**: Email sent immediately when match found
5. **Quick Action**: User clicks through to listing to apply

## Target User

- NYC renters actively searching for apartments
- Busy professionals who can't manually check listing sites constantly
- People new to NYC who need help avoiding scams
- Anyone who values speed in the competitive NYC rental market

## MVP Scope

### Core Features (Must Have)

- Email collection and basic user preferences
- Single listing source monitoring (Craigslist NYC)
- Simple matching algorithm (neighborhood, price, bedrooms)
- Email notifications for matches
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
