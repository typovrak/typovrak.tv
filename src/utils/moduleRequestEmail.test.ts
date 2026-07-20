import { describe, expect, it } from "vitest";
import { buildModuleRequestEmail, escapeHtml } from "./moduleRequestEmail";

const siteUrl = "https://typovrak.tv/";

describe("escapeHtml", () => {
  it("escapes the characters that could break out of the markup", () => {
    expect(escapeHtml(`<script>"x" & 'y'</script>`)).toBe(
      "&lt;script&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/script&gt;"
    );
  });
});

describe("buildModuleRequestEmail", () => {
  it("puts the submitted values in the subject and body", () => {
    const mail = buildModuleRequestEmail({
      module: "waybar",
      details: "A status bar",
      siteUrl,
    });

    expect(mail.subject).toBe("Module request received: waybar");
    expect(mail.html).toContain("waybar");
    expect(mail.text).toContain("A status bar");
  });

  it("escapes submitted values so they cannot inject markup", () => {
    const mail = buildModuleRequestEmail({
      module: "<img src=x onerror=alert(1)>",
      details: "</p><script>alert(2)</script>",
      siteUrl,
    });

    expect(mail.html).not.toContain("<img src=x");
    expect(mail.html).not.toContain("<script>alert(2)</script>");
    expect(mail.html).toContain("&lt;img src=x");
  });

  it("builds absolute links from the site URL", () => {
    const mail = buildModuleRequestEmail({
      module: "bat",
      details: "cat clone",
      siteUrl,
    });

    expect(mail.html).toContain("https://typovrak.tv/nixos");
    expect(mail.html).toContain("https://typovrak.tv/privacy-policy");
  });
});
