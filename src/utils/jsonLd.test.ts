import { describe, expect, it } from "vitest";
import { serialiseJsonLd } from "./jsonLd";

describe("serialiseJsonLd", () => {
  it("escapes a closing script tag, which would otherwise break out of ld+json", () => {
    const out = serialiseJsonLd({
      headline: "</script><img src=x onerror=alert(1)>",
    });
    expect(out).not.toContain("</script>");
    expect(out).not.toContain("<img");
    expect(out).toContain("\\u003c");
  });

  it("escapes every angle bracket and ampersand", () => {
    expect(serialiseJsonLd({ a: "<>&" })).not.toMatch(/[<>&]/);
  });

  it("escapes line separators, which are valid JSON but terminate a JS line", () => {
    const out = serialiseJsonLd({ a: "x\u2028y\u2029z" });
    expect(out).not.toMatch(/[\u2028\u2029]/);
    expect(out).toContain("\\u2028");
    expect(out).toContain("\\u2029");
  });

  it("still parses back to the original value", () => {
    const data = {
      headline: "</script> & <b>bold</b>\u2028next",
      author: { name: "typovrak" },
    };
    expect(JSON.parse(serialiseJsonLd(data))).toEqual(data);
  });

  it("leaves ordinary content readable", () => {
    expect(serialiseJsonLd({ a: "hello" })).toBe('{"a":"hello"}');
  });
});
