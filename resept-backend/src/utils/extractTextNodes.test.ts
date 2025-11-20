import { extractTextNodes } from "./extractTextNodes";

describe("extractTextNodes", () => {
  it("should strip HTML tags from text content", () => {
    const html = `
      <div>
        <p>This is a <strong>bold</strong> paragraph with <em>italic</em> text.</p>
        <span>Some <b>text</b> in a span</span>
        <div>Another <i>div</i> with <u>underlined</u> content</div>
      </div>
    `;

    const result = extractTextNodes(html);

    // Verify no HTML tags remain in the extracted text
    result.forEach((node) => {
      expect(node.text).not.toMatch(/<[^>]*>/);
    });

    // Check that we get text content from different elements
    const allText = result.map((node) => node.text).join(" ");
    expect(allText).toContain("This is a");
    expect(allText).toContain("bold");
    expect(allText).toContain("paragraph with");
    expect(allText).toContain("italic");
    expect(allText).toContain("text");
    expect(allText).toContain(
      "This is a bold paragraph with italic text. Some text in a span Another div with underlined content"
    );
    expect(allText).toContain("Another div with underlined content");
  });

  it("should handle mixed HTML and text content", () => {
    const html = `
      <body>
        <h1>Recipe Title</h1>
        <p>Instructions: <br>1. Mix <strong>ingredients</strong><br>2. Bake at <em>350°F</em></p>
        <ul>
          <li>2 cups <b>flour</b></li>
          <li>1 cup <i>sugar</i></li>
        </ul>
      </body>
    `;

    const result = extractTextNodes(html);

    // Check that HTML tags are stripped but content is preserved
    const allText = result.map((node) => node.text).join(" ");
    expect(allText).toContain("Mix ingredients");
    expect(allText).toContain("Bake at 350°F");
    expect(allText).toContain("2 cups flour");
    expect(allText).toContain("1 cup sugar");

    // Verify no HTML tags remain
    result.forEach((node) => {
      expect(node.text).not.toMatch(/<[^>]*>/);
    });
  });

  it("should preserve text content while removing tags", () => {
    const html = "<div>Simple text</div>";
    const result = extractTextNodes(html);

    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("Simple text");
    expect(result[0].text).not.toMatch(/<[^>]*>/);
  });

  it("should handle empty HTML", () => {
    const result = extractTextNodes("");
    expect(result).toEqual([]);
  });

  it("should handle HTML with only tags", () => {
    const html = "<div><p><span></span></p></div>";
    const result = extractTextNodes(html);

    // Should return empty array since there's no actual text content
    expect(result).toEqual([]);
  });

  it("should create text nodes with proper depth and element type", () => {
    const html = "<div><p>Text in <strong>paragraph</strong></p></div>";
    const result = extractTextNodes(html);

    expect(result.length).toBeGreaterThan(0);

    result.forEach((node) => {
      expect(node).toHaveProperty("depth");
      expect(node).toHaveProperty("elementType");
      expect(node).toHaveProperty("text");
      expect(typeof node.depth).toBe("number");
      expect(typeof node.elementType).toBe("string");
      expect(typeof node.text).toBe("string");
      expect(node.text).not.toMatch(/<[^>]*>/);
    });
  });
});
