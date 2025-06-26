#!/usr/bin/env tsx

import puppeteer from 'puppeteer';

async function quickTest() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: '/usr/bin/chromium-browser',
  });

  const page = await browser.newPage();

  try {
    console.log('Loading Manhattan list view...');
    await page.goto(
      'https://newyork.craigslist.org/search/mnh/apa#search=1~list~0',
      {
        waitUntil: 'networkidle0',
        timeout: 30000,
      }
    );

    const counts = await page.evaluate(() => {
      return {
        clSearchResults: document.querySelectorAll('.cl-search-result').length,
        postingTitles: document.querySelectorAll('.posting-title').length,
        priceInfos: document.querySelectorAll('.priceinfo').length,
        metaSpans: document.querySelectorAll('.meta span').length,
        links: document.querySelectorAll('.cl-app-anchor').length,
      };
    });

    console.log('Element counts:', counts);

    // Get a sample of actual data
    const sample = await page.evaluate(() => {
      const firstListing = document.querySelector('.cl-search-result');
      if (firstListing) {
        const titleEl = firstListing.querySelector('.posting-title .label');
        const priceEl = firstListing.querySelector('.priceinfo');
        const linkEl = firstListing.querySelector('.cl-app-anchor');

        // Test different time selectors
        const timeEl2024 = firstListing.querySelector(
          '.meta span[title*="2024"]'
        );
        const timeEl2025 = firstListing.querySelector(
          '.meta span[title*="2025"]'
        );
        const allTimeSpans = firstListing.querySelectorAll('.meta span');

        const timeSpanInfo = Array.from(allTimeSpans).map((span) => ({
          text: span.textContent?.trim(),
          title: span.getAttribute('title'),
          hasTitle: !!span.getAttribute('title'),
        }));

        return {
          hasTitle: !!titleEl,
          titleText: titleEl?.textContent?.trim(),
          hasPrice: !!priceEl,
          priceText: priceEl?.textContent?.trim(),
          hasLink: !!linkEl,
          linkHref: (linkEl as HTMLAnchorElement)?.href,
          fullText: firstListing.textContent?.substring(0, 100),
          timeEl2024: !!timeEl2024,
          timeEl2025: !!timeEl2025,
          timeSpanInfo,
        };
      }
      return null;
    });

    console.log('First listing sample:', sample);
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

quickTest().catch(console.error);
