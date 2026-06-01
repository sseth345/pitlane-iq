const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://localhost:3333', { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000)); // let charts render
  const outPath = 'C:/Users/seths/.gemini/antigravity-ide/brain/28cbd487-3169-4d03-9c5e-66e51493954b/screenshot_current.png';
  await page.screenshot({ path: outPath, fullPage: false });
  console.log('Screenshot saved to:', outPath);
  await browser.close();
})().catch(err => { console.error(err); process.exit(1); });
