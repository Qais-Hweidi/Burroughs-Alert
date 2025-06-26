#!/usr/bin/env tsx

import puppeteer from 'puppeteer';
import { detectPetFriendly } from '../../src/lib/scraping/craigslist-scraper';

async function testPetDetection() {
  console.log('🐕 Testing Pet Policy Detection on Williamsburg Listing...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: '/usr/bin/chromium-browser',
  });

  const page = await browser.newPage();

  try {
    // Test the Williamsburg listing we know has pet policy
    const url =
      'https://newyork.craigslist.org/brk/apa/d/brooklyn-williamsburg-beautiful-bedroom/7861257104.html';
    console.log(`Visiting: ${url}\n`);

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // Extract data like the enhanced scraper does
    const data = await page.evaluate(() => {
      const title =
        document.querySelector('h1.postingtitle')?.textContent?.trim() || '';

      const descriptionElement = document.querySelector(
        '#postingbody, .postingbody, .userbody'
      );
      const fullDescription = descriptionElement
        ? descriptionElement.textContent?.trim() || ''
        : '';

      const housingAttrs = document.querySelector(
        '.mapAndAttrs .attrgroup:last-child'
      );
      const housingText = housingAttrs
        ? housingAttrs.textContent?.trim() || ''
        : '';

      const allAttrGroups = Array.from(
        document.querySelectorAll('.mapAndAttrs .attrgroup')
      );
      const allAttributesText = allAttrGroups
        .map((group) => group.textContent?.trim() || '')
        .join(' ');

      return {
        title,
        fullDescription: fullDescription.substring(0, 300),
        housingText: housingText.substring(0, 200),
        allAttributesText: allAttributesText.substring(0, 300),
      };
    });

    console.log('📋 Extracted Data:');
    console.log(`Title: ${data.title}`);
    console.log(`\nDescription (first 300 chars): ${data.fullDescription}`);
    console.log(`\nHousing Attributes: ${data.housingText}`);
    console.log(`\nAll Attributes: ${data.allAttributesText}`);

    // Test pet detection with different combinations
    const combinedText = `${data.title} ${data.fullDescription} ${data.housingText} ${data.allAttributesText}`;

    console.log('\n🔍 Pet Detection Tests:');
    console.log(`Title only: ${detectPetFriendly(data.title, '')}`);
    console.log(
      `Title + Description: ${detectPetFriendly(data.title, data.fullDescription)}`
    );
    console.log(
      `Title + Housing Attrs: ${detectPetFriendly(data.title, data.housingText)}`
    );
    console.log(
      `Title + All Attrs: ${detectPetFriendly(data.title, data.allAttributesText)}`
    );
    console.log(`Combined All: ${detectPetFriendly(data.title, combinedText)}`);

    // Manual regex test on the combined text
    const lowerText = combinedText.toLowerCase();
    console.log('\n🧪 Manual Pattern Tests:');
    console.log(`Contains "cats are ok": ${lowerText.includes('cats are ok')}`);
    console.log(`Contains "dogs are ok": ${lowerText.includes('dogs are ok')}`);
    console.log(`Contains "cats ok": ${lowerText.includes('cats ok')}`);
    console.log(`Contains "dogs ok": ${lowerText.includes('dogs ok')}`);

    // Test the regex patterns directly
    const patterns = [
      /cats? are (?:ok|okay|allowed|welcome)/,
      /dogs? are (?:ok|okay|allowed|welcome)/,
      /\bcats ok\b/,
      /\bdogs ok\b/,
    ];

    console.log('\n🎯 Regex Pattern Matches:');
    patterns.forEach((pattern, index) => {
      const match = lowerText.match(pattern);
      console.log(
        `Pattern ${index + 1} (${pattern}): ${match ? `MATCH: "${match[0]}"` : 'NO MATCH'}`
      );
    });
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testPetDetection().catch(console.error);
