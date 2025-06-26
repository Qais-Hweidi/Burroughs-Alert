/**
 * Craigslist Scraper Tests
 * 
 * Unit tests for the Craigslist scraper functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isWithinTimeRange,
  extractPrice,
  extractExternalId,
  NYC_BOROUGHS,
} from '../../src/lib/scraping/craigslist-scraper';

describe('Craigslist Scraper Utilities', () => {
  describe('isWithinTimeRange', () => {
    it('should return true for listings posted within time range', () => {
      expect(isWithinTimeRange('15 minutes ago', 45)).toBe(true);
      expect(isWithinTimeRange('30 minutes ago', 45)).toBe(true);
      expect(isWithinTimeRange('45 minutes ago', 45)).toBe(true);
      expect(isWithinTimeRange('just now', 45)).toBe(true);
    });

    it('should return false for listings posted outside time range', () => {
      expect(isWithinTimeRange('60 minutes ago', 45)).toBe(false);
      expect(isWithinTimeRange('1 hour ago', 45)).toBe(false);
      expect(isWithinTimeRange('2 hours ago', 45)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isWithinTimeRange('', 45)).toBe(false);
      expect(isWithinTimeRange('invalid text', 45)).toBe(false);
      expect(isWithinTimeRange('45 minutes ago', 45)).toBe(true);
      expect(isWithinTimeRange('46 minutes ago', 45)).toBe(false);
    });

    it('should work with different time ranges', () => {
      expect(isWithinTimeRange('10 minutes ago', 15)).toBe(true);
      expect(isWithinTimeRange('20 minutes ago', 15)).toBe(false);
    });
  });

  describe('extractPrice', () => {
    it('should extract valid prices', () => {
      expect(extractPrice('$2,500')).toBe(2500);
      expect(extractPrice('$1,200')).toBe(1200);
      expect(extractPrice('$800')).toBe(800);
      expect(extractPrice('3000')).toBe(3000);
    });

    it('should return null for invalid prices', () => {
      expect(extractPrice('')).toBe(null);
      expect(extractPrice('$abc')).toBe(null);
      expect(extractPrice('$100')).toBe(null); // Below minimum
      expect(extractPrice('$50000')).toBe(null); // Above maximum
    });

    it('should handle various price formats', () => {
      expect(extractPrice('$2,500/month')).toBe(2500);
      expect(extractPrice('2500')).toBe(2500);
      expect(extractPrice('$2500')).toBe(2500);
    });
  });

  describe('extractExternalId', () => {
    it('should extract ID from Craigslist URLs', () => {
      const url = 'https://newyork.craigslist.org/mnh/apa/d/manhattan-luxury-1-bedroom/7123456789.html';
      expect(extractExternalId(url)).toBe('7123456789');
    });

    it('should generate fallback ID for invalid URLs', () => {
      const id = extractExternalId('invalid-url');
      expect(id).toMatch(/^cl_\d+_[a-z0-9]+$/);
    });

    it('should handle various URL formats', () => {
      const url1 = 'https://newyork.craigslist.org/brk/apa/d/brooklyn-apartment/7987654321.html';
      expect(extractExternalId(url1)).toBe('7987654321');
      
      const url2 = 'https://newyork.craigslist.org/que/apa/d/queens-studio/7111111111.html';
      expect(extractExternalId(url2)).toBe('7111111111');
    });
  });

  describe('NYC_BOROUGHS configuration', () => {
    it('should have all 5 NYC boroughs', () => {
      expect(NYC_BOROUGHS).toHaveLength(5);
      
      const boroughNames = NYC_BOROUGHS.map(b => b.name);
      expect(boroughNames).toContain('Manhattan');
      expect(boroughNames).toContain('Brooklyn');
      expect(boroughNames).toContain('Queens');
      expect(boroughNames).toContain('Bronx');
      expect(boroughNames).toContain('Staten Island');
    });

    it('should have valid URLs for each borough', () => {
      NYC_BOROUGHS.forEach(borough => {
        expect(borough.url).toMatch(/^https:\/\/newyork\.craigslist\.org\/search\/[a-z]{3}\/apa#search=1~list~0$/);
        expect(borough.code).toHaveLength(3);
        expect(borough.name).toBeTruthy();
      });
    });
  });
});

describe('Craigslist Scraper Integration', () => {
  // Note: These would be integration tests that actually test the scraping
  // For now, we'll skip them as they require network access and real Craigslist
  
  it.skip('should scrape recent listings from all boroughs', async () => {
    // This would test the actual scrapeRecentListings function
    // Skipped for now as it requires network access
  });

  it.skip('should handle network errors gracefully', async () => {
    // Test error handling
  });
});