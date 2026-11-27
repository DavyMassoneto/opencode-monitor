import { spawnSync } from "node:child_process"
import { PS_FORMAT, PS_PATH } from "./constants"

export function readProcessIdentity(pid: number): string {
  const result = spawnSync(PS_PATH, ["-o", PS_FORMAT, "-p", String(pid)], { encoding: "utf8" })

  if (result.status === 0) {
    return result.stdout.trim()
  }
  return ""
}
