// Confirmation email sent to whoever submits a module request. Kept free of
// astro:* imports so it stays unit-testable; the caller passes the site URL.
// Styling is inline because email clients strip <style> blocks, and the palette
// is Catppuccin Mocha to match the site.

type ModuleRequest = {
  module: string;
  details: string;
  siteUrl: string;
};

type Email = {
  subject: string;
  html: string;
  text: string;
};

// The submitted values land in HTML, so they must never be interpolated raw.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const MOCHA = {
  crust: "#11111b",
  mantle: "#181825",
  base: "#1e1e2e",
  surface0: "#313244",
  overlay0: "#6c7086",
  subtext0: "#a6adc8",
  text: "#cdd6f4",
  green: "#a6e3a1",
};

const FONT =
  "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

export function buildModuleRequestEmail({
  module,
  details,
  siteUrl,
}: ModuleRequest): Email {
  const nixosUrl = new URL("nixos", siteUrl).href;
  const privacyUrl = new URL("privacy-policy", siteUrl).href;
  const host = new URL(siteUrl).host;

  const subject = `Module request received: ${module}`;

  const text = [
    "Module request received",
    "",
    "Thanks for the request. Here is what I received.",
    "",
    `Module: ${module}`,
    "Details:",
    details,
    "",
    "I read every request. If I build it, the module lands on the NixOS page",
    "with the Catppuccin Mocha green theme, wired to fit my configuration.",
    "",
    `Browse the modules: ${nixosUrl}`,
    "",
    `You received this because you sent a module request on ${host}.`,
    "Your email is stored only so I can reply, and you can ask me to delete it",
    `at any time. Privacy policy: ${privacyUrl}`,
  ].join("\n");

  const label = `margin:0 0 6px;color:${MOCHA.subtext0};font-size:12px;letter-spacing:0.06em;text-transform:uppercase;`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(subject)}</title>
<style>
a{color:${MOCHA.green};}
a[x-apple-data-detectors]{color:inherit !important;text-decoration:none !important;}
</style>
</head>
<body style="margin:0;padding:0;background:${MOCHA.crust};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${MOCHA.crust};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:${MOCHA.base};border:1px solid ${MOCHA.surface0};border-radius:12px;font-family:${FONT};">
<tr><td style="padding:28px 28px 0;">
<p style="margin:0;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;"><a href="${siteUrl}" style="color:${MOCHA.green};text-decoration:none;"><span style="color:${MOCHA.green};">${escapeHtml(host)}</span></a></p>
<h1 style="margin:12px 0 0;color:${MOCHA.text};font-size:22px;line-height:1.3;font-weight:700;">Module request received</h1>
<p style="margin:14px 0 0;color:${MOCHA.subtext0};font-size:14px;line-height:1.6;">Thanks for the request. Here is what I received.</p>
</td></tr>
<tr><td style="padding:22px 28px 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${MOCHA.mantle};border:1px solid ${MOCHA.surface0};border-radius:8px;">
<tr><td style="padding:18px;">
<p style="${label}">Module</p>
<p style="margin:0 0 18px;color:${MOCHA.green};font-size:16px;font-weight:700;">${escapeHtml(module)}</p>
<p style="${label}">Details</p>
<p style="margin:0;color:${MOCHA.text};font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(details)}</p>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:22px 28px 0;">
<p style="margin:0;color:${MOCHA.subtext0};font-size:14px;line-height:1.6;">I read every request. If I build it, the module lands on the NixOS page with the Catppuccin Mocha green theme, wired to fit my configuration.</p>
</td></tr>
<tr><td style="padding:24px 28px 4px;">
<a href="${nixosUrl}" style="display:inline-block;background:${MOCHA.green};color:${MOCHA.crust};text-decoration:none;font-weight:700;font-size:14px;padding:11px 18px;border-radius:8px;">Browse the modules</a>
</td></tr>
<tr><td style="padding:22px 28px 26px;">
<p style="margin:0;padding-top:18px;border-top:1px solid ${MOCHA.surface0};color:${MOCHA.overlay0};font-size:12px;line-height:1.6;">You received this because you sent a module request on <a href="${siteUrl}" style="color:${MOCHA.green};text-decoration:none;"><span style="color:${MOCHA.green};">${escapeHtml(host)}</span></a>. Your email is stored only so I can reply, and you can ask me to delete it at any time. <a href="${privacyUrl}" style="color:${MOCHA.green};text-decoration:underline;"><span style="color:${MOCHA.green};">Privacy policy</span></a>.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject, html, text };
}
