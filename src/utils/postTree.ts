// Parses a post body into the markdown tree the terminal renderer walks. Reuses
// Astro's own processor so gfm tables and the rest parse exactly as on the
// site, and captures the tree from inside the pipeline since render() only
// hands back html. Free of astro:* imports, so it runs under vitest.
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import remarkMdx from "remark-mdx";
import type { Node } from "./terminal";

// mdx keeps its imports, exports and expressions as nodes of their own. They
// carry no prose, so they go; a jsx element is replaced by its children in
// case one ever wraps markdown.
const DROP = new Set(["mdxjsEsm", "mdxFlowExpression", "mdxTextExpression"]);
const UNWRAP = new Set(["mdxJsxFlowElement", "mdxJsxTextElement"]);

// The asciinema player is the one jsx element carrying something a terminal
// reader would otherwise never hear about, so it becomes a node of its own
// instead of being unwrapped into nothing.
type JsxNode = Node & {
  name?: string;
  attributes?: { name?: string; value?: unknown }[];
};

function castNode(node: Node): Node | undefined {
  const jsx = node as JsxNode;
  if (jsx.name !== "AsciinemaPlayer") return undefined;
  const attribute = (name: string) => {
    const found = jsx.attributes?.find(a => a.name === name);
    return typeof found?.value === "string" ? found.value : undefined;
  };
  const url = attribute("src");
  if (!url) return undefined;
  return { type: "asciinemaCast", url, alt: attribute("caption") ?? null };
}

export function stripMdx(node: Node): Node {
  if (!node.children) return node;
  node.children = node.children
    .filter(child => !DROP.has(child.type))
    .flatMap(child => {
      const cast = castNode(child);
      if (cast) return [cast];
      return UNWRAP.has(child.type)
        ? (stripMdx(child).children ?? [])
        : [stripMdx(child)];
    });
  return node;
}

export async function parsePostBody(
  body: string,
  options: { mdx: boolean }
): Promise<Node> {
  let tree: Node | undefined;
  const capture = () => (root: Node) => {
    tree = stripMdx(root);
  };
  // a .md post may hold raw <details> html, which the mdx parser would read
  // as jsx and unwrap, so the mdx grammar is only switched on for .mdx files
  const processor = await createMarkdownProcessor({
    gfm: true,
    smartypants: false,
    syntaxHighlight: false,
    remarkPlugins: options.mdx ? [remarkMdx, capture] : [capture],
  });
  await processor.render(body);
  if (!tree) throw new Error("markdown pipeline produced no tree");
  return tree;
}
