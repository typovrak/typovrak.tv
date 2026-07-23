---
title: Why ripgrep replaced grep in my workflow
pubDatetime: 2026-03-04T14:30:00Z
tags:
  - cli
  - tools
description: ripgrep is faster than grep and respects gitignore by default. Here is how I use it.
---

`grep -r` still works. I stopped reaching for it because `rg` does the same search faster and skips the noise without being told.

## The default that matters

`rg` reads your `.gitignore` and skips it. Searching a Node project for a string no longer returns four thousand hits from `node_modules`. That single default is most of the reason I switched.

```sh
rg "getSql" src/
```

## Filtering by type

Instead of remembering `--include` glob syntax, `rg` has named types:

```sh
rg --type ts "prerender"
rg --type-not test "TODO"
```

`rg --type-list` prints what it knows. It covers the languages I touch.

## Replacing, previewing first

`rg` does not edit files, and I prefer that. It prints what a replacement would look like, and I pipe the real edit through `sed` or my editor once I trust the match:

```sh
rg "oldName" --replace "newName"
```

## When I still use grep

Piped output from another command, where the input is a stream and not a tree of files. `ps aux | grep ssh` is muscle memory, and `rg` buys nothing there. For anything that walks a directory, `rg` wins.
