/**
 * JSON.stringify does not escape `<`, so a value containing `</script>` breaks
 * out of the ld+json block and injects HTML. `\u003c` is valid inside a JSON
 * string and parses back to `<`, so consumers are unaffected.
 * U+2028/U+2029 are legal in JSON but are line terminators in JS.
 */
export function serialiseJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
