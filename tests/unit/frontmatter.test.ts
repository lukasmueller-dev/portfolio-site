import { describe, expect, it } from "vitest";
import { parseKvLine, splitFrontmatter } from "../../lib/frontmatter";

describe("splitFrontmatter", () => {
  it("splits a --- fence", () => {
    const { block, body } = splitFrontmatter("---\ntitle: Post\n---\nBody.");
    expect(block).toBe("title: Post");
    expect(body).toBe("Body.");
  });

  it("tolerates trailing whitespace on the fence markers", () => {
    const { block, body } = splitFrontmatter("--- \ntitle: Post\n---   \nBody.");
    expect(block).toBe("title: Post");
    expect(body).toBe("Body.");
  });
});

describe("parseKvLine", () => {
  it("parses a plain key: value line", () => {
    expect(parseKvLine("title: Post")).toEqual({ key: "title", value: "Post" });
  });

  it("parses an indented key: value line instead of dropping it", () => {
    expect(parseKvLine("  title: Post")).toEqual({ key: "title", value: "Post" });
  });

  it("returns null for blank and comment lines", () => {
    expect(parseKvLine("")).toBeNull();
    expect(parseKvLine("   ")).toBeNull();
    expect(parseKvLine("# a comment")).toBeNull();
    expect(parseKvLine("  # an indented comment")).toBeNull();
  });
});
