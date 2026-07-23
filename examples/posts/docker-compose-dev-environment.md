---
title: Running a dev server in Docker instead of on the host
pubDatetime: 2026-05-20T16:45:00Z
tags:
  - docker
  - web
  - tools
description: Why my projects run pnpm dev inside a container, and the compose file that does it.
---

My host machine has one Node version. My projects want several. Rather than juggle `nvm`, the dev server runs in a container that pins its own.

## The compose file

```yaml
services:
  app:
    image: node:24
    working_dir: /app
    command: sh -c "pnpm install && pnpm dev --host 0.0.0.0"
    ports:
      - 4321:4321
    volumes:
      - ./:/app
      - /app/node_modules
```

## The one line that trips people

The second volume, `/app/node_modules`, is not a typo. It is an anonymous volume that shadows the bind mount for that one directory. Without it, your host `node_modules` (built for your host arch) leaks into the container and native modules break.

## Why --host 0.0.0.0

Inside the container, a dev server bound to `localhost` is reachable only from inside the container. Binding to `0.0.0.0` lets the port forward reach your browser. Forget this and the port looks open but every request hangs.

## What this buys

The project declares its own runtime. A teammate runs `docker compose up` and gets the same Node version I have, without installing anything but Docker. When I delete the project, its toolchain leaves with it.
