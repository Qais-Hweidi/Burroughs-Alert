#!/usr/bin/env tsx

/**
 * Debug Craigslist Structure
 * 
 * Quick script to see what selectors are available on current Craigslist pages
 */

import puppeteer from 'puppeteer';

async function debugCraigslist() {
  const browser = await puppeteer.launch({
    headless: false, // Show browser window
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ],
    executablePath: '/usr/bin/chromium-browser',
  });

  const page = await browser.newPage();
  
  try {
    console.log('Loading Manhattan Craigslist...');
    await page.goto('https://newyork.craigslist.org/search/mnh/apa', { 
      waitUntil: 'networkidle0', 
      timeout: 30000 
    });

    console.log('Page loaded. Checking available selectors...');
    
    // Check for various possible selectors
    const selectors = [
      '.result-row',
      '.cl-search-result',
      '.cl-app-anchor',
      '[data-cl-app-anchor]',
      '.result-title',
      '.titlestring',
      '.cl-search-view-item'
    ];

    for (const selector of selectors) {
      const count = await page.$$eval(selector, elements => elements.length);
      console.log(`${selector}: ${count} elements found`);
    }

    // Get page title and URL to confirm we're on the right page
    const title = await page.title();
    const url = page.url();
    console.log(`\nPage title: ${title}`);
    console.log(`Current URL: ${url}`);

    // Check if there are any listings at all
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('\nPage contains listings?', bodyText.includes('apartment') || bodyText.includes('listing'));

  } catch (error) {
    console.error('Debug failed:', error);
  } finally {
    await browser.close();
  }
}

debugCraigslist().catch(console.error);