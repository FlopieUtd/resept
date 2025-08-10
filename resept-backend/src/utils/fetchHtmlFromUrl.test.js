import { fetchHtmlFromUrl } from "./fetchHtmlFromUrl.js";

// Mock fetch globally
global.fetch = jest.fn();

describe("htmlFetcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn(); // Mock console.log
  });

  describe("fetchHtmlFromUrl", () => {
    it("should fetch HTML successfully from a valid URL", async () => {
      const mockHtml = "<html><body>Test content</body></html>";
      const mockResponse = {
        text: jest.fn().mockResolvedValue(mockHtml),
      };

      global.fetch.mockResolvedValue(mockResponse);

      const result = await fetchHtmlFromUrl("https://example.com");

      expect(global.fetch).toHaveBeenCalledWith("https://example.com", {
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "text/html",
        },
      });
      expect(mockResponse.text).toHaveBeenCalled();
      expect(result).toBe(mockHtml);
      expect(console.log).toHaveBeenCalledWith(
        "Step 1: Fetching HTML from URL..."
      );
      expect(console.log).toHaveBeenCalledWith(
        "HTML fetched successfully, length: 38 characters"
      );
    });

    it("should handle fetch errors gracefully", async () => {
      const fetchError = new Error("Network error");
      global.fetch.mockRejectedValue(fetchError);

      await expect(fetchHtmlFromUrl("https://invalid-url.com")).rejects.toThrow(
        "Network error"
      );

      expect(global.fetch).toHaveBeenCalledWith("https://invalid-url.com", {
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "text/html",
        },
      });
    });

    it("should handle response.text() errors", async () => {
      const mockResponse = {
        text: jest.fn().mockRejectedValue(new Error("Text parsing error")),
      };

      global.fetch.mockResolvedValue(mockResponse);

      await expect(fetchHtmlFromUrl("https://example.com")).rejects.toThrow(
        "Text parsing error"
      );
    });

    it("should use correct headers and options", async () => {
      const mockResponse = {
        text: jest.fn().mockResolvedValue("<html></html>"),
      };

      global.fetch.mockResolvedValue(mockResponse);

      await fetchHtmlFromUrl("https://example.com");

      expect(global.fetch).toHaveBeenCalledWith("https://example.com", {
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "text/html",
        },
      });
    });

    it("should log correct character count for different HTML lengths", async () => {
      const shortHtml = "<html></html>";
      const mockResponse = {
        text: jest.fn().mockResolvedValue(shortHtml),
      };

      global.fetch.mockResolvedValue(mockResponse);

      await fetchHtmlFromUrl("https://example.com");

      expect(console.log).toHaveBeenCalledWith(
        "HTML fetched successfully, length: 13 characters"
      );
    });
  });
});
