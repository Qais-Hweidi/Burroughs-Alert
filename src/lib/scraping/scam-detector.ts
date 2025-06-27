/**
 * Purpose: Basic heuristic scam detection for apartment listings (MVP)
 * Status: Implemented - Basic rule-based detection
 * Dependencies: None (pure TypeScript)
 * Key features: Price analysis, keyword detection, contact method analysis
 */

interface ScamDetectionResult {
  score: number; // 0-10 scale (0 = safe, 10 = high risk)
  reasons: string[];
  confidence: number;
}

interface ListingData {
  title: string;
  description: string;
  price: number;
  bedrooms: number;
  neighborhood: string;
  contactEmail?: string;
  contactPhone?: string;
}

// NYC average rent data for price comparison
const NYC_AVERAGE_PRICES = {
  studio: { min: 2000, avg: 2800, max: 4500 },
  1: { min: 2500, avg: 3500, max: 5500 },
  2: { min: 3000, avg: 4500, max: 7000 },
  3: { min: 3500, avg: 5500, max: 8500 },
  4: { min: 4000, avg: 6500, max: 10000 },
  5: { min: 5000, avg: 8000, max: 12000 },
};

// Scam keywords and patterns
const SCAM_KEYWORDS = [
  'wire money',
  'western union',
  'moneygram',
  'cashiers check',
  'overseas',
  'military',
  'deployed',
  'urgent',
  'must move quickly',
  'god bless',
  'honest person',
  'trust worthy',
  'no credit check',
  'first month free',
  'utilities included free',
  'too good to be true',
  'send money',
  'deposit required',
  'paypal',
  'zelle only',
];

const URGENCY_KEYWORDS = [
  'asap',
  'immediately',
  'today only',
  'limited time',
  'first come first serve',
  'wont last long',
  'act fast',
];

const SUSPICIOUS_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
];

/**
 * Calculate scam score for a listing
 */
export function calculateScamScore(listing: ListingData): ScamDetectionResult {
  let score = 0;
  const reasons: string[] = [];

  // Price-based detection
  const priceScore = analyzePricing(listing.price, listing.bedrooms);
  score += priceScore.score;
  if (priceScore.reason) reasons.push(priceScore.reason);

  // Keyword analysis
  const keywordScore = analyzeKeywords(listing.title, listing.description);
  score += keywordScore.score;
  reasons.push(...keywordScore.reasons);

  // Contact method analysis
  const contactScore = analyzeContactMethods(listing.contactEmail);
  score += contactScore.score;
  if (contactScore.reason) reasons.push(contactScore.reason);

  // Description quality analysis
  const qualityScore = analyzeDescriptionQuality(
    listing.description,
    listing.title
  );
  score += qualityScore.score;
  if (qualityScore.reason) reasons.push(qualityScore.reason);

  // Cap at 10
  score = Math.min(score, 10);

  // Calculate confidence based on number of indicators
  const confidence = Math.min(reasons.length * 0.25, 1);

  return {
    score: Math.round(score * 10) / 10,
    reasons,
    confidence,
  };
}

/**
 * Analyze pricing for scam indicators
 */
function analyzePricing(
  price: number,
  bedrooms: number
): { score: number; reason?: string } {
  const bedroomKey = bedrooms === 0 ? 'studio' : Math.min(bedrooms, 5);
  const priceData =
    NYC_AVERAGE_PRICES[bedroomKey as keyof typeof NYC_AVERAGE_PRICES];

  if (!priceData) return { score: 0 };

  // Extremely low price (more than 50% below minimum)
  if (price < priceData.min * 0.5) {
    return {
      score: 4,
      reason: `Price $${price} is suspiciously low for ${bedrooms} bedroom in NYC`,
    };
  }

  // Very low price (30-50% below minimum)
  if (price < priceData.min * 0.7) {
    return {
      score: 2,
      reason: `Price $${price} is below market rate for this bedroom count`,
    };
  }

  return { score: 0 };
}

/**
 * Analyze text for scam keywords
 */
function analyzeKeywords(
  title: string,
  description: string
): { score: number; reasons: string[] } {
  const text = (title + ' ' + description).toLowerCase();
  const reasons: string[] = [];
  let score = 0;

  // Check for scam keywords
  const foundScamKeywords = SCAM_KEYWORDS.filter((keyword) =>
    text.includes(keyword)
  );
  if (foundScamKeywords.length > 0) {
    score += foundScamKeywords.length * 1.5;
    reasons.push(`Contains scam keywords: ${foundScamKeywords.join(', ')}`);
  }

  // Check for urgency keywords
  const foundUrgencyKeywords = URGENCY_KEYWORDS.filter((keyword) =>
    text.includes(keyword)
  );
  if (foundUrgencyKeywords.length > 0) {
    score += foundUrgencyKeywords.length * 0.5;
    reasons.push(
      `Contains urgency language: ${foundUrgencyKeywords.join(', ')}`
    );
  }

  return { score, reasons };
}

/**
 * Analyze contact methods for suspicious patterns
 */
function analyzeContactMethods(email?: string): {
  score: number;
  reason?: string;
} {
  if (!email) return { score: 0 };

  const domain = email.split('@')[1]?.toLowerCase();

  // Check for suspicious domains (free email providers)
  if (domain && SUSPICIOUS_DOMAINS.includes(domain)) {
    return {
      score: 0.5,
      reason: `Uses free email provider (${domain})`,
    };
  }

  return { score: 0 };
}

/**
 * Analyze description quality for scam indicators
 */
function analyzeDescriptionQuality(
  description: string,
  title: string
): { score: number; reason?: string } {
  const text = description + ' ' + title;
  let score = 0;

  // Check for excessive capitalization
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.3) {
    score += 1;
    return { score, reason: 'Excessive use of capital letters' };
  }

  // Check for excessive exclamation marks
  const exclamationCount = (text.match(/!/g) || []).length;
  if (exclamationCount > 5) {
    score += 1;
    return { score, reason: 'Excessive use of exclamation marks' };
  }

  // Check for very short descriptions on expensive listings
  if (description.length < 50 && text.includes('$')) {
    score += 0.5;
    return { score, reason: 'Very brief description for rental listing' };
  }

  return { score };
}

/**
 * Helper function to check if a listing should be flagged
 */
export function isHighRiskListing(listing: ListingData): boolean {
  const result = calculateScamScore(listing);
  return result.score >= 4;
}

/**
 * Batch process multiple listings
 */
export function batchDetectScams(
  listings: ListingData[]
): Map<string, ScamDetectionResult> {
  const results = new Map<string, ScamDetectionResult>();

  listings.forEach((listing, index) => {
    const key = `${listing.title}_${index}`;
    results.set(key, calculateScamScore(listing));
  });

  return results;
}
