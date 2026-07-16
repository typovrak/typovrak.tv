// Pure visibility rule, split from postFilter (which reads config and
// import.meta.env.DEV) so the scheduled-post logic can be tested with fake
// timers. This is the only guard against publishing a draft or a future post
// early, and its behaviour differs between dev and prod, so it is the case
// least likely to be caught by hand.

export function isPostPublished(
  post: { draft?: boolean; pubDatetime: Date },
  opts: { now: number; margin: number; isDev: boolean }
): boolean {
  if (post.draft) return false;
  if (opts.isDev) return true;
  return opts.now > post.pubDatetime.getTime() - opts.margin;
}
