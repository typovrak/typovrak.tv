---
title: The three fzf bindings I use every day
pubDatetime: 2026-06-09T11:20:00Z
tags:
  - cli
  - tools
description: fzf ships with shell bindings that most people never turn on. These are the ones worth the muscle memory.
---

`fzf` is a fuzzy finder that reads lines on stdin and prints the one you pick. Its shell integration wires that into three key bindings, and those are what make it stick.

## Ctrl-R, history that works

The default reverse-history search matches one substring. `fzf` replaces it with fuzzy matching over the whole history:

```sh
source <(fzf --zsh)
```

After that, `Ctrl-R` fuzzy-searches every command you have run. Typing `gicm` finds `git commit -m`, out of order, no exact substring needed.

## Ctrl-T, files into the command line

`Ctrl-T` inserts a file path chosen with the finder. It reads `FZF_DEFAULT_COMMAND`, so point that at `fd` and it respects gitignore:

```sh
export FZF_DEFAULT_COMMAND='fd --type f'
```

## Alt-C, cd into a subdirectory

`Alt-C` fuzzy-finds a directory below the current one and `cd`s into it. On a deep source tree this replaces four `cd` commands with four keystrokes.

## The pattern underneath

None of this is special to those bindings. `fzf` is a filter, and anything that emits lines can feed it. Once the reflex forms, you start piping other commands through it without thinking about the key bindings at all.
