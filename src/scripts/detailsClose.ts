// Wires up the close buttons rehypeDetailsClose appends to each <details>.
// Native disclosures only toggle from their <summary>, so a long open block
// forces the reader back up to collapse it. One delegated listener handles every
// disclosure on the page; closing returns the reader (and focus) to the summary.
// No ClientRouter here, so this runs once on load and never re-binds.

function onClick(event: MouseEvent): void {
  const target = event.target as Element | null;
  const button = target?.closest(".details-close");
  if (!button) return;

  const details = button.closest("details");
  if (!(details instanceof HTMLDetailsElement)) return;

  details.open = false;
  const summary = details.querySelector("summary");
  summary?.scrollIntoView({ block: "nearest" });
  (summary as HTMLElement | null)?.focus();
}

document.addEventListener("click", onClick);
