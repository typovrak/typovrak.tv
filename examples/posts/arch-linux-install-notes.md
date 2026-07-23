---
title: Installing Arch Linux the manual way
pubDatetime: 2026-02-11T09:00:00Z
featured: true
tags:
  - arch-linux
  - linux
description: The steps I run through on a fresh Arch install, without archinstall.
---

`archinstall` works, but doing it by hand once is how the pieces stop being magic. These are the notes I keep coming back to.

## Table of contents

## Before booting

Verify the ISO signature, write it with `dd`, and boot in UEFI mode. Check that you are actually in UEFI:

```sh
cat /sys/firmware/efi/fw_platform_size
```

A `64` means UEFI. A missing file means you booted BIOS, and the rest of these notes will not match.

## Partitions

For a single-disk laptop I use three partitions: an EFI system partition, swap, and one root. No separate `/home`, because I reinstall rarely and back up instead.

```sh
fdisk /dev/nvme0n1
mkfs.fat -F32 /dev/nvme0n1p1
mkswap /dev/nvme0n1p2
mkfs.ext4 /dev/nvme0n1p3
```

## Base system

`pacstrap` pulls the base packages. I add the kernel headers and an editor now, because fixing a broken boot without an editor is miserable.

```sh
pacstrap -K /mnt base linux linux-firmware linux-headers neovim
genfstab -U /mnt >> /mnt/etc/fstab
```

Generate the fstab before you chroot, not after. `genfstab` reads the mounts, and inside the chroot they look different.

## Bootloader

I use `systemd-boot` rather than GRUB on UEFI. It is smaller, and the configuration is two files instead of a generated script.

```sh
bootctl install
```

The loader entry points at the kernel and the root partition UUID. Get the UUID wrong and you drop to an emergency shell on first boot, which is the most common mistake I make when I rush this step.

## After first boot

Network, a user, sudo, then the machine is yours. Everything past this point is preference, and that is a separate post.
