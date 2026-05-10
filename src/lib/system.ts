import { execSync } from "child_process";
import * as fs from "fs";

const DATA_FS_TYPES = new Set(["ext4", "ext3", "ext2", "xfs", "btrfs", "zfs", "f2fs", "ntfs", "exfat", "apfs"]);
const SKIP_MOUNTS = new Set(["/boot", "/boot/efi", "/sys", "/proc", "/dev", "/run"]);
const SKIP_DEVICE_NAMES = /^(loop|ram|zram|sr|fd)/;

export interface DiskUsage {
  filesystem: string;
  total: number;
  used: number;
  available: number;
  usePercent: number;
  mountpoint: string;
}

interface LsblkDevice {
  name: string;
  size: number | string;
  type: string;
  mountpoint?: string | null;
  fstype?: string | null;
  children?: LsblkDevice[];
}

interface DiskInfo {
  name: string;
  total: number;
  mountpoint: string | null;
}

interface DfEntry {
  filesystem: string;
  mountpoint: string;
  used: number;
  available: number;
}

function sh(cmd: string): string {
  return execSync(cmd, { encoding: "utf8", timeout: 5000 });
}

function isRealDisk(d: LsblkDevice): boolean {
  const total = parseInt(String(d.size)) || 0;
  return d.type === "disk" && total > 0 && !SKIP_DEVICE_NAMES.test(d.name);
}

function mountScore(mountpoint: string): number {
  return mountpoint === "/" ? 100 :
    mountpoint.startsWith("/mnt") ? 90 :
    mountpoint.startsWith("/data") ? 80 :
    mountpoint.startsWith("/home") ? 70 :
    mountpoint.startsWith("/var") ? 60 :
    mountpoint.startsWith("/etc") ? 5 : 40;
}

function findBestMountpoint(disk: LsblkDevice): string | null {
  let best: string | null = null;

  function visit(device: LsblkDevice) {
    const mountpoint = device.mountpoint ?? null;
    const fstype = device.fstype ?? "";

    if (mountpoint && DATA_FS_TYPES.has(fstype) && !SKIP_MOUNTS.has(mountpoint)) {
      if (!best || mountScore(mountpoint) > mountScore(best)) {
        best = mountpoint;
      }
    }

    for (const child of device.children ?? []) {
      visit(child);
    }
  }

  visit(disk);
  return best;
}

function listDisks(): DiskInfo[] {
  try {
    const raw = sh("nsenter -t 1 -m -- lsblk -b -J -o NAME,SIZE,TYPE,MOUNTPOINT,FSTYPE 2>/dev/null || lsblk -b -J -o NAME,SIZE,TYPE,MOUNTPOINT,FSTYPE 2>/dev/null");
    const { blockdevices } = JSON.parse(raw.trim()) as { blockdevices: LsblkDevice[] };

    return blockdevices
      .filter(isRealDisk)
      .map((d) => ({
        name: d.name,
        total: parseInt(String(d.size)) || 0,
        mountpoint: findBestMountpoint(d),
      }))
      .filter((d) => d.total > 0);
  } catch {
    const result: DiskInfo[] = [];

    try {
      for (const name of fs.readdirSync("/sys/block")) {
        if (SKIP_DEVICE_NAMES.test(name)) continue;

        try {
          const sectors = parseInt(fs.readFileSync(`/sys/block/${name}/size`, "utf8").trim());
          if (sectors > 0) {
            result.push({ name, total: sectors * 512, mountpoint: null });
          }
        } catch { /* skip */ }
      }
    } catch { /* ignore */ }

    return result;
  }
}

function diskNameFromDevice(filesystem: string): string | null {
  if (!filesystem.startsWith("/dev/")) return null;
  return filesystem.replace(/^\/dev\//, "");
}

function deviceBelongsToDisk(filesystem: string, diskName: string): boolean {
  const device = diskNameFromDevice(filesystem);
  if (!device) return false;
  if (device === diskName) return true;

  const partitionSuffix = device.slice(diskName.length);
  return device.startsWith(diskName) && (/^\d+$/.test(partitionSuffix) || /^p\d+$/.test(partitionSuffix));
}

function bestDfEntryForDisk(diskName: string, entries: DfEntry[]): DfEntry | null {
  let best: DfEntry | null = null;

  for (const entry of entries) {
    if (SKIP_MOUNTS.has(entry.mountpoint)) continue;
    if (!deviceBelongsToDisk(entry.filesystem, diskName)) continue;

    if (!best || mountScore(entry.mountpoint) > mountScore(best.mountpoint)) {
      best = entry;
    }
  }

  return best;
}

function dfStats(): DfEntry[] {
  const entries: DfEntry[] = [];

  try {
    const out = sh("nsenter -t 1 -m -- df -P -B1 2>/dev/null || df -P -B1");
    for (const line of out.trim().split("\n").slice(1)) {
      const p = line.trim().split(/\s+/);
      if (p.length < 6) continue;

      entries.push({
        filesystem: p[0],
        mountpoint: p[p.length - 1],
        used: parseInt(p[p.length - 4]) || 0,
        available: parseInt(p[p.length - 3]) || 0,
      });
    }
  } catch { /* ignore */ }

  return entries;
}

export function getDiskUsage(): DiskUsage[] {
  const disks = listDisks();
  const df = dfStats();

  return disks.map((disk) => {
    const dfEntry = disk.mountpoint
      ? df.find((entry) => entry.mountpoint === disk.mountpoint) ?? bestDfEntryForDisk(disk.name, df)
      : bestDfEntryForDisk(disk.name, df);
    const mount = disk.mountpoint ?? dfEntry?.mountpoint ?? null;
    const used = dfEntry?.used ?? 0;
    const available = dfEntry?.available ?? 0;
    const usePercent = disk.total > 0 ? Math.round((used / disk.total) * 100) : 0;
    const mountpoint = mount
      ? mount.startsWith("/etc/") ? `/dev/${disk.name}` : mount
      : "Not mounted";

    return {
      filesystem: disk.name,
      total: disk.total,
      used,
      available,
      usePercent,
      mountpoint,
    };
  });
}

export function getUptime(): number {
  try {
    const output = execSync("cat /proc/uptime", { encoding: "utf8" });
    return parseFloat(output.split(" ")[0]) || 0;
  } catch {
    return 0;
  }
}

export function getMemoryUsage(): { total: number; used: number; free: number } {
  try {
    const output = execSync("cat /proc/meminfo", { encoding: "utf8" });
    const lines = output.split("\n");
    const get = (key: string) => {
      const line = lines.find((l) => l.startsWith(key));
      return line ? parseInt(line.split(/\s+/)[1]) * 1024 : 0;
    };
    const total = get("MemTotal:");
    const free = get("MemFree:");
    const buffers = get("Buffers:");
    const cached = get("Cached:");
    const used = total - free - buffers - cached;
    return { total, used: Math.max(used, 0), free: total - used };
  } catch {
    return { total: 0, used: 0, free: 0 };
  }
}
