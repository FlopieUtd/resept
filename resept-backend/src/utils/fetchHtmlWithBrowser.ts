import * as puppeteer from "puppeteer";

interface BrowserOptions {
  waitForSelector?: string;
  waitForTimeout?: number;
  waitForNetworkIdle?: boolean;
  maxWaitTime?: number;
}

let browser: puppeteer.Browser | null = null;

const getBrowser = async (): Promise<puppeteer.Browser> => {
  if (!browser) {
    const launchOptions: any = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--single-process",
        "--no-zygote",
      ],
    };

    // Set the cache directory for Render
    process.env.PUPPETEER_CACHE_DIR = '/opt/render/.cache/puppeteer';

    // Try to find Chrome in common locations on Render
    const possiblePaths = [
      process.env.PUPPETEER_EXECUTABLE_PATH,
      '/opt/render/.cache/puppeteer/chrome/linux-139.0.7258.66/chrome-linux64/chrome',
      '/opt/render/.cache/puppeteer/chrome/linux-139.0.7258.66/chrome-linux64/Google Chrome for Testing',
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/opt/google/chrome/chrome',
      '/opt/google/chrome/google-chrome',
    ].filter(Boolean);

    for (const path of possiblePaths) {
      try {
        const fs = await import('fs');
        if (path && fs.existsSync(path)) {
          launchOptions.executablePath = path;
          console.log(`Using Chrome at: ${path}`);
          break;
        }
      } catch (e) {
        // Continue to next path
      }
    }

    // If no Chrome found, try to install it dynamically
    if (!launchOptions.executablePath) {
      console.log("No Chrome found, attempting to install...");
      try {
        const { execSync } = await import('child_process');
        execSync('npx puppeteer browsers install chrome --path=/opt/render/.cache/puppeteer', { stdio: 'inherit' });
        console.log("Chrome installation completed");
        
        // Try to find the installed Chrome
        const installedPaths = [
          '/opt/render/.cache/puppeteer/chrome/linux-139.0.7258.66/chrome-linux64/chrome',
          '/opt/render/.cache/puppeteer/chrome/linux-139.0.7258.66/chrome-linux64/Google Chrome for Testing',
        ];
        
        for (const path of installedPaths) {
          const fs = await import('fs');
          if (fs.existsSync(path)) {
            launchOptions.executablePath = path;
            console.log(`Using installed Chrome at: ${path}`);
            break;
          }
        }
      } catch (installError: any) {
        console.log("Chrome installation failed:", installError.message);
      }
    }

    browser = await puppeteer.launch(launchOptions);
  }
  return browser;
};

export const fetchHtmlWithBrowser = async (
  url: string,
  options: BrowserOptions = {}
): Promise<string> => {
  const {
    waitForSelector = null,
    waitForTimeout = 5000,
    waitForNetworkIdle = true,
    maxWaitTime = 15000,
  } = options;

  console.log(`Browser: Fetching ${url} with headless browser...`);

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Set realistic viewport and user agent
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Set extra headers to look more like a real browser
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      DNT: "1",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
    });

    // Disable web security and enable JavaScript for Cloudflare challenges
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });

    // Navigate to the page
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    console.log("Browser: Page loaded, waiting for content...");

    // Check for Cloudflare challenge and wait for it to complete
    const isCloudflareChallenge = await page.evaluate(() => {
      return document.body.innerHTML.includes("Just a moment...") ||
             document.body.innerHTML.includes("Enable JavaScript and cookies to continue") ||
             document.body.innerHTML.includes("_cf_chl_opt");
    });

    if (isCloudflareChallenge) {
      console.log("Browser: Cloudflare challenge detected, waiting for completion...");
      try {
        // Wait for the challenge to complete by waiting for the page to change
        await page.waitForFunction(
          () => {
            return !document.body.innerHTML.includes("Just a moment...") &&
                   !document.body.innerHTML.includes("Enable JavaScript and cookies to continue");
          },
          { timeout: 30000 } // Wait up to 30 seconds for Cloudflare challenge
        );
        console.log("Browser: Cloudflare challenge completed");
      } catch (error) {
        console.log("Browser: Cloudflare challenge timeout, continuing with current content...");
      }
    }

    // Wait for content to populate
    if (waitForSelector) {
      try {
        await page.waitForSelector(waitForSelector, { timeout: maxWaitTime });
        console.log(`Browser: Found selector ${waitForSelector}`);
      } catch (error) {
        console.log(
          `Browser: Selector ${waitForSelector} not found, continuing...`
        );
      }
    }

    // Wait for network to be idle (no pending requests)
    if (waitForNetworkIdle) {
      try {
        await page.waitForFunction(
          () => {
            return performance
              .getEntriesByType("resource")
              .filter((r) => {
                const resource = r as PerformanceResourceTiming;
                return (
                  resource.initiatorType === "xmlhttprequest" ||
                  resource.initiatorType === "fetch"
                );
              })
              .every((r) => {
                const resource = r as PerformanceResourceTiming;
                return resource.responseEnd > 0;
              });
          },
          { timeout: maxWaitTime }
        );
        console.log("Browser: Network is idle");
      } catch (error) {
        console.log("Browser: Network idle timeout, continuing...");
      }
    }

    // Additional wait for dynamic content
    await new Promise((resolve) => setTimeout(resolve, waitForTimeout));

    // Get the final HTML content
    const html = await page.content();
    console.log(
      `Browser: HTML fetched successfully, length: ${html.length} characters`
    );

    return html;
  } catch (error) {
    console.error("Browser: Error fetching HTML:", error);
    throw error;
  } finally {
    await page.close();
  }
};

export const closeBrowser = async (): Promise<void> => {
  if (browser) {
    await browser.close();
    browser = null;
    console.log("Browser: Browser closed");
  }
};
