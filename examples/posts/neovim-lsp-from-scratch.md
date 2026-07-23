---
title: Setting up the Neovim LSP without a plugin manager
pubDatetime: 2026-04-18T08:15:00Z
modDatetime: 2026-05-02T10:00:00Z
featured: true
tags:
  - neovim
  - cli
  - tools
description: Native LSP configuration in Neovim 0.11, using the built-in vim.lsp API and nothing else.
---

Neovim 0.11 ships enough LSP support that a distribution is optional. I run a config small enough to read in one sitting.

## Table of contents

## The pieces

Three things do the work: a language server on your `PATH`, `vim.lsp.config` to describe it, and `vim.lsp.enable` to turn it on. No `mason`, no `lspconfig`, no manager.

```lua
vim.lsp.config("lua_ls", {
  cmd = { "lua-language-server" },
  filetypes = { "lua" },
  root_markers = { ".luarc.json", ".git" },
})

vim.lsp.enable("lua_ls")
```

The `root_markers` list is how the server decides what the project root is. Order matters: the first marker found wins.

## Completion

Neovim 0.11 has `vim.lsp.completion`. Bind it once and you get completion without a completion plugin:

```lua
vim.api.nvim_create_autocmd("LspAttach", {
  callback = function(args)
    vim.lsp.completion.enable(true, args.data.client_id, args.buf, {
      autotrigger = true,
    })
  end,
})
```

## What you give up

A distribution gives you sane defaults for forty languages you do not use. Doing it by hand means you configure each server the day you need it. For me that is a feature, because the config only ever holds things I actually run.
