---
title: "Running freeCodeCamp on NixOS: the shell.nix Prisma needs"
pubDatetime: 2026-08-19T09:00:00Z
featured: true
draft: true
tags:
  - nixos
  - prisma
  - open-source
description: "Prisma ships no engine binary for NixOS, so pnpm i on freeCodeCamp dies in the api postinstall step. Here is the shell.nix that fixes it, why the engine version has to match, and what became of the issue I opened."
quiz:
  - q: "Why does prisma generate fail on NixOS?"
    options:
      - "NixOS ships no Node.js"
      - "Prisma has no precompiled engine for the linux-nixos target"
      - "pnpm refuses to run postinstall scripts"
      - "MongoDB is not packaged in nixpkgs"
    correct: [1]
    explain: "Prisma computes the binary target as linux-nixos, then tries to download an engine that was never published for it, so the fetch 404s."
  - q: "Which nixpkgs attribute matches Prisma 6.19.3?"
    options:
      - "prisma"
      - "prisma-engines"
      - "prisma-engines_6"
      - "prisma-engines_7"
    correct: [2]
    explain: "prisma-engines_6 is built from the 6.19.3 tag. The unsuffixed prisma-engines is 7.8.0, a different engine hash, and Prisma rejects it."
  - q: "What does nix-shell do with the prisma-engines setup hook?"
    options:
      - "Nothing, hooks only run in a derivation build"
      - "It exports the four PRISMA_* variables on its own"
      - "It patches node_modules after the install"
      - "It downloads the engines into the Nix store"
    correct: [1]
    explain: "prisma-engines_6 ships nix-support/setup-hook, which nix-shell sources, so the four variables are already set before any shellHook runs."
  - q: "Inside a Nix '' string, how do you write a literal shell variable?"
    options:
      - "$VAR"
      - "\\${VAR}"
      - "''${VAR}"
      - "$$VAR"
    correct: [2]
    explain: "${...} is Nix interpolation even inside a '' string. Two single quotes escape it back to a plain shell variable."
  - q: "What does pnpm --version print inside this shell?"
    options:
      - "11.9.0, the version nixpkgs installs"
      - "10.33.3, the version pinned in package.json"
      - "Whatever corepack last cached"
      - "It errors on a version mismatch"
    correct: [1]
    explain: "nixpkgs ships pnpm 11.9.0, but pnpm reads the packageManager field and hands over to 10.33.3."
  - q: "What happened to the freeCodeCamp issue?"
    multiple: true
    options:
      - "A bot closed it as not planned the same day"
      - "It was merged into the contributing docs"
      - "A request to reopen it went unanswered"
      - "A maintainer rejected the shell.nix on technical grounds"
    correct: [0, 2]
    explain: "camper-chan closed it as not planned on 12 July 2026, and neither the reopen request nor the follow-up got a human reply."
---

