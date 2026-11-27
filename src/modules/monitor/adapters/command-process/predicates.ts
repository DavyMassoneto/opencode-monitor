import { GONE_PROCESS_CODES, PROBE_SIGNAL } from "./constants"

export function isGoneProcessError(error: Error): boolean {
  return "code" in error && typeof error.code === "string" && GONE_PROCESS_CODES.includes(error.code)
}

export function hasGroupMembers(pid: number): boolean {
  try {
    process.kill(-pid, PROBE_SIGNAL)
    return true
  } catch {
    return false
  }
}
