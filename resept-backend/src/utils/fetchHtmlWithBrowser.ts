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
    browser = await puppeteer.launch({
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
      ],
    });
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

    // Navigate to the page
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    console.log("Browser: Page loaded, waiting for content...");

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
