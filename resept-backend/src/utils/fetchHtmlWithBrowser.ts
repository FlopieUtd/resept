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
let pageContext: Page | null = null;

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
  
  // Try to reuse existing page context for better session persistence
  let page: Page;
  if (pageContext && !pageContext.isClosed()) {
    page = pageContext;
    console.log("Browser: Reusing existing page context for session persistence");
  } else {
    page = await browser.newPage();
    pageContext = page;
    console.log("Browser: Created new page context");
  }

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
    const randomDelay = Math.random() * 3000 + 2000; // 2-5 seconds
    await new Promise(resolve => setTimeout(resolve, randomDelay));

    // Set up additional stealth measures before navigation
    await page.evaluateOnNewDocument(() => {
      // Override Date to appear more human-like
      const originalDate = Date;
      Date = class extends originalDate {
        constructor(...args: any[]) {
          if (args.length === 0) {
            // Add some randomness to the current time
            super(originalDate.now() + Math.random() * 1000);
          } else {
            super(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
          }
        }
      } as any;

      // Mock more realistic screen properties
      Object.defineProperty(screen, 'availHeight', { get: () => 1055 + Math.floor(Math.random() * 100) });
      Object.defineProperty(screen, 'availWidth', { get: () => 1920 + Math.floor(Math.random() * 100) });
      Object.defineProperty(screen, 'height', { get: () => 1080 + Math.floor(Math.random() * 100) });
      Object.defineProperty(screen, 'width', { get: () => 1920 + Math.floor(Math.random() * 100) });

      // Mock realistic memory info
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });

      // Mock realistic connection info
      Object.defineProperty(navigator, 'connection', {
        get: () => ({
          effectiveType: '4g',
          downlink: 10,
          rtt: 50,
          saveData: false
        })
      });

      // Mock realistic battery API
      Object.defineProperty(navigator, 'getBattery', {
        value: () => Promise.resolve({
          charging: true,
          chargingTime: 0,
          dischargingTime: Infinity,
          level: 0.8 + Math.random() * 0.2
        })
      });
    });

    // Navigate to the page with more realistic settings
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
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
      console.log("Browser: Cloudflare challenge detected, implementing advanced bypass...");
      
      // Step 1: Simulate realistic human behavior
      await page.evaluate(() => {
        // Simulate realistic mouse movements
        const events = ['mousemove', 'mousedown', 'mouseup', 'click', 'scroll'];
        events.forEach(eventType => {
          const event = new MouseEvent(eventType, {
            clientX: Math.random() * window.innerWidth,
            clientY: Math.random() * window.innerHeight,
            bubbles: true,
            cancelable: true
          });
          document.dispatchEvent(event);
        });
      });

      // Step 2: Wait and simulate more human behavior
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
      
      // Step 3: Try to interact with any visible elements
      try {
        const clickableElements = await page.$$('button, a, input[type="button"], input[type="submit"]');
        if (clickableElements.length > 0) {
          const randomElement = clickableElements[Math.floor(Math.random() * clickableElements.length)];
          await randomElement.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (e) {
        // Ignore click errors
      }

      // Step 4: Try to solve any visible challenges
      try {
        // Look for Turnstile or other challenge widgets
        const turnstileWidget = await page.$('[data-sitekey]');
        if (turnstileWidget) {
          console.log("Browser: Found Turnstile widget, attempting to solve...");
          await turnstileWidget.click();
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } catch (e) {
        // Ignore widget interaction errors
      }

      // Step 5: Wait for challenge completion with multiple strategies
      try {
        // Strategy 1: Wait for content change
        await page.waitForFunction(
          () => {
            const bodyText = document.body.innerHTML;
            return !bodyText.includes("Just a moment...") &&
                   !bodyText.includes("Enable JavaScript and cookies to continue") &&
                   !bodyText.includes("Verifying you are human") &&
                   !bodyText.includes("challenge-platform") &&
                   bodyText.length > 10000; // Ensure we have substantial content
          },
          { timeout: 30000 }
        );
        console.log("Browser: Cloudflare challenge completed via content change");
      } catch (error1) {
        console.log("Browser: Content change strategy failed, trying URL change...");
        
        try {
          // Strategy 2: Wait for URL change (redirect after challenge)
          await page.waitForFunction(
            () => {
              return !window.location.href.includes('__cf_chl_tk') && 
                     !window.location.href.includes('__cf_chl_rt_tk');
            },
            { timeout: 20000 }
          );
          console.log("Browser: Cloudflare challenge completed via URL change");
        } catch (error2) {
          console.log("Browser: URL change strategy failed, trying network activity...");
          
          try {
            // Strategy 3: Wait for network activity to settle
            await page.waitForFunction(
              () => {
                const performanceEntries = performance.getEntriesByType('navigation');
                return performanceEntries.length > 0 && 
                       (performanceEntries[0] as PerformanceNavigationTiming).loadEventEnd > 0;
              },
              { timeout: 15000 }
            );
            console.log("Browser: Cloudflare challenge completed via network activity");
          } catch (error3) {
            console.log("Browser: All challenge strategies failed, continuing with current content...");
            
            // Final attempt: Try to trigger any remaining JavaScript
            await page.evaluate(() => {
              // Trigger all possible events
              const events = ['load', 'DOMContentLoaded', 'readystatechange', 'pageshow'];
              events.forEach(eventType => {
                window.dispatchEvent(new Event(eventType));
                document.dispatchEvent(new Event(eventType));
              });
              
              // Try to trigger any lazy loading
              window.scrollTo(0, document.body.scrollHeight);
              setTimeout(() => window.scrollTo(0, 0), 100);
            });
          }
        }
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
    // Don't close the page if we're reusing it for session persistence
    // The page will be closed when closeBrowser() is called
  }
};

export const closeBrowser = async (): Promise<void> => {
  if (pageContext && !pageContext.isClosed()) {
    await pageContext.close();
    pageContext = null;
    console.log("Browser: Page context closed");
  }
  if (browser) {
    await browser.close();
    browser = null;
    console.log("Browser: Browser closed");
  }
};
