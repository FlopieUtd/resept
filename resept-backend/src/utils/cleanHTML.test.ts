import { cleanHtml } from "./cleanHTML";

describe("cleanHtml with br tag parsing", () => {
  it("should parse br tags by wrapping content before each br in its own div", () => {
    const testHtml = `
      <div>
        hello<br/>there<br/>johnny
      </div>
    `;

    const result = cleanHtml(testHtml);

    // The result should contain the text nodes from the parsed structure
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);

    // Verify we get separate text nodes for each br-separated segment
    expect(result).toHaveLength(3);
    expect(result[0].text).toBe("hello");
    expect(result[1].text).toBe("there");
    expect(result[2].text).toBe("johnny");
  });
});
