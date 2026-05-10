import { execSync } from "child_process";
import * as fs from "fs";
import { NextResponse } from "next/server";

function tryRun(cmd: string): string {
  try { return execSync(cmd, { encoding: "utf8", timeout: 5000 }); }
  catch (e: unknown) { return `ERROR: ${e instanceof Error ? e.message : String(e)}`; }
}

function tryRead(path: string): string {
  try { return fs.readFileSync(path, "utf8"); }
  catch (e: unknown) { return `ERROR: ${e instanceof Error ? e.message : String(e)}`; }
}

function tryReaddir(path: string): string {
  try { return fs.readdirSync(path).join(", "); }
  catch (e: unknown) { return `ERROR: ${e instanceof Error ? e.message : String(e)}`; }
}

export async function GET() {
  return NextResponse.json({
    whoami:               tryRun("whoami"),
    proc1_mounts:         tryRead("/proc/1/mounts"),
    proc_mounts:          tryRead("/proc/mounts"),
    sys_block:            tryReaddir("/sys/block"),
    lsblk_plain:          tryRun("lsblk -b -J -o NAME,SIZE,MOUNTPOINT,FSTYPE,TYPE 2>&1"),
    lsblk_nsenter:        tryRun("nsenter -t 1 -m -- lsblk -b -J -o NAME,SIZE,MOUNTPOINT,FSTYPE,TYPE 2>&1"),
    df_plain:             tryRun("df -B1 2>&1"),
    df_nsenter:           tryRun("nsenter -t 1 -m -- df -B1 2>&1"),
    nsenter_available:    tryRun("which nsenter 2>&1"),
    lsblk_available:      tryRun("which lsblk 2>&1"),
  });
}
