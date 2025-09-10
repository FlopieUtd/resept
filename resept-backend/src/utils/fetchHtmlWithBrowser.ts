import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Browser, Page } from "puppeteer";

// Add stealth plugin
puppeteer.use(StealthPlugin());

interface BrowserOptions {
  waitForSelector?: string;
  waitForTimeout?: number;
  waitForNetworkIdle?: boolean;
  maxWaitTime?: number;
}

let browser: Browser | null = null;

const getBrowser = async (): Promise<Browser> => {
  if (!browser) {
    const launchOptions: any = {
      headless: "new", // Use new headless mode for better stealth
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
        // Additional stealth measures
        "--disable-blink-features=AutomationControlled",
        "--disable-features=VizDisplayCompositor,TranslateUI",
        "--disable-ipc-flooding-protection",
        "--disable-hang-monitor",
        "--disable-prompt-on-repost",
        "--disable-sync",
        "--disable-default-apps",
        "--disable-extensions",
        "--disable-plugins",
        "--disable-translate",
        "--hide-scrollbars",
        "--mute-audio",
        "--no-default-browser-check",
        "--no-pings",
        "--password-store=basic",
        "--use-mock-keychain",
        "--disable-component-extensions-with-background-pages",
        "--disable-background-networking",
        "--disable-client-side-phishing-detection",
        "--disable-crash-reporter",
        "--disable-oopr-debug-crash-dump",
        "--no-crash-upload",
        "--disable-gpu-sandbox",
        "--disable-software-rasterizer",
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
    
    // Rotate between different realistic user agents
    const userAgents = [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    ];
    
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    await page.setUserAgent(randomUserAgent);

    // Set extra headers to look more like a real browser
    await page.setExtraHTTPHeaders({
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Language": "en-US,en;q=0.9,nl;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"macOS"',
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
      DNT: "1",
      Connection: "keep-alive",
    });

    // Additional stealth measures (stealth plugin handles most of these)
    await page.evaluateOnNewDocument(() => {
      // Mock timezone for Dutch sites
      Object.defineProperty(Intl.DateTimeFormat.prototype, 'resolvedOptions', {
        value: function() {
          return { timeZone: 'Europe/Amsterdam' };
        },
      });

      // Remove automation indicators
      delete (window as any).__nightmare;
      delete (window as any).__phantomas;
      delete (window as any).callPhantom;
      delete (window as any)._phantom;
      delete (window as any).phantom;
    });

    // Add random delay before navigation to mimic human behavior
    const randomDelay = Math.random() * 2000 + 1000; // 1-3 seconds
    await new Promise(resolve => setTimeout(resolve, randomDelay));

    // Navigate to the page
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    console.log("Browser: Page loaded, waiting for content...");

    // Add human-like mouse movement and scrolling
    await page.mouse.move(100, 100);
    await page.mouse.move(200, 200);
    await page.evaluate(() => {
      window.scrollTo(0, 100);
    });

    // Check for Cloudflare challenge and wait for it to complete
    const isCloudflareChallenge = await page.evaluate(() => {
      return document.body.innerHTML.includes("Just a moment...") ||
             document.body.innerHTML.includes("Enable JavaScript and cookies to continue") ||
             document.body.innerHTML.includes("_cf_chl_opt") ||
             document.body.innerHTML.includes("Verifying you are human") ||
             document.body.innerHTML.includes("challenge-platform");
    });

    if (isCloudflareChallenge) {
      console.log("Browser: Cloudflare challenge detected, waiting for completion...");
      
      // Add human-like behavior during challenge
      await page.evaluate(() => {
        // Simulate some user interaction
        document.dispatchEvent(new Event('mousemove'));
        document.dispatchEvent(new Event('click'));
      });

      try {
        // Wait for the challenge to complete by waiting for the page to change
        await page.waitForFunction(
          () => {
            const bodyText = document.body.innerHTML;
            return !bodyText.includes("Just a moment...") &&
                   !bodyText.includes("Enable JavaScript and cookies to continue") &&
                   !bodyText.includes("Verifying you are human") &&
                   !bodyText.includes("challenge-platform") &&
                   bodyText.length > 5000; // Ensure we have substantial content
          },
          { timeout: 45000 } // Wait up to 45 seconds for Cloudflare challenge
        );
        console.log("Browser: Cloudflare challenge completed");
      } catch (error) {
        console.log("Browser: Cloudflare challenge timeout, continuing with current content...");
        
        // Try to trigger any remaining JavaScript
        await page.evaluate(() => {
          // Trigger any lazy-loaded content
          window.dispatchEvent(new Event('load'));
          window.dispatchEvent(new Event('DOMContentLoaded'));
        });
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

    // Additional human-like behavior before final content extraction
    await page.evaluate(() => {
      // Simulate more realistic user behavior
      window.scrollTo(0, Math.random() * 500);
      setTimeout(() => window.scrollTo(0, Math.random() * 500), 500);
    });

    // Additional wait for dynamic content with random variation
    const additionalWait = waitForTimeout + Math.random() * 2000; // Add 0-2 seconds of randomness
    await new Promise((resolve) => setTimeout(resolve, additionalWait));

    // Try to trigger any remaining lazy-loaded content
    await page.evaluate(() => {
      // Scroll to trigger lazy loading
      window.scrollTo(0, document.body.scrollHeight);
      setTimeout(() => window.scrollTo(0, 0), 100);
      
      // Trigger any intersection observers
      const elements = document.querySelectorAll('*');
      elements.forEach(el => {
        const event = new Event('intersectionchange');
        el.dispatchEvent(event);
      });
    });

    // Final wait for any remaining content
    await new Promise((resolve) => setTimeout(resolve, 1000));

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
