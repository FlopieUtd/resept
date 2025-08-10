export const fetchHtmlFromUrl = async (url) => {
  console.log("Step 1: Fetching HTML from URL...");
  const html = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "text/html",
    },
  }).then((response) => response.text());

  console.log(`HTML fetched successfully, length: ${html.length} characters`);
  return html;
};
