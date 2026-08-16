// closes the parent <details> from the close button and returns focus to the
// summary. runs once on load; no client router here, so it never re-binds.

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
