import { describe, expect, it } from "vitest";
import {
  captchaSvg,
  issueCaptchaToken,
  randomCode,
  verifyCaptcha,
} from "./captcha";

const secret = "test-secret";

describe("randomCode", () => {
  it("avoids characters that look alike once distorted", () => {
    const codes = Array.from({ length: 200 }, () => randomCode()).join("");
    expect(codes).not.toMatch(/[01OIL]/);
    expect(randomCode()).toHaveLength(6);
  });
});

describe("verifyCaptcha", () => {
  it("accepts the code that was issued", () => {
    const token = issueCaptchaToken("ABC234", secret);
    expect(verifyCaptcha(token, "ABC234", secret)).toBe(true);
  });

  it("is case insensitive and ignores surrounding spaces", () => {
    const token = issueCaptchaToken("ABC234", secret);
    expect(verifyCaptcha(token, " abc234 ", secret)).toBe(true);
  });

  it("rejects a wrong code", () => {
    const token = issueCaptchaToken("ABC234", secret);
    expect(verifyCaptcha(token, "ABC235", secret)).toBe(false);
  });

  it("rejects a token signed with another secret", () => {
    const token = issueCaptchaToken("ABC234", "other-secret");
    expect(verifyCaptcha(token, "ABC234", secret)).toBe(false);
  });

  it("rejects an expired token", () => {
    const now = Date.now();
    const token = issueCaptchaToken("ABC234", secret, now);
    const later = now + 11 * 60 * 1000;
    expect(verifyCaptcha(token, "ABC234", secret, later)).toBe(false);
  });

  it("rejects a tampered expiry", () => {
    const token = issueCaptchaToken("ABC234", secret);
    const forged = `${Date.now() + 60 * 60 * 1000}.${token.split(".")[1]}`;
    expect(verifyCaptcha(forged, "ABC234", secret)).toBe(false);
  });

  it("rejects malformed input", () => {
    expect(verifyCaptcha(null, "ABC234", secret)).toBe(false);
    expect(verifyCaptcha("nodot", "ABC234", secret)).toBe(false);
    expect(verifyCaptcha(`${Date.now() + 1000}.`, "ABC234", secret)).toBe(
      false
    );
  });
});

describe("captchaSvg", () => {
  it("draws every character and stays theme aware", () => {
    const svg = captchaSvg("ABC234");
    for (const char of "ABC234") expect(svg).toContain(`>${char}</text>`);
    expect(svg).toContain("currentColor");
    expect(svg).not.toMatch(/#[0-9a-f]{3,6}/i);
  });
});