Prisma publishes no engine binary for NixOS, so `pnpm i` on [freeCodeCamp](https://github.com/freeCodeCamp/freeCodeCamp) dies in the `api` postinstall step before you have written a single line. The fix is a `shell.nix` at the root of the repo that hands Prisma the engines from nixpkgs, then `nix-shell` before `pnpm i`. Everything after that behaves like any other machine.

I hit this on 12 July 2026 while setting up a freeCodeCamp checkout, worked it out, and opened [issue #68755](https://github.com/freeCodeCamp/freeCodeCamp/issues/68755) with the fix plus [a PR](https://github.com/freeCodeCamp/freeCodeCamp/pull/68756) to put it in their troubleshooting docs. A bot closed it as not planned the same day. So the fix lives here instead.

Every command and every version below comes from my own machine: NixOS 26.05 (Yarara), nixpkgs 26.05, freeCodeCamp on Prisma 6.19.3.

## Table of contents

## Why does pnpm i fail on freeCodeCamp under NixOS?

Because `api/package.json` runs `prisma generate` as its postinstall script, and Prisma has no engine build for the `linux-nixos` target. Run the CLI outside a Nix shell and it says so in three stages:

```console
$ node node_modules/prisma/build/index.js --version
prisma:warn Prisma failed to detect the libssl/openssl version to use, and may not work as expected. Defaulting to "openssl-1.1.x".
Please manually install OpenSSL and try installing Prisma again.
Warning Precompiled engine files are not available for nixos, please provide the paths via environment variables, see https://pris.ly/d/custom-engines
Error: Failed to fetch sha256 checksum at https://binaries.prisma.sh/all_commits/c2990dca591cba766e3b7ef5d9e8a84796e47ab7/linux-nixos/schema-engine.gz.sha256 - 404 Not Found
```

Read it backwards and the whole story is there. Prisma could not find a system OpenSSL, because on NixOS libraries do not sit in `/usr/lib`, they sit in the store. It then detected the platform as `nixos` and admitted it has no precompiled engine for it. Finally it tried to download one anyway, from a URL that has never existed, and got a 404.

That commit hash, `c2990dca591cba766e3b7ef5d9e8a84796e47ab7`, is the engine revision pinned to Prisma 6.19.3. Remember it, it is the reason the next section is fussy about versions.

Nothing here is a freeCodeCamp bug. Any project with Prisma in its dependency tree fails the same way on NixOS.

## What goes in the shell.nix?

Four packages and four environment variables. Drop this at the root of the repo as `shell.nix`:

```nix
{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs_24
    pkgs.pnpm
    pkgs.openssl
    pkgs.prisma-engines_6
  ];

  shellHook = ''
    export PRISMA_QUERY_ENGINE_LIBRARY="${pkgs.prisma-engines_6}/lib/libquery_engine.node"
    export PRISMA_QUERY_ENGINE_BINARY="${pkgs.prisma-engines_6}/bin/query-engine"
    export PRISMA_SCHEMA_ENGINE_BINARY="${pkgs.prisma-engines_6}/bin/schema-engine"
    export PRISMA_FMT_BINARY="${pkgs.prisma-engines_6}/bin/prisma-fmt"
  '';
}
```

`nodejs_24` and `pnpm` come from what freeCodeCamp asks for in its root `package.json` (`"node": ">=24"`, `"pnpm": ">=10"`). `openssl` silences the libssl warning. `prisma-engines_6` is the Rust side of Prisma, built by nixpkgs from source. It is the exact thing the CLI was trying to download.

Each variable points at a real file in the store, and you can go and look at them:

```console
$ ls $(nix-build '<nixpkgs>' -A prisma-engines_6 --no-out-link)/{bin,lib}
bin:
prisma-fmt  query-engine  schema-engine

lib:
libquery_engine.node
```

| Variable                      | What it points at          | Used for                                                                      |
| ----------------------------- | -------------------------- | ----------------------------------------------------------------------------- |
| `PRISMA_QUERY_ENGINE_LIBRARY` | `lib/libquery_engine.node` | The Node-API engine `@prisma/client` loads at runtime to talk to the database |
| `PRISMA_QUERY_ENGINE_BINARY`  | `bin/query-engine`         | The standalone query engine, used by the binary engine type and by Studio     |
| `PRISMA_SCHEMA_ENGINE_BINARY` | `bin/schema-engine`        | Migrations, `db push`, introspection                                          |
| `PRISMA_FMT_BINARY`           | `bin/prisma-fmt`           | Formatting and validating `schema.prisma`                                     |

> [!tip] `${}` inside a `''` string is Nix, not bash
> In the `shellHook` above, `${pkgs.prisma-engines_6}` is evaluated by Nix and replaced with a store path before bash ever sees the line. For a shell variable in there, escape it as `''${HOME}`. Forgetting this is the classic first Nix bug, and the error message is not helpful about it.

## Why prisma-engines_6 and not prisma-engines?

Because the engine version has to match the Prisma version in the project, and the unsuffixed attribute is a different major. As of nixpkgs 26.05:

| Attribute          | Version | Built from         |
| ------------------ | ------- | ------------------ |
| `prisma-engines`   | 7.8.0   | `refs/tags/7.8.0`  |
| `prisma-engines_6` | 6.19.3  | `refs/tags/6.19.3` |
| `prisma-engines_7` | 7.8.0   | `refs/tags/7.8.0`  |

freeCodeCamp pins `prisma` and `@prisma/client` to 6.19.3 in `api/package.json`, so `prisma-engines_6` matches it to the patch. Reach for `prisma-engines` instead and you get 7.8.0, whose engine hash is not the `c2990dca...` the CLI wants. I tried it, and Prisma ignores the mismatched engine and goes back to downloading:

```console
Warning Precompiled engine files are not available for nixos, please provide the paths via environment variables, see https://pris.ly/d/custom-engines
Error: Failed to fetch sha256 checksum at https://binaries.prisma.sh/all_commits/c2990dca591cba766e3b7ef5d9e8a84796e47ab7/linux-nixos/libquery_engine.so.node.sha256 - 404 Not Found
```

Same 404, same hash, no progress. So the rule is: read the `prisma` version in `package.json`, pick the nixpkgs attribute with the same major, and check on [search.nixos.org](https://search.nixos.org/packages?channel=unstable&query=prisma-engines) that the minor lines up. When no attribute lines up, that project needs a nixpkgs pin.

## Do you still need the shellHook?

On current nixpkgs, no. `prisma-engines_6` ships a setup hook that exports all four variables for you, and `nix-shell` sources it:

```console
$ cat $(nix-build '<nixpkgs>' -A prisma-engines_6 --no-out-link)/nix-support/setup-hook
export PRISMA_SCHEMA_ENGINE_BINARY=".../bin/schema-engine"
export PRISMA_QUERY_ENGINE_BINARY=".../bin/query-engine"
export PRISMA_QUERY_ENGINE_LIBRARY=".../lib/libquery_engine.node"
export PRISMA_FMT_BINARY=".../bin/prisma-fmt"
```

A `shell.nix` with nothing but `buildInputs = [ pkgs.prisma-engines_6 ];` gives you a shell with all four already set. I only checked because I had been copying that `shellHook` between projects for months, assuming it was required.

I still ship it. Four lines is a cheap price for a file that reads the same to someone who has never met a Nix setup hook, and it keeps working on older nixpkgs from before the hook existed.

## How do you run it?

Enter the shell first, install second. The order matters, because the postinstall script is what needs the engines:

```bash
nix-shell
pnpm i
```

Then check Prisma agrees:

```console
$ node node_modules/prisma/build/index.js --version
prisma                  : 6.19.3
@prisma/client          : 6.19.3
Computed binaryTarget   : linux-nixos
Node.js                 : v24.16.0
Query Engine (Node-API) : libquery-engine 0000000000000000000000000000000000000000 (at /nix/store/...-prisma-engines_6-6.19.3/lib/libquery_engine.node, resolved by PRISMA_QUERY_ENGINE_LIBRARY)
Schema Engine           : schema-engine-cli 0000000000000000000000000000000000000000 (at /nix/store/...-prisma-engines_6-6.19.3/bin/schema-engine, resolved by PRISMA_SCHEMA_ENGINE_BINARY)
Default Engines Hash    : c2990dca591cba766e3b7ef5d9e8a84796e47ab7
```

`resolved by PRISMA_QUERY_ENGINE_LIBRARY` is the line that says it worked. The all-zero hashes are normal: nixpkgs builds from the release tag without stamping a git revision into the binary, and Prisma skips its hash check when you hand it an explicit path.

From here the rest of the [contributing guide](https://contribute.freecodecamp.org/) applies unchanged. Seed the database and run `pnpm develop`.

> [!warning] Add shell.nix to your global gitignore, not the repo's
> `shell.nix` is your environment, not freeCodeCamp's, and their `.gitignore` has no reason to carry it. Put it in `~/.config/git/ignore` so it never shows up in `git status` on any repo you do this to.

## Which pnpm actually runs?

Not the one Nix installed. nixpkgs ships pnpm 11.9.0, freeCodeCamp pins `"packageManager": "pnpm@10.33.3"`, and pnpm 10 and up honour that field by fetching and handing over to the pinned version:

```console
$ which pnpm
/nix/store/gfrj5gwr59daw5qi72phra770mi0xvh1-pnpm-11.9.0/bin/pnpm
$ pnpm --version
10.33.3
```

Knowing this saves you an evening of wondering why your carefully declared pnpm is not the one producing the lockfile. It also means one part of the install reaches outside the store, which dents the purity a NixOS user came for. Setting `manage-package-manager-versions=false` puts the Nix pnpm back in charge, at the cost of running a different version from every other contributor.

## Why has Prisma not fixed this?

The gap has been open for years and there is no sign of it closing. Three threads land on the same workaround:

- [prisma/prisma#3120](https://github.com/prisma/prisma/issues/3120), the original "Running prisma on NixOS" report.
- [Unable to use Prisma on NixOS](https://discourse.nixos.org/t/unable-to-use-prisma-on-nixos/54082) on the NixOS Discourse, which is where most people find the four variables.
- [prisma/prisma#29150](https://github.com/prisma/prisma/issues/29150), opened 6 February 2026: Prisma 7 still tries to download Rust binaries on NixOS, and still needs a `shell.nix` to point at the engines.

The underlying reason is that Prisma distributes prebuilt engines per platform, and a "platform" for them means a libc plus an OpenSSL version at a known filesystem path. NixOS has neither at a predictable path, so it does not fit the matrix. Pointing at store paths is the only interface that design leaves open.

The upside is that nixpkgs already builds those engines from source and keeps them versioned, so the work is done. It just has to be wired up per project.

## What happened to the issue?

It was closed as not planned within hours, by `camper-chan`, a bot. The message is a form letter: the issue is not on the roadmap, request a reopen if you disagree.

So I disagreed, in writing, on 16 July 2026. I laid out the three upstream threads, explained that NixOS is declarative and that a dev shell is how it does development dependencies, and pointed out that the proposed `shell.nix` introduces no project-specific workaround, it only declares binaries the project already needs. I asked a direct question: does freeCodeCamp want a frictionless setup for NixOS contributors, or is NixOS too niche to support and contributors are on their own?

Either answer would have been fine. Both are defensible. A project that size has to draw a line somewhere, and "we do not support NixOS" is a legitimate place to draw it, as long as somebody says it.

Nobody did. I followed up on 17 July 2026 asking whether a human had seen the thread at all, since I could not reopen it myself to make it visible. Silence. The issue sits closed, the PR sits unmerged, and the bot has moved on.

I want to be fair here, because it would be easy to be snide instead. freeCodeCamp is a charity, its maintainers are stretched thin, and triage bots exist because the alternative is a backlog nobody can read. Throughput explains the outcome better than malice does. The failure mode stays the same either way: a bot that can close cannot judge, and a contributor whose first patch disappears into that gap learns something discouraging about how contributing goes.

What stings is the timing. The fix was written and tested and sitting in an open PR before the bot ever read the issue.

## Contributing anyway

A closed issue does not delete what you worked out to write it. So this post is where the fix lives now, indexed and linkable, for the next person whose `pnpm i` explodes on a 404 for a file that was never built. That still counts as contributing, even with nobody's merge button involved.

If you are on NixOS and something refuses to install, the answer usually has this shape. Work out what the installer wanted to download, then find the nixpkgs attribute that already builds it and point the tool at the store path. Write it down somewhere a search engine can reach, because the next person is going to hit the same 404.

If freeCodeCamp ever wants the patch, [it is still open](https://github.com/freeCodeCamp/freeCodeCamp/pull/68756).
