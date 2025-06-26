#!/usr/bin/env tsx

import puppeteer from 'puppeteer';

async function debugSelectors() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    executablePath: '/usr/bin/chromium-browser',
  });

  const page = await browser.newPage();
  
  try {
    await page.goto('https://newyork.craigslist.org/search/mnh/apa#search=1~list~0', { 
      waitUntil: 'networkidle0', 
      timeout: 30000 
    });

    // Get the structure of the first few listings
    const listingData = await page.evaluate(() => {
      const listings = document.querySelectorAll('.cl-search-result');
      const results = [];
      
      for (let i = 0; i < Math.min(3, listings.length); i++) {
        const listing = listings[i];
        
        // Try different selectors for title
        const titleSelectors = ['a', '.cl-app-anchor', '.posting-title', '[data-id]', 'h2', 'h3'];
        const priceSelectors = ['.price', '[data-price]', '.cl-price', '.result-price', '.meta .price', 'span[title*="$"]'];
        const timeSelectors = ['.result-date', '[datetime]', 'time', '.date', '[title*="2024"]', '[title*="26"]', '.meta time'];
        
        const result: any = {
          index: i,
          innerHTML: listing.innerHTML.substring(0, 500) + '...',
          title: null,
          price: null,
          time: null,
          href: null
        };
        
        // Find title
        for (const selector of titleSelectors) {
          const element = listing.querySelector(selector);
          if (element && element.textContent?.trim()) {
            result.title = element.textContent.trim();
            result.titleSelector = selector;
            result.href = (element as HTMLAnchorElement).href || null;
            break;
          }
        }
        
        // Find price
        for (const selector of priceSelectors) {
          const element = listing.querySelector(selector);
          if (element && element.textContent?.trim()) {
            result.price = element.textContent.trim();
            result.priceSelector = selector;
            break;
          }
        }
        
        // Find time
        for (const selector of timeSelectors) {
          const element = listing.querySelector(selector);
          if (element) {
            result.time = element.textContent?.trim() || element.getAttribute('datetime') || null;
            result.timeSelector = selector;
            break;
          }
        }
        
        results.push(result);
      }
      
      return results;
    });

    console.log('First 3 listings structure:');
    console.log(JSON.stringify(listingData, null, 2));

  } catch (error) {
    console.error('Debug failed:', error);
  } finally {
    await browser.close();
  }
}

debugSelectors().catch(console.error);