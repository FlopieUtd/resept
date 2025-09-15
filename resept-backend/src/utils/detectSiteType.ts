interface SiteAnalysis {
  isSPA: boolean;
  isMinimal: boolean;
  needsBrowser: boolean;
}

export const detectSiteType = (html: string): SiteAnalysis => {
  const textContent = html.replace(/<[^>]+>/g, "").trim();

  // Detect Cloudflare challenge pages
  const isCloudflareChallenge =
    html.includes("Just a moment...") ||
    html.includes("Enable JavaScript and cookies to continue") ||
    html.includes("_cf_chl_opt") ||
    html.includes("challenge-platform");

  // More flexible root div detection using regex
  const rootDivPattern = /<div[^>]*id=["'](root|app|__next)["'][^>]*>/i;
  const hasRootDiv = rootDivPattern.test(html);

  const isShort = html.length < 8000;
  const hasLittleText = textContent.length < 2000;
  const hasFrameworkMarkers =
    html.includes("data-reactroot") ||
    html.includes("__NEXT_DATA__") ||
    html.includes("window.__INITIAL_STATE__") ||
    html.includes("data-v-") ||
    html.includes("__VUE_DEVTOOLS_GLOBAL_HOOK__") ||
    html.includes("ng-") ||
    html.includes("data-ng-") ||
    html.includes("x-ng-");

  const isSPA = hasRootDiv && (isShort || hasLittleText) && hasFrameworkMarkers;
  const isMinimal = isShort && hasLittleText;

  return {
    isSPA,
    isMinimal,
    needsBrowser: isSPA || isMinimal || isCloudflareChallenge,
  };
};
