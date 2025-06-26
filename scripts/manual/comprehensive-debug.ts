#!/usr/bin/env tsx

import puppeteer from 'puppeteer';

async function comprehensiveDebug() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: '/usr/bin/chromium-browser',
  });

  const page = await browser.newPage();
  
  try {
    await page.goto('https://newyork.craigslist.org/search/mnh/apa#search=1~list~0', { 
      waitUntil: 'networkidle0', 
      timeout: 30000 
    });

    // Get full HTML of first listing
    const fullListingHTML = await page.evaluate(() => {
      const listing = document.querySelector('.cl-search-result');
      if (listing) {
        return {
          html: listing.innerHTML,
          textContent: listing.textContent,
          allSpans: Array.from(listing.querySelectorAll('span')).map(span => ({
            text: span.textContent?.trim(),
            title: span.getAttribute('title'),
            className: span.className
          })).filter(item => item.text),
          allElements: Array.from(listing.querySelectorAll('*')).map(el => ({
            tagName: el.tagName,
            text: el.textContent?.trim()?.substring(0, 50),
            className: el.className,
            title: el.getAttribute('title')
          })).filter(item => item.text && item.text.includes('$') || item.text?.match(/\d+/))
        };
      }
      return null;
    });

    console.log('=== FULL FIRST LISTING ===');
    console.log('Text content:', fullListingHTML?.textContent?.substring(0, 200));
    console.log('\n=== ALL SPANS ===');
    console.log(JSON.stringify(fullListingHTML?.allSpans, null, 2));
    console.log('\n=== ELEMENTS WITH $ OR NUMBERS ===');
    console.log(JSON.stringify(fullListingHTML?.allElements, null, 2));

  } catch (error) {
    console.error('Debug failed:', error);
  } finally {
    await browser.close();
  }
}

comprehensiveDebug().catch(console.error);