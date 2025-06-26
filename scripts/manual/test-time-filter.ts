#!/usr/bin/env tsx

import { isWithinTimeRange } from '../../src/lib/scraping/craigslist-scraper';

// Test the time filtering function
const testCases = [
  '18m ago',
  '45m ago',
  '60m ago',
  '2h ago',
  'just now',
  '120m ago',
  '121m ago',
];

console.log('Testing time filtering with 120 minute limit:');
testCases.forEach((timeText) => {
  const result = isWithinTimeRange(timeText, 120);
  console.log(`"${timeText}" -> ${result}`);
});

console.log('\nTesting time filtering with 60 minute limit:');
testCases.forEach((timeText) => {
  const result = isWithinTimeRange(timeText, 60);
  console.log(`"${timeText}" -> ${result}`);
});
