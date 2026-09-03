import { describe, expect, it } from "vitest";
import {
  campaignName,
  countryCode,
  deviceClass,
  INTERNAL,
  isBot,
  referrerHost,
} from "./requestInfo";

const FIREFOX_LINUX =
  "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0";
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
const IPAD =
  "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15";

describe("isBot", () => {
  it("catches common crawlers", () => {
    expect(isBot("Googlebot/2.1 (+http://www.google.com/bot.html)")).toBe(true);
    expect(isBot("Mozilla/5.0 (compatible; bingbot/2.0)")).toBe(true);
    expect(isBot("curl/8.5.0")).toBe(true);
  });

  it("lets real browsers through", () => {
    expect(isBot(FIREFOX_LINUX)).toBe(false);
    expect(isBot(IPHONE)).toBe(false);
  });

  it("treats a missing user-agent as a browser, not a bot", () => {
    expect(isBot("")).toBe(false);
  });
});

describe("deviceClass", () => {
  it("classifies without keeping the raw user-agent", () => {
    expect(deviceClass(FIREFOX_LINUX)).toBe("desktop");
    expect(deviceClass(IPHONE)).toBe("mobile");
    expect(deviceClass(IPAD)).toBe("tablet");
  });

  it("falls back to desktop on an unknown agent", () => {
    expect(deviceClass("")).toBe("desktop");
  });

  it("only ever returns one of three values, never the agent itself", () => {
    for (const ua of [FIREFOX_LINUX, IPHONE, IPAD, "", "whatever"]) {
      expect(["mobile", "tablet", "desktop"]).toContain(deviceClass(ua));
    }
  });
});

describe("referrerHost", () => {
  it("keeps only the host, never the query string", () => {
    expect(
      referrerHost(
        "https://www.google.com/search?q=my+private+query",
        "typovrak.tv"
      )
    ).toBe("www.google.com");
  });

  it("marks internal navigation instead of confusing it with a direct arrival", () => {
    expect(referrerHost("https://typovrak.tv/posts/x", "typovrak.tv")).toBe(
      INTERNAL
    );
    expect(referrerHost(null, "typovrak.tv")).toBeNull();
  });

  it("uses a token no hostname can produce, so the two can never collide", () => {
    expect(INTERNAL).not.toMatch(/^[a-z0-9.-]+$/i);
  });

  it("keeps the path of an internal referrer out of the value", () => {
    expect(
      referrerHost("https://typovrak.tv/posts/secret?q=private", "typovrak.tv")
    ).toBe(INTERNAL);
  });

  it("handles a missing or malformed referrer", () => {
    expect(referrerHost(null, "typovrak.tv")).toBeNull();
    expect(referrerHost("not-a-url", "typovrak.tv")).toBeNull();
  });

  it("rejects a host that is not a hostname, since the header is attacker-controlled", () => {
    expect(referrerHost("https://evil.test/x", "typovrak.tv")).toBe(
      "evil.test"
    );
    expect(
      referrerHost(`https://${"a".repeat(300)}.test/x`, "typovrak.tv")
    ).toBeNull();
  });

  it("never returns markup", () => {
    for (const raw of [
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "https://x.test/<script>alert(1)</script>",
    ]) {
      const host = referrerHost(raw, "typovrak.tv");
      if (host !== null) expect(host).toMatch(/^[a-z0-9.-]+$/i);
    }
  });
});

describe("countryCode", () => {
  it("accepts an ISO alpha-2 code", () => {
    expect(countryCode("FR")).toBe("FR");
    expect(countryCode("fr")).toBe("FR");
  });

  it("rejects anything else, the header being attacker-controlled", () => {
    expect(countryCode(null)).toBeNull();
    expect(countryCode("")).toBeNull();
    expect(countryCode("FRA")).toBeNull();
    expect(countryCode("<script>alert(1)</script>")).toBeNull();
    expect(countryCode("'; DROP TABLE page_view; --")).toBeNull();
  });
});

describe("campaignName", () => {
  const allowed = ["reddit-nixos", "hn"];

  it("accepts a source from the list, case-insensitively", () => {
    expect(campaignName("reddit-nixos", allowed)).toBe("reddit-nixos");
    expect(campaignName("Reddit-NixOS", allowed)).toBe("reddit-nixos");
    expect(campaignName("  hn  ", allowed)).toBe("hn");
  });

  it("drops anything not on the list rather than storing it", () => {
    expect(campaignName("reddit", allowed)).toBeNull();
    expect(campaignName("gclid-abc123", allowed)).toBeNull();
    expect(campaignName("user@example.com", allowed)).toBeNull();
  });

  it("drops a missing or empty value", () => {
    expect(campaignName(null, allowed)).toBeNull();
    expect(campaignName("", allowed)).toBeNull();
  });

  it("never returns markup or sql, since the value comes from a url", () => {
    expect(campaignName("<script>alert(1)</script>", allowed)).toBeNull();
    expect(
      campaignName("'; DROP TABLE page_view_event; --", allowed)
    ).toBeNull();
  });

  it("stores nothing at all when the list is empty", () => {
    expect(campaignName("reddit-nixos", [])).toBeNull();
  });
});
