/**
 * Shiki transformer that makes a ```console block read like the terminal it
 * came from.
 *
 * The shellsession grammar splits the line into tokens but catppuccin-mocha
 * gives them all the foreground colour, so a session renders as one flat grey
 * wall where nothing separates what you type from what the program prints, and
 * nothing separates a 404 from an ordinary line of output. Two rules fix that:
 * the command after the `$` takes the site accent, and an output line that
 * announces its own severity takes the matching colour.
 *
 * Scoped to `console` on purpose: in a ```bash block a leading `$` is not a
 * prompt, `#` is a comment rather than a root prompt anywhere on this site, and
 * the word Error in a shell script is not a diagnostic.
 */

// leading severity, the shapes real tools print: "Error:", "Warning ",
// "[WARN]", "prisma:warn". Anything further into the line is prose.
const DANGER = /^(?:\[err(?:or)?\]|\w+:err(?:or)?\b|err(?:or)?\b|fatal\b)/i;
const WARNING = /^(?:\[warn(?:ing)?\]|\w+:warn(?:ing)?\b|warn(?:ing)?\b)/i;

const paint = (tokens, colour) => {
  for (const token of tokens) {
    if (token.type !== "element") continue;
    token.properties.style = `color:${colour}`;
  }
};

export const transformerConsoleSession = () => ({
  name: "console-session",
  line(node) {
    if (this.options.lang !== "console") return;
    const [first, ...rest] = node.children;
    if (first?.type !== "element") return;

    if (first.children?.[0]?.value === "$") {
      paint(rest, "var(--accent)");
      return;
    }

    const line = node.children
      .map(token => token.children?.[0]?.value ?? "")
      .join("");
    if (DANGER.test(line)) paint(node.children, "var(--danger)");
    else if (WARNING.test(line)) paint(node.children, "var(--warning)");
  },
});
