import { describe, it, expect } from 'vitest';
import {
  calculateScamScore,
  isHighRiskListing,
  batchDetectScams,
} from '../../../src/lib/scraping/scam-detector';

describe('Scam Detection System', () => {
  describe('calculateScamScore', () => {
    it('should return 0 score for normal listings', () => {
      const normalListing = {
        title: 'Nice 2BR apartment in Manhattan',
        description:
          'Beautiful apartment with great views and modern amenities',
        price: 3500,
        bedrooms: 2,
        neighborhood: 'Manhattan',
      };

      const result = calculateScamScore(normalListing);
      expect(result.score).toBe(0);
      expect(result.reasons).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });

    it('should detect extremely low prices', () => {
      const cheapListing = {
        title: 'Studio apartment',
        description: 'Small but nice',
        price: 800, // Way below NYC minimum
        bedrooms: 0,
        neighborhood: 'Manhattan',
      };

      const result = calculateScamScore(cheapListing);
      expect(result.score).toBe(4);
      expect(result.reasons).toContain(
        'Price $800 is suspiciously low for 0 bedroom in NYC'
      );
    });

    it('should detect scam keywords', () => {
      const scamListing = {
        title: 'Urgent apartment rental',
        description: 'Wire money overseas. God bless honest person needed.',
        price: 3000,
        bedrooms: 2,
        neighborhood: 'Brooklyn',
      };

      const result = calculateScamScore(scamListing);
      expect(result.score).toBeGreaterThan(0);
      expect(
        result.reasons.some((reason) => reason.includes('scam keywords'))
      ).toBe(true);
    });

    it('should detect urgency language', () => {
      const urgentListing = {
        title: 'ASAP apartment needed today only',
        description: 'Must move immediately, act fast!',
        price: 3000,
        bedrooms: 2,
        neighborhood: 'Queens',
      };

      const result = calculateScamScore(urgentListing);
      expect(result.score).toBeGreaterThan(0);
      expect(
        result.reasons.some((reason) => reason.includes('urgency language'))
      ).toBe(true);
    });

    it('should detect free email providers', () => {
      const emailListing = {
        title: 'Nice apartment',
        description: 'Good location',
        price: 3000,
        bedrooms: 2,
        neighborhood: 'Brooklyn',
        contactEmail: 'scammer@gmail.com',
      };

      const result = calculateScamScore(emailListing);
      expect(result.score).toBe(0.5);
      expect(result.reasons).toContain('Uses free email provider (gmail.com)');
    });

    it('should detect excessive capitalization', () => {
      const capsListing = {
        title: 'AMAZING APARTMENT!!!',
        description: 'PERFECT LOCATION WITH GREAT VIEWS!!!',
        price: 3000,
        bedrooms: 2,
        neighborhood: 'Manhattan',
      };

      const result = calculateScamScore(capsListing);
      expect(result.score).toBeGreaterThan(0);
      expect(
        result.reasons.some((reason) => reason.includes('capital letters'))
      ).toBe(true);
    });

    it('should detect excessive exclamation marks', () => {
      const exclamationListing = {
        title: 'Great apartment!!!!!',
        description: 'Amazing deal!!!!! Perfect location!!!!!',
        price: 3000,
        bedrooms: 2,
        neighborhood: 'Brooklyn',
      };

      const result = calculateScamScore(exclamationListing);
      expect(result.score).toBeGreaterThan(0);
      expect(
        result.reasons.some((reason) => reason.includes('exclamation marks'))
      ).toBe(true);
    });

    it('should handle multiple red flags correctly', () => {
      const multipleRedFlagsListing = {
        title: 'URGENT!!! 4BR Manhattan only $1500 MUST MOVE TODAY!!!',
        description:
          'God bless, need honest person. Wire money overseas. No credit check required!!!',
        price: 1500,
        bedrooms: 4,
        neighborhood: 'Manhattan',
        contactEmail: 'test@gmail.com',
      };

      const result = calculateScamScore(multipleRedFlagsListing);
      expect(result.score).toBe(10); // Should be capped at 10
      expect(result.reasons.length).toBeGreaterThan(2);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should cap score at 10', () => {
      const extremeScamListing = {
        title: 'URGENT URGENT URGENT!!! AMAZING DEAL!!!',
        description:
          'Wire money western union moneygram cashiers check overseas military deployed urgent must move quickly god bless honest person trust worthy no credit check first month free utilities included free too good to be true send money deposit required paypal zelle only!!!!!!!!!!!!',
        price: 500,
        bedrooms: 4,
        neighborhood: 'Manhattan',
        contactEmail: 'scam@gmail.com',
      };

      const result = calculateScamScore(extremeScamListing);
      expect(result.score).toBe(10);
    });
  });

  describe('isHighRiskListing', () => {
    it('should return false for safe listings', () => {
      const safeListing = {
        title: 'Nice apartment',
        description: 'Good location',
        price: 3000,
        bedrooms: 2,
        neighborhood: 'Brooklyn',
      };

      expect(isHighRiskListing(safeListing)).toBe(false);
    });

    it('should return true for high-risk listings', () => {
      const riskListing = {
        title: 'Cheap apartment',
        description: 'Wire money overseas',
        price: 800,
        bedrooms: 2,
        neighborhood: 'Manhattan',
      };

      expect(isHighRiskListing(riskListing)).toBe(true);
    });
  });

  describe('batchDetectScams', () => {
    it('should process multiple listings', () => {
      const listings = [
        {
          title: 'Normal apartment',
          description: 'Nice place',
          price: 3000,
          bedrooms: 2,
          neighborhood: 'Brooklyn',
        },
        {
          title: 'Scam apartment',
          description: 'Wire money overseas',
          price: 800,
          bedrooms: 2,
          neighborhood: 'Manhattan',
        },
      ];

      const results = batchDetectScams(listings);
      expect(results.size).toBe(2);

      const normalResult = results.get('Normal apartment_0');
      const scamResult = results.get('Scam apartment_1');

      expect(normalResult?.score).toBe(0);
      expect(scamResult?.score).toBeGreaterThan(0);
    });
  });

  describe('Price Analysis Edge Cases', () => {
    it('should handle studio apartments correctly', () => {
      const studioListing = {
        title: 'Studio apartment',
        description: 'Small space',
        price: 900, // Very low for NYC studio
        bedrooms: 0,
        neighborhood: 'Manhattan',
      };

      const result = calculateScamScore(studioListing);
      expect(result.score).toBe(4); // Should flag as extremely low
    });

    it('should handle large apartments correctly', () => {
      const largeListing = {
        title: '6BR apartment',
        description: 'Huge space',
        price: 2000, // Very low for 6BR
        bedrooms: 6,
        neighborhood: 'Manhattan',
      };

      const result = calculateScamScore(largeListing);
      expect(result.score).toBeGreaterThan(0); // Should flag based on 5BR cap
    });

    it('should handle reasonable prices correctly', () => {
      const reasonableListing = {
        title: '2BR apartment',
        description: 'Nice location',
        price: 4000, // Within reasonable range
        bedrooms: 2,
        neighborhood: 'Brooklyn',
      };

      const result = calculateScamScore(reasonableListing);
      expect(result.score).toBe(0); // Should not flag price
    });
  });
});
